import React, { useState } from 'react';

const SlideGenerator = () => {
  const [lecturePoints, setLecturePoints] = useState('');
  const [slides, setSlides] = useState([]);
  
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
  
  return (
    <div className="flex flex-col p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Lecture Slide Generator</h1>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Enter your lecture points (use # for new slide titles):
        </label>
        <textarea
          className="w-full h-48 p-2 border border-gray-300 rounded"
          value={lecturePoints}
          onChange={(e) => setLecturePoints(e.target.value)}
          placeholder="# Introduction&#10;First point&#10;Second point&#10;# Main Topic&#10;Another important point"
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={generateSlides}
        >
          Generate Slides
        </button>
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
                  <div className="bg-gray-200 h-48 flex items-center justify-center rounded">
                    <p className="text-sm text-gray-600 p-2 text-center">
                      Image placeholder: {slide.imagePrompt}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-4">
            <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Export to PowerPoint
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlideGenerator;
