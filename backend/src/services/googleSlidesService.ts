import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { SynthesizedStrategy } from './aiOrchestrationService';
import { GraphicsGenerationService } from './graphicsGenerationService';

export interface GoogleSlidesConfig {
  serviceAccountPath?: string;
  clientEmail?: string;
  privateKey?: string;
  projectId?: string;
}

export class GoogleSlidesService {
  private outputDir: string;
  private graphicsService: GraphicsGenerationService;
  private auth: any;
  private slides: any;
  private drive: any;

  constructor(config?: GoogleSlidesConfig) {
    this.outputDir = path.join(process.cwd(), 'temp');
    this.graphicsService = new GraphicsGenerationService();
    this.initializeAuth(config);
  }

  private async initializeAuth(config?: GoogleSlidesConfig) {
    try {
      // Try to initialize with service account if provided
      if (config?.serviceAccountPath && fs.existsSync(config.serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(config.serviceAccountPath, 'utf8'));
        
        this.auth = new google.auth.GoogleAuth({
          keyFile: config.serviceAccountPath,
          scopes: [
            'https://www.googleapis.com/auth/presentations',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file'
          ]
        });
      } else if (config?.clientEmail && config?.privateKey) {
        // Use direct credentials
        this.auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: config.clientEmail,
            private_key: config.privateKey.replace(/\\n/g, '\n'),
            project_id: config.projectId
          },
          scopes: [
            'https://www.googleapis.com/auth/presentations',
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/drive.file'
          ]
        });
      } else {
        console.log('No Google credentials provided, will use alternative conversion methods');
        this.auth = null;
        return;
      }

      const authClient = await this.auth.getClient();
      this.slides = google.slides({ version: 'v1', auth: authClient });
      this.drive = google.drive({ version: 'v3', auth: authClient });
      
      console.log('Google Slides API initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Slides API:', error);
      this.auth = null;
    }
  }

  async createPresentationWithGraphics(
    strategy: SynthesizedStrategy,
    enhancementRequest: any,
    colorPalette: any
  ): Promise<string> {
    try {
      if (!this.auth || !this.slides) {
        console.log('Google Slides API not available, using alternative method...');
        return await this.createAlternativePresentation(strategy, enhancementRequest, colorPalette);
      }

      console.log('Creating Google Slides presentation...');

      // Step 1: Create blank presentation
      const presentation = await this.slides.presentations.create({
        requestBody: {
          title: `Enhanced Legal Strategy: ${strategy.executiveSummary?.substring(0, 50) || 'Legal Analysis'}`
        }
      });

      const presentationId = presentation.data.presentationId;
      console.log('Created presentation:', presentationId);

      // Step 2: Generate graphics
      const graphics = await this.generateGraphicsForSlides(strategy, colorPalette);

      // Step 3: Upload graphics to Google Drive
      const uploadedImages = await this.uploadGraphicsToDrive(graphics);

      // Step 4: Create slides with content and graphics
      await this.addSlidesToPresentation(presentationId, strategy, enhancementRequest, colorPalette, uploadedImages);

      // Step 5: Export as PowerPoint
      const pptxPath = await this.exportToPowerPoint(presentationId, enhancementRequest);

      console.log('Google Slides presentation created and exported:', pptxPath);
      return pptxPath;

    } catch (error) {
      console.error('Error creating Google Slides presentation:', error);
      // Fallback to alternative method
      return await this.createAlternativePresentation(strategy, enhancementRequest, colorPalette);
    }
  }

  private async generateGraphicsForSlides(strategy: SynthesizedStrategy, colorPalette: any): Promise<string[]> {
    const graphics: string[] = [];
    
    try {
      // Generate strength chart
      if (strategy.keyStrengths?.length > 0) {
        const chartConfig = this.graphicsService.createStrengthChart(strategy.keyStrengths, colorPalette);
        const chartPath = await this.graphicsService.generateChart(chartConfig, colorPalette);
        graphics.push(chartPath);
      }

      // Generate risk chart  
      if (strategy.potentialWeaknesses?.length > 0) {
        const riskConfig = this.graphicsService.createRiskChart(strategy.potentialWeaknesses, colorPalette);
        const riskPath = await this.graphicsService.generateChart(riskConfig, colorPalette);
        graphics.push(riskPath);
      }

      // Generate timeline diagram
      if (strategy.timelineAndMilestones) {
        const timelineConfig = this.graphicsService.createTimelineFlowchart(strategy.timelineAndMilestones, colorPalette);
        const timelinePath = await this.graphicsService.generateDiagram(timelineConfig, colorPalette);
        graphics.push(timelinePath);
      }

      // Generate legal icons
      const scalesIcon = this.graphicsService.generateLegalIcon('scales', colorPalette);
      const gavelIcon = this.graphicsService.generateLegalIcon('gavel', colorPalette);
      graphics.push(scalesIcon, gavelIcon);

    } catch (error) {
      console.error('Error generating graphics for slides:', error);
    }
    
    return graphics;
  }

  private async uploadGraphicsToDrive(graphicsPaths: string[]): Promise<{[key: string]: string}> {
    const uploadedImages: {[key: string]: string} = {};
    
    if (!this.drive) return uploadedImages;

    for (const graphicPath of graphicsPaths) {
      try {
        if (!fs.existsSync(graphicPath)) continue;

        const fileName = path.basename(graphicPath);
        const mimeType = graphicPath.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

        const response = await this.drive.files.create({
          requestBody: {
            name: fileName,
            parents: [] // Will be in root folder
          },
          media: {
            mimeType: mimeType,
            body: fs.createReadStream(graphicPath)
          }
        });

        // Make file publicly viewable
        await this.drive.permissions.create({
          fileId: response.data.id,
          requestBody: {
            role: 'reader',
            type: 'anyone'
          }
        });

        uploadedImages[fileName] = response.data.id;
        console.log('Uploaded graphic:', fileName, 'ID:', response.data.id);

      } catch (error) {
        console.error('Error uploading graphic:', error);
      }
    }

    return uploadedImages;
  }

  private async addSlidesToPresentation(
    presentationId: string,
    strategy: SynthesizedStrategy,
    enhancementRequest: any,
    colorPalette: any,
    uploadedImages: {[key: string]: string}
  ): Promise<void> {
    const requests = [];

    // Slide 1: Title Slide
    requests.push({
      createSlide: {
        objectId: 'slide_1',
        slideLayoutReference: {
          predefinedLayout: 'TITLE_SLIDE'
        }
      }
    });

    // Slide 2: Overview with icon
    requests.push({
      createSlide: {
        objectId: 'slide_2',
        slideLayoutReference: {
          predefinedLayout: 'TITLE_AND_BODY'
        }
      }
    });

    // Slide 3: Strengths with chart
    requests.push({
      createSlide: {
        objectId: 'slide_3',
        slideLayoutReference: {
          predefinedLayout: 'TITLE_AND_TWO_COLUMNS'
        }
      }
    });

    // Execute slide creation
    await this.slides.presentations.batchUpdate({
      presentationId: presentationId,
      requestBody: {
        requests: requests
      }
    });

    // Add content to slides
    await this.addContentToSlides(presentationId, strategy, enhancementRequest, uploadedImages);
  }

  private async addContentToSlides(
    presentationId: string,
    strategy: SynthesizedStrategy,
    enhancementRequest: any,
    uploadedImages: {[key: string]: string}
  ): Promise<void> {
    const contentRequests = [];

    // Add title slide content
    contentRequests.push({
      insertText: {
        objectId: 'slide_1',
        text: `Enhanced Legal Strategy\n${strategy.executiveSummary?.substring(0, 100) || 'Legal Analysis'}`,
        insertionIndex: 0
      }
    });

    // Add overview slide content
    contentRequests.push({
      insertText: {
        objectId: 'slide_2',
        text: '⚖️ Legal Strategy Overview\n\n' + 
              `${strategy.executiveSummary || 'Comprehensive legal strategy analysis'}\n\n` +
              `Target Audience: ${enhancementRequest.targetAudience}\n` +
              `Presentation Goals: ${enhancementRequest.presentationGoals}`,
        insertionIndex: 0
      }
    });

    // Execute content updates
    await this.slides.presentations.batchUpdate({
      presentationId: presentationId,
      requestBody: {
        requests: contentRequests
      }
    });
  }

  private async exportToPowerPoint(presentationId: string, enhancementRequest: any): Promise<string> {
    try {
      if (!this.drive) {
        throw new Error('Google Drive API not available');
      }

      console.log('Exporting presentation to PowerPoint format...');

      // Export as PPTX
      const response = await this.drive.files.export({
        fileId: presentationId,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      }, { responseType: 'stream' });

      // Save to file
      const filename = `google_slides_export_${enhancementRequest.preferredStyle}_${Date.now()}.pptx`;
      const filepath = path.join(this.outputDir, filename);
      
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('PowerPoint export completed:', filename);
          resolve(filepath);
        });
        writer.on('error', reject);
      });

    } catch (error) {
      console.error('Error exporting to PowerPoint:', error);
      throw error;
    }
  }

  // Alternative method when Google API is not available
  private async createAlternativePresentation(
    strategy: SynthesizedStrategy,
    enhancementRequest: any,
    colorPalette: any
  ): Promise<string> {
    console.log('Using alternative presentation generation method...');
    
    // Generate graphics
    const graphics = await this.generateGraphicsForSlides(strategy, colorPalette);
    
    // Create HTML presentation that can be converted
    const htmlContent = this.createHTMLPresentation(strategy, enhancementRequest, colorPalette, graphics);
    
    // Save HTML file
    const htmlPath = path.join(this.outputDir, `alternative_presentation_${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlContent);
    
    // Convert to PDF using Puppeteer
    return await this.convertHTMLToPDF(htmlPath, enhancementRequest);
  }

  private createHTMLPresentation(
    strategy: SynthesizedStrategy,
    enhancementRequest: any,
    colorPalette: any,
    graphics: string[]
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enhanced Legal Strategy Presentation</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background: ${colorPalette.background};
        }
        .slide {
            width: 100vw;
            height: 100vh;
            padding: 60px 80px;
            box-sizing: border-box;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            position: relative;
            background: linear-gradient(135deg, ${colorPalette.background} 0%, ${colorPalette.secondary}20 100%);
        }
        .slide-title {
            font-size: 48px;
            font-weight: bold;
            color: ${colorPalette.primary};
            margin-bottom: 40px;
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .slide-content {
            font-size: 28px;
            line-height: 1.8;
            color: #333;
            flex-grow: 1;
        }
        .slide-content ul {
            list-style: none;
            padding: 0;
        }
        .slide-content li {
            margin: 25px 0;
            padding-left: 40px;
            position: relative;
        }
        .slide-content li:before {
            content: "▶";
            color: ${colorPalette.accent};
            font-weight: bold;
            position: absolute;
            left: 0;
            top: 0;
        }
        .graphic-container {
            position: absolute;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
            padding: 20px;
        }
        .graphic-container img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        @media print {
            .slide { page-break-after: always; }
        }
    </style>
</head>
<body>
    <!-- Title Slide -->
    <div class="slide">
        <h1 class="slide-title">⚖️ Enhanced Legal Strategy</h1>
        <div class="slide-content" style="text-align: center; font-size: 32px;">
            <p><strong>${strategy.executiveSummary || 'Comprehensive Legal Analysis'}</strong></p>
            <p style="font-size: 24px; color: ${colorPalette.secondary};">
                Prepared for: ${enhancementRequest.targetAudience}<br>
                ${new Date().toLocaleDateString()}
            </p>
        </div>
        ${graphics[0] ? `
        <div class="graphic-container" style="right: 100px; bottom: 100px; width: 150px; height: 150px;">
            <img src="${graphics[0]}" alt="Legal Icon">
        </div>` : ''}
    </div>

    <!-- Overview Slide -->
    <div class="slide">
        <h1 class="slide-title">📋 Legal Strategy Overview</h1>
        <div class="slide-content">
            <ul>
                <li>${strategy.executiveSummary || 'Comprehensive legal strategy analysis'}</li>
                <li>Target Audience: ${enhancementRequest.targetAudience}</li>
                <li>Presentation Goals: ${enhancementRequest.presentationGoals}</li>
                <li>Strategic Approach: Evidence-driven and goal-oriented</li>
            </ul>
        </div>
    </div>

    <!-- Strengths Slide -->
    <div class="slide">
        <h1 class="slide-title">💪 Key Strengths & Advantages</h1>
        <div class="slide-content">
            <ul>
                ${(strategy.keyStrengths || ['Strong legal foundation', 'Evidence-based approach'])
                  .map(strength => `<li>${strength}</li>`).join('')}
            </ul>
        </div>
        ${graphics[1] ? `
        <div class="graphic-container" style="right: 80px; top: 200px; width: 400px; height: 300px;">
            <img src="${graphics[1]}" alt="Strengths Chart">
        </div>` : ''}
    </div>

    <!-- Risk Analysis Slide -->
    <div class="slide">
        <h1 class="slide-title">⚠️ Risk Analysis & Mitigation</h1>
        <div class="slide-content">
            <ul>
                ${(strategy.potentialWeaknesses || ['Identified challenges', 'Mitigation strategies'])
                  .map(weakness => `<li>${weakness}</li>`).join('')}
            </ul>
        </div>
        ${graphics[2] ? `
        <div class="graphic-container" style="right: 80px; top: 200px; width: 400px; height: 300px;">
            <img src="${graphics[2]}" alt="Risk Chart">
        </div>` : ''}
    </div>

    <!-- Recommended Approach Slide -->
    <div class="slide">
        <h1 class="slide-title">🎯 Recommended Approach</h1>
        <div class="slide-content">
            <ul>
                <li>${strategy.recommendedApproach || 'Strategic recommendation based on analysis'}</li>
                <li>Evidence-driven decision making</li>
                <li>Goal-oriented execution plan</li>
                <li>Stakeholder alignment and communication</li>
            </ul>
        </div>
    </div>

    <!-- Timeline Slide -->
    <div class="slide">
        <h1 class="slide-title">📅 Timeline & Milestones</h1>
        <div class="slide-content">
            <ul>
                ${(strategy.tacticalConsiderations || ['Implementation timeline', 'Key milestones'])
                  .map(tactic => `<li>${tactic}</li>`).join('')}
            </ul>
        </div>
        ${graphics[3] ? `
        <div class="graphic-container" style="left: 50%; top: 250px; transform: translateX(-50%); width: 600px; height: 300px;">
            <img src="${graphics[3]}" alt="Timeline Diagram">
        </div>` : ''}
    </div>

    <!-- Next Steps Slide -->
    <div class="slide">
        <h1 class="slide-title">✅ Next Steps & Action Items</h1>
        <div class="slide-content">
            <ul>
                <li>Immediate action items identification</li>
                <li>Resource requirements assessment</li>
                <li>Success metrics establishment</li>
                <li>Follow-up schedule creation</li>
                <li>Stakeholder communication plan</li>
            </ul>
        </div>
        ${graphics[4] ? `
        <div class="graphic-container" style="right: 100px; bottom: 100px; width: 120px; height: 120px;">
            <img src="${graphics[4]}" alt="Action Icon">
        </div>` : ''}
    </div>
</body>
</html>`;
  }

  private async convertHTMLToPDF(htmlPath: string, enhancementRequest: any): Promise<string> {
    try {
      const puppeteer = require('puppeteer');
      
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
      const page = await browser.newPage();
      
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
      
      const pdfPath = htmlPath.replace('.html', '.pdf');
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });
      
      await browser.close();
      
      console.log('PDF presentation generated:', pdfPath);
      return pdfPath;
      
    } catch (error) {
      console.error('Error converting HTML to PDF:', error);
      return htmlPath;
    }
  }

  async convertExistingGraphicsFolder(
    graphicsDir: string,
    strategy: SynthesizedStrategy,
    enhancementRequest: any
  ): Promise<string> {
    try {
      console.log('Converting existing graphics folder to presentation...');
      
      // Read graphics files
      const graphicsFiles = fs.readdirSync(graphicsDir)
        .filter(file => /\.(png|jpg|jpeg|svg)$/i.test(file))
        .map(file => path.join(graphicsDir, file));
      
      const colorPalette = this.getColorPaletteFromRequest(enhancementRequest);
      
      // Create presentation using existing graphics
      const htmlContent = this.createHTMLPresentation(strategy, enhancementRequest, colorPalette, graphicsFiles);
      
      const htmlPath = path.join(this.outputDir, `converted_graphics_${Date.now()}.html`);
      fs.writeFileSync(htmlPath, htmlContent);
      
      return await this.convertHTMLToPDF(htmlPath, enhancementRequest);
      
    } catch (error) {
      console.error('Error converting graphics folder:', error);
      throw error;
    }
  }

  private getColorPaletteFromRequest(enhancementRequest: any): any {
    if (enhancementRequest.colorScheme === 'custom' && enhancementRequest.customColors) {
      return enhancementRequest.customColors;
    }

    const schemes = {
      'vibrant': { primary: '#2E86AB', secondary: '#A23B72', accent: '#F18F01', background: '#FFFFFF', text: '#333333' },
      'muted': { primary: '#5D737E', secondary: '#A8BABC', accent: '#B85042', background: '#F7F7F7', text: '#2F2F2F' },
      'monochrome': { primary: '#2F2F2F', secondary: '#666666', accent: '#999999', background: '#FFFFFF', text: '#000000' }
    };

    return schemes[enhancementRequest.colorScheme] || schemes['vibrant'];
  }
}