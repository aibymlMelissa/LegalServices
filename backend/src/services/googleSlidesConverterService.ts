import { google } from 'googleapis';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { SynthesizedStrategy } from './aiOrchestrationService';
import { GraphicsGenerationService } from './graphicsGenerationService';

export interface GoogleSlidesTemplate {
  title: string;
  slides: GoogleSlideContent[];
  theme: {
    backgroundColor: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

export interface GoogleSlideContent {
  title: string;
  content: string[];
  layout: 'TITLE_SLIDE' | 'TITLE_AND_BODY' | 'TITLE_AND_TWO_COLUMNS' | 'TITLE_ONLY' | 'BLANK';
  graphics?: {
    type: 'chart' | 'diagram' | 'icon';
    imagePath: string;
    position: { x: number; y: number; width: number; height: number };
  }[];
}

export class GoogleSlidesConverterService {
  private outputDir: string;
  private graphicsService: GraphicsGenerationService;
  private auth: any;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp');
    this.graphicsService = new GraphicsGenerationService();
    this.initializeAuth();
  }

  private initializeAuth() {
    // For now, we'll create presentations without auth and export them
    // In production, you'd set up OAuth2 or service account
    this.auth = null;
  }

  async createGoogleSlidesPresentationWithGraphics(
    strategy: SynthesizedStrategy,
    enhancementRequest: any,
    colorPalette: any
  ): Promise<string> {
    try {
      console.log('Creating Google Slides presentation with graphics...');

      // Generate graphics first
      const graphics = await this.generateAllGraphics(strategy, colorPalette);
      
      // Create presentation template
      const template = await this.createPresentationTemplate(strategy, enhancementRequest, colorPalette, graphics);
      
      // For now, we'll create a detailed HTML version that can be converted
      const htmlPresentation = await this.createHTMLPresentation(template);
      
      // Convert HTML to PowerPoint using external tools or services
      const pptxPath = await this.convertHTMLToPowerPoint(htmlPresentation, enhancementRequest);
      
      return pptxPath;
    } catch (error) {
      console.error('Error creating Google Slides presentation:', error);
      throw error;
    }
  }

  private async generateAllGraphics(strategy: SynthesizedStrategy, colorPalette: any): Promise<string[]> {
    const graphics: string[] = [];
    
    try {
      // Generate strength chart
      if (strategy.keyStrengths && strategy.keyStrengths.length > 0) {
        const strengthChart = this.graphicsService.createStrengthChart(strategy.keyStrengths, colorPalette);
        const chartPath = await this.graphicsService.generateChart(strengthChart, colorPalette);
        graphics.push(chartPath);
      }

      // Generate risk chart
      if (strategy.potentialWeaknesses && strategy.potentialWeaknesses.length > 0) {
        const riskChart = this.graphicsService.createRiskChart(strategy.potentialWeaknesses, colorPalette);
        const chartPath = await this.graphicsService.generateChart(riskChart, colorPalette);
        graphics.push(chartPath);
      }

      // Generate timeline diagram
      if (strategy.timelineAndMilestones) {
        const timelineConfig = this.graphicsService.createTimelineFlowchart(strategy.timelineAndMilestones, colorPalette);
        const diagramPath = await this.graphicsService.generateDiagram(timelineConfig, colorPalette);
        graphics.push(diagramPath);
      }

      // Generate legal icons
      const scalesIcon = this.graphicsService.generateLegalIcon('scales', colorPalette);
      const gavelIcon = this.graphicsService.generateLegalIcon('gavel', colorPalette);
      graphics.push(scalesIcon, gavelIcon);

    } catch (error) {
      console.error('Error generating graphics:', error);
    }
    
    return graphics;
  }

  private async createPresentationTemplate(
    strategy: SynthesizedStrategy, 
    enhancementRequest: any,
    colorPalette: any,
    graphics: string[]
  ): Promise<GoogleSlidesTemplate> {
    return {
      title: `Enhanced Legal Strategy: ${strategy.executiveSummary?.substring(0, 50) || 'Legal Analysis'}`,
      theme: {
        backgroundColor: colorPalette.background,
        primaryColor: colorPalette.primary,
        secondaryColor: colorPalette.secondary,
        fontFamily: enhancementRequest.preferredStyle === 'academic' ? 'Times New Roman' : 'Arial'
      },
      slides: [
        {
          title: '⚖️ Legal Strategy Overview',
          content: [
            strategy.executiveSummary || 'Comprehensive legal strategy analysis',
            `Target Audience: ${enhancementRequest.targetAudience}`,
            `Presentation Goals: ${enhancementRequest.presentationGoals}`
          ],
          layout: 'TITLE_AND_BODY',
          graphics: graphics.length > 0 ? [{
            type: 'icon',
            imagePath: graphics.find(g => g.includes('scales')) || '',
            position: { x: 400, y: 200, width: 100, height: 100 }
          }] : undefined
        },
        {
          title: '💪 Key Strengths & Advantages',
          content: strategy.keyStrengths || ['Strong legal foundation', 'Evidence-based approach'],
          layout: 'TITLE_AND_TWO_COLUMNS',
          graphics: graphics.length > 0 ? [{
            type: 'chart',
            imagePath: graphics.find(g => g.includes('chart')) || '',
            position: { x: 50, y: 150, width: 300, height: 200 }
          }] : undefined
        },
        {
          title: '⚠️ Risk Analysis & Mitigation',
          content: strategy.potentialWeaknesses || ['Identified challenges', 'Mitigation strategies'],
          layout: 'TITLE_AND_TWO_COLUMNS',
          graphics: graphics.length > 1 ? [{
            type: 'chart',
            imagePath: graphics[1],
            position: { x: 350, y: 150, width: 300, height: 200 }
          }] : undefined
        },
        {
          title: '🎯 Recommended Approach',
          content: [
            strategy.recommendedApproach || 'Strategic recommendation based on analysis',
            'Evidence-driven decision making',
            'Goal-oriented execution plan'
          ],
          layout: 'TITLE_AND_BODY'
        },
        {
          title: '📅 Timeline & Milestones',
          content: strategy.tacticalConsiderations || ['Implementation timeline', 'Key milestones'],
          layout: 'TITLE_AND_BODY',
          graphics: graphics.length > 2 ? [{
            type: 'diagram',
            imagePath: graphics[2],
            position: { x: 100, y: 200, width: 500, height: 250 }
          }] : undefined
        },
        {
          title: '✅ Next Steps & Action Items',
          content: [
            'Immediate action items',
            'Resource requirements',
            'Success metrics',
            'Follow-up schedule'
          ],
          layout: 'TITLE_AND_BODY',
          graphics: graphics.length > 3 ? [{
            type: 'icon',
            imagePath: graphics.find(g => g.includes('gavel')) || '',
            position: { x: 500, y: 150, width: 80, height: 80 }
          }] : undefined
        }
      ]
    };
  }

  private async createHTMLPresentation(template: GoogleSlidesTemplate): Promise<string> {
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.title}</title>
    <style>
        body {
            font-family: ${template.theme.fontFamily}, sans-serif;
            margin: 0;
            padding: 0;
            background-color: ${template.theme.backgroundColor};
        }
        .slide {
            width: 100vw;
            height: 100vh;
            padding: 60px;
            box-sizing: border-box;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            background-color: ${template.theme.backgroundColor};
            position: relative;
        }
        .slide-title {
            font-size: 42px;
            font-weight: bold;
            color: ${template.theme.primaryColor};
            margin-bottom: 40px;
            text-align: center;
        }
        .slide-content {
            font-size: 24px;
            line-height: 1.6;
            color: #333;
            flex-grow: 1;
        }
        .slide-content ul {
            list-style-type: none;
            padding: 0;
        }
        .slide-content li {
            margin: 20px 0;
            padding-left: 30px;
            position: relative;
        }
        .slide-content li:before {
            content: "•";
            color: ${template.theme.primaryColor};
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        .graphic {
            position: absolute;
            border: 2px solid ${template.theme.secondaryColor};
            border-radius: 8px;
            background: white;
            padding: 10px;
        }
        @media print {
            .slide {
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    ${template.slides.map((slide, index) => `
        <div class="slide">
            <h1 class="slide-title">${slide.title}</h1>
            <div class="slide-content">
                <ul>
                    ${slide.content.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            ${slide.graphics ? slide.graphics.map(graphic => `
                <div class="graphic" style="
                    left: ${graphic.position.x}px; 
                    top: ${graphic.position.y}px; 
                    width: ${graphic.position.width}px; 
                    height: ${graphic.position.height}px;">
                    <img src="${graphic.imagePath}" style="width: 100%; height: 100%; object-fit: contain;" alt="${graphic.type}">
                </div>
            `).join('') : ''}
        </div>
    `).join('')}
</body>
</html>
    `;

    const htmlPath = path.join(this.outputDir, `presentation_${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlContent);
    return htmlPath;
  }

  private async convertHTMLToPowerPoint(htmlPath: string, enhancementRequest: any): Promise<string> {
    try {
      // Option 1: Use LibreOffice headless conversion
      const outputPath = htmlPath.replace('.html', '.pptx');
      
      // Check if LibreOffice is available
      const libreOfficeCommand = 'libreoffice --headless --convert-to pptx --outdir ' + 
        path.dirname(outputPath) + ' ' + htmlPath;
      
      console.log('Attempting LibreOffice conversion...');
      
      // For now, we'll return the HTML path and implement conversion separately
      // In production, you could use:
      // 1. LibreOffice headless mode
      // 2. Puppeteer to generate PDF then convert to PPTX
      // 3. Google Slides API with proper authentication
      // 4. Third-party conversion services
      
      return await this.fallbackToPuppeteerPDF(htmlPath, enhancementRequest);
      
    } catch (error) {
      console.error('Error converting to PowerPoint:', error);
      return htmlPath; // Return HTML as fallback
    }
  }

  private async fallbackToPuppeteerPDF(htmlPath: string, enhancementRequest: any): Promise<string> {
    try {
      const puppeteer = require('puppeteer');
      
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      // Load the HTML file
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
      
      // Generate PDF with slide-like format
      const pdfPath = htmlPath.replace('.html', '.pdf');
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });
      
      await browser.close();
      
      console.log('PDF presentation generated:', pdfPath);
      return pdfPath;
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      return htmlPath; // Return HTML as final fallback
    }
  }

  // Method to convert existing graphics folder to PowerPoint
  async convertGraphicsFolderToPowerPoint(
    graphicsDir: string, 
    strategy: SynthesizedStrategy,
    enhancementRequest: any
  ): Promise<string> {
    try {
      console.log('Converting graphics folder to PowerPoint...');
      
      // Read all graphics files
      const graphicsFiles = fs.readdirSync(graphicsDir)
        .filter(file => file.match(/\.(png|jpg|jpeg|svg)$/i))
        .map(file => path.join(graphicsDir, file));
      
      // Create color palette from enhancement request
      const colorPalette = this.getColorPaletteFromRequest(enhancementRequest);
      
      // Create presentation template with existing graphics
      const template = await this.createPresentationTemplate(strategy, enhancementRequest, colorPalette, graphicsFiles);
      
      // Generate HTML presentation
      const htmlPath = await this.createHTMLPresentation(template);
      
      // Convert to PowerPoint/PDF
      return await this.convertHTMLToPowerPoint(htmlPath, enhancementRequest);
      
    } catch (error) {
      console.error('Error converting graphics folder:', error);
      throw error;
    }
  }

  private getColorPaletteFromRequest(enhancementRequest: any): any {
    const schemes = {
      'vibrant': {
        primary: '#2E86AB',
        secondary: '#A23B72',
        accent: '#F18F01',
        background: '#FFFFFF',
        text: '#333333'
      },
      'muted': {
        primary: '#5D737E',
        secondary: '#A8BABC',
        accent: '#B85042',
        background: '#F7F7F7',
        text: '#2F2F2F'
      },
      'monochrome': {
        primary: '#2F2F2F',
        secondary: '#666666',
        accent: '#999999',
        background: '#FFFFFF',
        text: '#000000'
      }
    };

    if (enhancementRequest.colorScheme === 'custom' && enhancementRequest.customColors) {
      return enhancementRequest.customColors;
    }

    return schemes[enhancementRequest.colorScheme] || schemes['vibrant'];
  }

  async cleanupTempFiles(): Promise<void> {
    try {
      const files = fs.readdirSync(this.outputDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      for (const file of files) {
        if (file.match(/\.(html|pdf)$/)) {
          const filePath = path.join(this.outputDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < oneHourAgo) {
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up converter temp files:', error);
    }
  }
}