import pptx from 'pptxgenjs';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { SynthesizedStrategy } from './aiOrchestrationService';
import { PresentationOptions } from './presentationService';
import { GraphicsGenerationService } from './graphicsGenerationService';

export interface EnhancementRequest {
  presentationGoals: string;
  targetAudience: string;
  preferredStyle: 'professional' | 'creative' | 'modern' | 'academic' | 'corporate';
  colorScheme: 'vibrant' | 'muted' | 'monochrome' | 'custom';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  includeVisuals: boolean;
  emphasizePoints?: string[];
  additionalInstructions?: string;
}

export interface EnhancedSlideContent {
  title: string;
  content: string[];
  visualElements?: {
    type: 'chart' | 'diagram' | 'icon' | 'image_placeholder';
    description: string;
    position: 'left' | 'right' | 'center' | 'background';
  }[];
  designNotes: string;
}

export interface GeminiPresentationPlan {
  theme: {
    name: string;
    description: string;
    colorPalette: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
  };
  slides: EnhancedSlideContent[];
  overallDesignConcepts: string[];
}

export class EnhancedPresentationService {
  private outputDir: string;
  private geminiApiKey: string;
  private geminiEndpoint: string;
  private ollamaBaseUrl: string;
  private ollamaModel: string;
  private graphicsService: GraphicsGenerationService;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp');
    this.ensureOutputDirectory();
    this.geminiApiKey = process.env.GEMINI_API_KEY || '';
    this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
    this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2:90b';
    this.graphicsService = new GraphicsGenerationService();
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateEnhancedPresentation(
    strategy: SynthesizedStrategy,
    enhancementRequest: EnhancementRequest,
    options: PresentationOptions = {}
  ): Promise<string> {
    console.log('Starting enhanced presentation generation with real graphics...');

    // Get AI-enhanced presentation plan from Gemini/Ollama/Fallback
    const presentationPlan = await this.generatePresentationPlan(strategy, enhancementRequest);
    console.log('Presentation plan generated:', presentationPlan.theme.name);

    // Create the enhanced PowerPoint presentation
    const presentation = new pptx();
    
    // Configure presentation with AI-generated theme
    this.configureEnhancedPresentation(presentation, presentationPlan, options);

    // Generate slides based on AI plan with real graphics
    console.log('Generating slides with charts, diagrams, and icons...');
    await this.generateSlidesFromPlan(presentation, presentationPlan, strategy, options);

    // Generate unique filename
    const filename = this.generateEnhancedFilename(enhancementRequest, options);
    const filepath = path.join(this.outputDir, filename);
    
    await presentation.writeFile({ fileName: filepath });
    
    // Clean up old graphics files
    setTimeout(() => {
      this.graphicsService.cleanupTempFiles();
    }, 5000); // 5 second delay to ensure presentation is written
    
    console.log('Enhanced presentation generated:', filename);
    return filename;
  }

  private async generatePresentationPlan(
    strategy: SynthesizedStrategy,
    enhancementRequest: EnhancementRequest
  ): Promise<GeminiPresentationPlan> {
    const prompt = this.buildEnhancementPrompt(strategy, enhancementRequest);
    
    try {
      const response = await axios.post(
        `${this.geminiEndpoint}?key=${this.geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
            topK: 40,
            topP: 0.95
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.candidates[0].content.parts[0].text;
      return this.parsePresentationPlan(content);
    } catch (error) {
      console.error('Error generating presentation plan with Gemini:', error);
      console.log('Attempting Ollama Llama 3.2 90B fallback...');
      
      try {
        return await this.generatePresentationPlanWithOllama(strategy, enhancementRequest);
      } catch (ollamaError) {
        console.error('Error generating presentation plan with Ollama:', ollamaError);
        console.log('Using local fallback presentation plan...');
        return this.generateFallbackPlan(strategy, enhancementRequest);
      }
    }
  }

  private buildEnhancementPrompt(
    strategy: SynthesizedStrategy,
    enhancementRequest: EnhancementRequest
  ): string {
    return `
🎨 CREATIVE PRESENTATION ENHANCEMENT REQUEST

You are an expert presentation designer and legal communication specialist. Create a comprehensive, visually stunning PowerPoint presentation plan that transforms legal strategy content into engaging, professional slides.

📋 LEGAL STRATEGY CONTENT:
${JSON.stringify(strategy, null, 2)}

🎯 ENHANCEMENT SPECIFICATIONS:
• **Presentation Goals**: ${enhancementRequest.presentationGoals}
• **Target Audience**: ${enhancementRequest.targetAudience}
• **Preferred Style**: ${enhancementRequest.preferredStyle}
• **Color Scheme**: ${enhancementRequest.colorScheme}
• **Include Visuals**: ${enhancementRequest.includeVisuals}
• **Emphasize Points**: ${enhancementRequest.emphasizePoints?.join(', ') || 'None specified'}
• **Additional Instructions**: ${enhancementRequest.additionalInstructions || 'None'}

🎨 DESIGN REQUIREMENTS:
Create a presentation plan that is:
1. **Visually Compelling**: Use colors, layouts, and visual elements strategically
2. **Professionally Appropriate**: Maintain legal industry standards while being creative
3. **Audience-Focused**: Tailor content presentation to the specified audience
4. **Story-Driven**: Create a logical flow that builds a compelling narrative
5. **Action-Oriented**: Focus on clear takeaways and next steps

Generate your response in this exact JSON format:

{
  "theme": {
    "name": "Creative theme name that reflects the legal strategy",
    "description": "Brief description of the visual approach and why it works",
    "colorPalette": {
      "primary": "#HEX_COLOR (main brand color)",
      "secondary": "#HEX_COLOR (supporting color)", 
      "accent": "#HEX_COLOR (highlight color)",
      "background": "#HEX_COLOR (background color)",
      "text": "#HEX_COLOR (text color)"
    }
  },
  "slides": [
    {
      "title": "Compelling slide title",
      "content": [
        "Key point 1 - engaging and concise",
        "Key point 2 - action-oriented",
        "Key point 3 - evidence-based"
      ],
      "visualElements": [
        {
          "type": "chart|diagram|icon|image_placeholder",
          "description": "Detailed description of visual element",
          "position": "left|right|center|background"
        }
      ],
      "designNotes": "Specific design guidance for this slide"
    }
  ],
  "overallDesignConcepts": [
    "Design concept 1 - visual hierarchy approach",
    "Design concept 2 - color usage strategy", 
    "Design concept 3 - typography and spacing",
    "Design concept 4 - visual element integration"
  ]
}

🎯 SLIDE STRUCTURE REQUIREMENTS:
Create 8-12 slides following this enhanced structure:
1. **Dynamic Title Slide** - Eye-catching introduction
2. **Executive Summary** - Visually compelling overview
3. **Case Strengths Showcase** - Strong visual hierarchy
4. **Challenge & Solution Matrix** - Clear problem-solution pairing
5. **Strategic Roadmap** - Timeline with visual milestones
6. **Risk & Mitigation Dashboard** - Clear risk visualization
7. **Expected Outcomes Forecast** - Probability visualizations
8. **Alternative Pathways** - Decision tree or flowchart
9. **Implementation Timeline** - Detailed project planning
10. **Next Steps & Call to Action** - Clear action items

CRITICAL: Make every slide visually distinctive while maintaining professional coherence. Use the specified color scheme creatively but appropriately for legal presentations. Focus on making complex legal concepts accessible and engaging through visual storytelling.
`;
  }

  private async generatePresentationPlanWithOllama(
    strategy: SynthesizedStrategy,
    enhancementRequest: EnhancementRequest
  ): Promise<GeminiPresentationPlan> {
    const prompt = this.buildEnhancementPrompt(strategy, enhancementRequest);
    
    console.log(`Calling Ollama at ${this.ollamaBaseUrl} with model ${this.ollamaModel}...`);
    
    const response = await axios.post(`${this.ollamaBaseUrl}/api/generate`, {
      model: this.ollamaModel,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        num_predict: 4000
      }
    }, {
      timeout: 60000 // 60 second timeout
    });

    const content = response.data.response;
    return this.parsePresentationPlan(content);
  }

  private parsePresentationPlan(content: string): GeminiPresentationPlan {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing AI presentation plan:', error);
    }

    // Return fallback plan if parsing fails
    return this.generateBasicPlan();
  }

  private generateFallbackPlan(
    strategy: SynthesizedStrategy,
    enhancementRequest: EnhancementRequest
  ): GeminiPresentationPlan {
    const colorScheme = this.getEnhancedColorScheme(enhancementRequest);
    
    return {
      theme: {
        name: `Enhanced ${enhancementRequest.preferredStyle} Legal Strategy`,
        description: `Professional ${enhancementRequest.preferredStyle} presentation with ${enhancementRequest.colorScheme} color palette (Local Fallback Design)`,
        colorPalette: colorScheme
      },
      slides: [
        {
          title: "📋 Legal Strategy Overview",
          content: [
            strategy.executiveSummary || "Comprehensive legal strategy analysis",
            "Tailored approach based on case specifics",
            "Professional presentation designed for your goals"
          ],
          visualElements: [{
            type: 'icon',
            description: 'Legal scales and justice icon',
            position: 'right'
          }],
          designNotes: "Bold title with professional color scheme and legal iconography"
        },
        {
          title: "💪 Key Strengths & Advantages",
          content: strategy.keyStrengths || [
            "Strong legal foundation",
            "Evidence-based approach",
            "Strategic positioning"
          ],
          visualElements: [{
            type: 'chart',
            description: 'Strength assessment visualization with progress indicators',
            position: 'center'
          }],
          designNotes: "Visual hierarchy with strength indicators and accent colors"
        },
        {
          title: "⚠️ Risk Analysis & Mitigation",
          content: strategy.potentialWeaknesses || [
            "Identified potential challenges",
            "Proactive mitigation strategies",
            "Risk management approach"
          ],
          visualElements: [{
            type: 'diagram',
            description: 'Risk assessment matrix with mitigation strategies',
            position: 'center'
          }],
          designNotes: "Clear risk visualization with actionable mitigation plans"
        },
        {
          title: "🎯 Recommended Strategic Approach",
          content: [
            strategy.recommendedApproach || "Strategic recommendation based on comprehensive analysis",
            "Evidence-driven decision making",
            "Goal-oriented execution plan"
          ],
          visualElements: [{
            type: 'diagram',
            description: 'Strategic pathway flowchart',
            position: 'center'
          }],
          designNotes: "Clear strategic direction with visual flow indicators"
        },
        {
          title: "📅 Timeline & Implementation",
          content: strategy.tacticalConsiderations || [
            "Structured implementation timeline",
            "Key milestone identification",
            "Progress tracking mechanisms"
          ],
          visualElements: [{
            type: 'chart',
            description: 'Timeline visualization with milestones',
            position: 'center'
          }],
          designNotes: "Timeline visualization with clear milestone markers"
        },
        {
          title: "✅ Next Steps & Action Items",
          content: [
            "Immediate action items identified",
            "Resource requirements outlined",
            "Success metrics established"
          ],
          visualElements: [{
            type: 'icon',
            description: 'Action checklist and arrow icons',
            position: 'right'
          }],
          designNotes: "Action-oriented design with clear next steps visualization"
        }
      ],
      overallDesignConcepts: [
        `${enhancementRequest.preferredStyle} design approach with ${enhancementRequest.colorScheme} color scheme`,
        "Professional typography with enhanced readability", 
        "Strategic use of visual elements and whitespace",
        "Consistent branding and legal industry standards",
        "Audience-focused content presentation",
        "Enhanced visual storytelling elements"
      ]
    };
  }

  private generateBasicPlan(): GeminiPresentationPlan {
    return {
      theme: {
        name: "Professional Legal Strategy",
        description: "Clean, professional presentation design",
        colorPalette: {
          primary: "#1F4E79",
          secondary: "#7F7F7F",
          accent: "#70AD47",
          background: "#FFFFFF",
          text: "#000000"
        }
      },
      slides: [{
        title: "Legal Strategy Presentation",
        content: ["Professional legal strategy presentation"],
        designNotes: "Clean and professional layout"
      }],
      overallDesignConcepts: ["Professional design approach"]
    };
  }

  private configureEnhancedPresentation(
    presentation: any,
    plan: GeminiPresentationPlan,
    options: PresentationOptions
  ): void {
    presentation.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
    presentation.layout = 'LAYOUT_16x9';

    // Set master slide with AI-generated theme
    presentation.defineSlideMaster({
      title: 'ENHANCED_MASTER',
      background: { fill: plan.theme.colorPalette.background },
      objects: [
        {
          placeholder: {
            options: { name: 'title', type: 'title', x: 0.5, y: 0.2, w: 9, h: 1 },
            text: options.firmName || 'Enhanced Legal Strategy'
          }
        }
      ]
    });
  }

  private async generateSlidesFromPlan(
    presentation: any,
    plan: GeminiPresentationPlan,
    strategy: SynthesizedStrategy,
    options: PresentationOptions
  ): Promise<void> {
    // Generate each slide based on the AI plan
    for (let i = 0; i < plan.slides.length; i++) {
      const slideContent = plan.slides[i];
      const slide = presentation.addSlide();

      // Add title
      slide.addText(slideContent.title, {
        x: 0.5,
        y: 0.2,
        w: 9,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: plan.theme.colorPalette.primary
      });

      // Add content
      if (slideContent.content.length > 0) {
        const contentText = slideContent.content.map(item => `• ${item}`).join('\n');
        slide.addText(contentText, {
          x: 0.5,
          y: 1.2,
          w: 9,
          h: 4,
          fontSize: 16,
          color: plan.theme.colorPalette.text,
          bullet: true
        });
      }

      // Add visual elements with real graphics generation
      if (slideContent.visualElements && slideContent.visualElements.length > 0) {
        for (const visual of slideContent.visualElements) {
          await this.addVisualElement(slide, visual, plan.theme.colorPalette, strategy);
        }
      }
    }

    // Add closing slide
    this.addEnhancedClosingSlide(presentation, plan.theme.colorPalette, options);
  }

  private async addVisualElement(
    slide: any,
    visual: any,
    colorPalette: any,
    strategy: SynthesizedStrategy
  ): Promise<void> {
    if (!visual) return;

    try {
      let imagePath: string | null = null;

      switch (visual.type) {
        case 'chart':
          imagePath = await this.generateChartForSlide(visual, colorPalette, strategy);
          break;
        case 'diagram':
          imagePath = await this.generateDiagramForSlide(visual, colorPalette, strategy);
          break;
        case 'icon':
          imagePath = this.generateIconForSlide(visual, colorPalette);
          break;
        default:
          // Fallback to text placeholder
          slide.addText(`[Visual: ${visual.description}]`, {
            x: 1,
            y: 3,
            w: 8,
            h: 1,
            color: colorPalette.accent,
            fontSize: 12,
            align: 'center'
          });
          return;
      }

      if (imagePath && fs.existsSync(imagePath)) {
        // Add image to slide
        const position = this.getImagePosition(visual.position);
        slide.addImage({
          path: imagePath,
          x: position.x,
          y: position.y,
          w: position.w,
          h: position.h
        });
      } else {
        // Fallback to text if image generation failed
        slide.addText(`[${visual.type}: ${visual.description}]`, {
          x: 1,
          y: 3,
          w: 8,
          h: 1,
          color: colorPalette.accent,
          fontSize: 12,
          align: 'center'
        });
      }
    } catch (error) {
      console.error('Error adding visual element:', error);
      // Fallback to text placeholder
      slide.addText(`[${visual.type}: ${visual.description}]`, {
        x: 1,
        y: 3,
        w: 8,
        h: 1,
        color: colorPalette.accent,
        fontSize: 12,
        align: 'center'
      });
    }
  }

  private async generateChartForSlide(visual: any, colorPalette: any, strategy: SynthesizedStrategy): Promise<string | null> {
    try {
      let chartConfig;

      // Determine chart type based on description
      if (visual.description.toLowerCase().includes('strength')) {
        chartConfig = this.graphicsService.createStrengthChart(strategy.keyStrengths || [], colorPalette);
      } else if (visual.description.toLowerCase().includes('risk')) {
        chartConfig = this.graphicsService.createRiskChart(strategy.potentialWeaknesses || [], colorPalette);
      } else {
        // Generic chart
        chartConfig = {
          type: 'bar' as const,
          data: {
            labels: ['Category 1', 'Category 2', 'Category 3'],
            datasets: [{
              label: 'Analysis',
              data: [75, 60, 85],
              backgroundColor: [colorPalette.primary, colorPalette.accent, colorPalette.secondary]
            }]
          }
        };
      }

      return await this.graphicsService.generateChart(chartConfig, colorPalette);
    } catch (error) {
      console.error('Error generating chart:', error);
      return null;
    }
  }

  private async generateDiagramForSlide(visual: any, colorPalette: any, strategy: SynthesizedStrategy): Promise<string | null> {
    try {
      let diagramConfig;

      if (visual.description.toLowerCase().includes('timeline') || 
          visual.description.toLowerCase().includes('flowchart')) {
        diagramConfig = this.graphicsService.createTimelineFlowchart(
          strategy.timelineAndMilestones || [], 
          colorPalette
        );
      } else {
        // Generic flowchart
        diagramConfig = {
          type: 'flowchart' as const,
          content: `
            flowchart TD
              A[Start] --> B{Decision}
              B -->|Yes| C[Action 1]
              B -->|No| D[Action 2]
              C --> E[End]
              D --> E
              
              style A fill:${colorPalette.primary}
              style E fill:${colorPalette.accent}
          `
        };
      }

      return await this.graphicsService.generateDiagram(diagramConfig, colorPalette);
    } catch (error) {
      console.error('Error generating diagram:', error);
      return null;
    }
  }

  private generateIconForSlide(visual: any, colorPalette: any): string | null {
    try {
      // Determine icon type based on description
      let iconType = 'scales'; // default
      
      if (visual.description.toLowerCase().includes('gavel') || 
          visual.description.toLowerCase().includes('judge')) {
        iconType = 'gavel';
      } else if (visual.description.toLowerCase().includes('document') || 
                 visual.description.toLowerCase().includes('contract')) {
        iconType = 'document';
      } else if (visual.description.toLowerCase().includes('shield') || 
                 visual.description.toLowerCase().includes('protection')) {
        iconType = 'shield';
      }

      return this.graphicsService.generateLegalIcon(iconType, colorPalette);
    } catch (error) {
      console.error('Error generating icon:', error);
      return null;
    }
  }

  private getImagePosition(position: string): { x: number, y: number, w: number, h: number } {
    switch (position) {
      case 'left':
        return { x: 0.5, y: 2, w: 3, h: 2.5 };
      case 'right':
        return { x: 6, y: 2, w: 3, h: 2.5 };
      case 'center':
        return { x: 2, y: 2.5, w: 6, h: 3 };
      case 'background':
        return { x: 0, y: 0, w: 10, h: 5.625 };
      default:
        return { x: 2, y: 2.5, w: 6, h: 3 };
    }
  }

  private addEnhancedClosingSlide(
    presentation: any,
    colorPalette: any,
    options: PresentationOptions
  ): void {
    const slide = presentation.addSlide();

    slide.addText('Thank You', {
      x: 1,
      y: 1.5,
      w: 8,
      h: 1,
      fontSize: 36,
      bold: true,
      color: colorPalette.primary,
      align: 'center'
    });

    slide.addText('Questions & Discussion', {
      x: 1,
      y: 2.8,
      w: 8,
      h: 0.8,
      fontSize: 24,
      color: colorPalette.secondary,
      align: 'center'
    });

    if (options.lawyerName || options.firmName) {
      slide.addText(`${options.lawyerName || ''}\n${options.firmName || ''}`, {
        x: 1,
        y: 4.5,
        w: 8,
        h: 1,
        fontSize: 14,
        color: colorPalette.text,
        align: 'center'
      });
    }
  }

  private getEnhancedColorScheme(enhancementRequest: EnhancementRequest): any {
    if (enhancementRequest.colorScheme === 'custom' && enhancementRequest.customColors) {
      return {
        primary: enhancementRequest.customColors.primary,
        secondary: enhancementRequest.customColors.secondary,
        accent: enhancementRequest.customColors.accent,
        background: enhancementRequest.customColors.background,
        text: '#000000'
      };
    }

    switch (enhancementRequest.colorScheme) {
      case 'vibrant':
        return {
          primary: '#2E86AB',
          secondary: '#A23B72', 
          accent: '#F18F01',
          background: '#FFFFFF',
          text: '#333333'
        };
      case 'muted':
        return {
          primary: '#5D737E',
          secondary: '#A8BABC',
          accent: '#B85042',
          background: '#F7F7F7',
          text: '#2F2F2F'
        };
      case 'monochrome':
        return {
          primary: '#2F2F2F',
          secondary: '#666666',
          accent: '#999999',
          background: '#FFFFFF',
          text: '#000000'
        };
      default:
        return {
          primary: '#1F4E79',
          secondary: '#7F7F7F',
          accent: '#70AD47',
          background: '#FFFFFF',
          text: '#000000'
        };
    }
  }

  private generateEnhancedFilename(
    enhancementRequest: EnhancementRequest,
    options: PresentationOptions
  ): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const caseTitle = options.caseTitle?.replace(/[^a-zA-Z0-9]/g, '_') || 'strategy';
    const style = enhancementRequest.preferredStyle;
    return `enhanced_${style}_${caseTitle}_${timestamp}_${Date.now()}.pptx`;
  }

  async getPresentation(filename: string): Promise<Buffer | null> {
    const filepath = path.join(this.outputDir, filename);
    
    try {
      if (fs.existsSync(filepath)) {
        return fs.readFileSync(filepath);
      }
      return null;
    } catch (error) {
      console.error('Error reading enhanced presentation file:', error);
      return null;
    }
  }

  async deletePresentation(filename: string): Promise<boolean> {
    const filepath = path.join(this.outputDir, filename);
    
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting enhanced presentation file:', error);
      return false;
    }
  }
}