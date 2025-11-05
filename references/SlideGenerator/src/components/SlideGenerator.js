import React, { useState } from 'react';
import pptxgen from 'pptxgenjs';
import { saveAs } from 'file-saver';
import { GoogleGenerativeAI } from '@google/generative-ai';
import JSZip from 'jszip';

const SlideGenerator = () => {
  const [lecturePoints, setLecturePoints] = useState('');
  const [slides, setSlides] = useState([]);
  const [generatedImages, setGeneratedImages] = useState({});
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState({ current: 0, total: 0 });
  const [geminiApiKey, setGeminiApiKey] = useState('');
  
  const generateSlides = () => {
    // Split input by lines and filter empty lines
    const points = lecturePoints
      .split('\n')
      .filter(point => point.trim() !== '');
    
    // Simple algorithm to group points into slides
    // This is where you'd implement your grouping logic
    const newSlides = [];
    let currentSlide = { title: 'Introduction', points: [], imagePrompt: '' };
    
    points.forEach((point, index) => {
      // If point starts with # treat as new slide title
      if (point.startsWith('#')) {
        if (currentSlide.points.length > 0) {
          // Generate image prompt based on slide content
          currentSlide.imagePrompt = `Illustration of ${currentSlide.title.toLowerCase()}`;
          newSlides.push(currentSlide);
        }
        currentSlide = { 
          title: point.replace('#', '').trim(), 
          points: [],
          imagePrompt: ''
        };
      } else {
        // Add point to current slide
        currentSlide.points.push(point.trim());
      }
    });
    
    // Add the last slide
    if (currentSlide.points.length > 0) {
      currentSlide.imagePrompt = `Illustration of ${currentSlide.title.toLowerCase()}`;
      newSlides.push(currentSlide);
    }
    
    setSlides(newSlides);
  };
  
  // Generate PNG images using Gemini's native image generation
  const generateImagesWithGemini = async () => {
    if (!geminiApiKey) {
      alert('Please enter your Gemini API key first!');
      return;
    }

    setIsGeneratingImages(true);
    setImageGenerationProgress({ current: 0, total: slides.length });
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    
    // Use the image generation model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-image-preview',
      generationConfig: {
        responseModalities: ['Text', 'Image']
      }
    });
    
    const newGeneratedImages = {};
    
    try {
      for (let i = 0; i < slides.length; i++) {
        setImageGenerationProgress({ current: i + 1, total: slides.length });
        const slide = slides[i];
        
        // Create a detailed prompt for infographic generation
        const infographicPrompt = `Create a professional infographic for a presentation slide titled "${slide.title}". Include these key points: ${slide.points.join(', ')}. Make it clean, modern, and visually appealing with appropriate icons, charts, or diagrams. Use a cohesive color scheme suitable for business presentations. The layout should be clear and easy to read from a distance.`;
        
        console.log(`Generating image ${i + 1}/${slides.length}: ${slide.title}`);
        
        const result = await model.generateContent(infographicPrompt);
        const response = await result.response;
        
        // Extract image data from response
        let imageDataUrl = null;
        let description = '';
        
        for (const candidate of response.candidates || []) {
          for (const part of candidate.content.parts || []) {
            if (part.inlineData) {
              // Convert base64 to data URL
              const mimeType = part.inlineData.mimeType || 'image/png';
              const base64Data = part.inlineData.data;
              imageDataUrl = `data:${mimeType};base64,${base64Data}`;
            } else if (part.text) {
              description += part.text;
            }
          }
        }
        
        if (imageDataUrl) {
          newGeneratedImages[i] = {
            description: description || `AI-generated infographic for ${slide.title}`,
            dataUrl: imageDataUrl
          };
        } else {
          // Fallback to text-based visualization if image generation fails
          console.log(`Image generation failed for slide ${i + 1}, falling back to text visualization`);
          newGeneratedImages[i] = {
            description: `Fallback visualization for ${slide.title}`,
            dataUrl: await createTextBasedVisualization(slide.title, slide.points, description)
          };
        }
      }
      
      setGeneratedImages(newGeneratedImages);
    } catch (error) {
      console.error('Error generating images:', error);
      alert(`Error generating images with Gemini: ${error.message}. Please check your API key and try again.`);
    } finally {
      setIsGeneratingImages(false);
      setImageGenerationProgress({ current: 0, total: 0 });
    }
  };
  
  // Create a text-based visualization as PNG
  const createTextBasedVisualization = async (title, points, description) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      // Background
      const gradient = ctx.createLinearGradient(0, 0, 0, 600);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 800, 600);
      
      // Title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, 400, 80);
      
      // Points
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      points.forEach((point, index) => {
        const y = 150 + (index * 40);
        
        // Bullet point
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(100, y - 5, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Text
        ctx.fillStyle = '#374151';
        const words = point.split(' ');
        let line = '';
        let lineY = y;
        
        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 600 && line !== '') {
            ctx.fillText(line, 120, lineY);
            line = word + ' ';
            lineY += 25;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, 120, lineY);
      });
      
      // AI-generated description (truncated)
      if (description) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#6b7280';
        ctx.textAlign = 'center';
        const truncatedDesc = description.substring(0, 200) + '...';
        const words = truncatedDesc.split(' ');
        let line = '';
        let lineY = 500;
        
        words.forEach(word => {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 700 && line !== '') {
            ctx.fillText(line, 400, lineY);
            line = word + ' ';
            lineY += 18;
          } else {
            line = testLine;
          }
        });
        ctx.fillText(line, 400, lineY);
      }
      
      resolve(canvas.toDataURL('image/png'));
    });
  };
  
  // Export to PowerPoint with generated PNGs
  const exportToPowerPoint = async () => {
    const pres = new pptxgen();
    
    for (let i = 0; i < slides.length; i++) {
      const slideData = slides[i];
      const slide = pres.addSlide();
      
      if (generatedImages[i]) {
        // Add the generated PNG image
        slide.addImage({
          data: generatedImages[i].dataUrl,
          x: 0.5,
          y: 0.5,
          w: 9,
          h: 6.75
        });
      } else {
        // Fallback to text-based slide
        slide.addText(slideData.title, {
          x: 0.5, 
          y: 0.5, 
          fontSize: 24,
          bold: true,
          color: '363636'
        });
        
        const bulletPoints = slideData.points.map(point => ({ text: point }));
        slide.addText(bulletPoints, {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 5,
          fontSize: 16,
          bullet: true
        });
      }
    }
    
    pres.writeFile({ fileName: 'ai-generated-slides.pptx' });
  };
  
  return (
    <div className="flex flex-col p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Lecture Slide Generator</h1>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Gemini API Key:
        </label>
        <input
          type="password"
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          value={geminiApiKey}
          onChange={(e) => setGeminiApiKey(e.target.value)}
          placeholder="Enter your Gemini API key"
        />
        
        <label className="block mb-2 font-medium">
          Enter your lecture points (use # for new slide titles):
        </label>
        <textarea
          className="w-full h-48 p-2 border border-gray-300 rounded"
          value={lecturePoints}
          onChange={(e) => setLecturePoints(e.target.value)}
          placeholder="# Introduction&#10;First point&#10;Second point&#10;# Main Topic&#10;Another important point"
        />
        <div className="mt-2 space-x-2">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={generateSlides}
          >
            Generate Slides
          </button>
          {slides.length > 0 && (
            <button
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              onClick={generateImagesWithGemini}
              disabled={isGeneratingImages}
            >
              {isGeneratingImages ? 
                `Generating AI Infographics... (${imageGenerationProgress.current}/${imageGenerationProgress.total})` : 
                'Generate AI Infographics with Gemini'
              }
            </button>
          )}
        </div>
      </div>
      
      {slides.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-xl font-bold">Generated Slides Preview:</h2>
          
          {slides.map((slide, index) => (
            <div key={index} className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-100 p-4 border-b border-gray-300">
                <h3 className="text-lg font-bold">{slide.title}</h3>
              </div>
              <div className="p-4 flex">
                <div className="w-1/2">
                  <ul className="list-disc pl-6 space-y-2">
                    {slide.points.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
                <div className="w-1/2 pl-4">
                  {generatedImages[index] ? (
                    <div className="space-y-2">
                      <img 
                        src={generatedImages[index].dataUrl} 
                        alt={`AI-generated infographic for ${slide.title}`}
                        className="w-full h-48 object-contain rounded border bg-white"
                      />
                      <div className="bg-green-50 p-2 rounded text-xs">
                        <p className="font-semibold text-green-800">✓ AI-Generated Infographic</p>
                        <p className="text-green-600">
                          {generatedImages[index].description.substring(0, 120)}...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 h-48 flex items-center justify-center rounded border-2 border-dashed border-gray-300">
                      <div className="text-center p-4">
                        <div className="mb-2">
                          {isGeneratingImages ? (
                            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                          ) : (
                            <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {isGeneratingImages ? 'Generating AI infographic...' : 'Click "Generate AI Infographics" to create visual content'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Export Options</h3>
            <div className="flex space-x-4">
              <button 
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium shadow-md transition-colors"
                onClick={exportToPowerPoint}
              >
                {Object.keys(generatedImages).length > 0 ? 
                  `📊 Export ${Object.keys(generatedImages).length} AI-Enhanced Slides to PowerPoint` : 
                  '📄 Export Text-Only Slides to PowerPoint'
                }
              </button>
              {Object.keys(generatedImages).length > 0 && (
                <div className="flex items-center text-sm text-green-700">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path>
                  </svg>
                  AI infographics ready
                </div>
              )}
            </div>
            <p className="text-sm text-blue-600 mt-2">
              {Object.keys(generatedImages).length > 0 ? 
                'Each slide will contain a professionally generated AI infographic with your content.' :
                'Generate AI infographics first to create visually enhanced slides.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlideGenerator;