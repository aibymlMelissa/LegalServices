import path from 'path';
import fs from 'fs';
import PptxGenJS from 'pptxgenjs';

export interface LawFirmTemplate {
  id: string;
  name: string;
  description: string;
  templatePath: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    title: string;
    body: string;
    accent: string;
  };
  logo?: {
    path: string;
    position: { x: number; y: number; w: number; h: number };
  };
  layouts: {
    title: TemplateLayout;
    content: TemplateLayout;
    twoColumn: TemplateLayout;
    conclusion: TemplateLayout;
  };
}

export interface TemplateLayout {
  background?: {
    color?: string;
    image?: string;
  };
  titleStyle: {
    x: number;
    y: number;
    w: number;
    h: number;
    fontSize: number;
    color: string;
    fontFace: string;
    align?: 'left' | 'center' | 'right';
  };
  contentStyle: {
    x: number;
    y: number;
    w: number;
    h: number;
    fontSize: number;
    color: string;
    fontFace: string;
    bulletType?: string;
  };
}

export class PresentationTemplateService {
  private templatesDir: string;
  private defaultTemplates: Map<string, LawFirmTemplate>;

  constructor() {
    this.templatesDir = path.join(process.cwd(), 'templates', 'presentations');
    this.ensureTemplateDirectory();
    this.defaultTemplates = new Map();
    this.initializeDefaultTemplates();
  }

  private ensureTemplateDirectory(): void {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
  }

  private initializeDefaultTemplates(): void {
    // Corporate Law Firm Template
    this.defaultTemplates.set('corporate', {
      id: 'corporate',
      name: 'Corporate Law Firm',
      description: 'Professional corporate law firm template with navy blue and gold accents',
      templatePath: '',
      colors: {
        primary: '#1B365D',    // Navy blue
        secondary: '#4A90A4',  // Steel blue
        accent: '#DAA520',     // Gold
        background: '#FFFFFF', // White
        text: '#2C3E50'       // Dark gray
      },
      fonts: {
        title: 'Calibri',
        body: 'Calibri',
        accent: 'Calibri Light'
      },
      logo: {
        path: '', // Will be set when logo is uploaded
        position: { x: 0.5, y: 0.2, w: 1.5, h: 0.8 }
      },
      layouts: {
        title: {
          background: { color: '#1B365D' },
          titleStyle: {
            x: 1, y: 2, w: 8, h: 2,
            fontSize: 44, color: '#FFFFFF', fontFace: 'Calibri',
            align: 'center'
          },
          contentStyle: {
            x: 1, y: 4.5, w: 8, h: 2,
            fontSize: 24, color: '#DAA520', fontFace: 'Calibri Light'
          }
        },
        content: {
          background: { color: '#FFFFFF' },
          titleStyle: {
            x: 0.5, y: 0.5, w: 9, h: 1,
            fontSize: 36, color: '#1B365D', fontFace: 'Calibri',
            align: 'left'
          },
          contentStyle: {
            x: 0.5, y: 1.8, w: 9, h: 5,
            fontSize: 20, color: '#2C3E50', fontFace: 'Calibri',
            bulletType: '▶'
          }
        },
        twoColumn: {
          background: { color: '#FFFFFF' },
          titleStyle: {
            x: 0.5, y: 0.5, w: 9, h: 1,
            fontSize: 36, color: '#1B365D', fontFace: 'Calibri',
            align: 'left'
          },
          contentStyle: {
            x: 0.5, y: 1.8, w: 4, h: 5,
            fontSize: 18, color: '#2C3E50', fontFace: 'Calibri',
            bulletType: '▶'
          }
        },
        conclusion: {
          background: { color: '#F8F9FA' },
          titleStyle: {
            x: 1, y: 1.5, w: 8, h: 1.5,
            fontSize: 40, color: '#1B365D', fontFace: 'Calibri',
            align: 'center'
          },
          contentStyle: {
            x: 1, y: 3.5, w: 8, h: 3,
            fontSize: 22, color: '#2C3E50', fontFace: 'Calibri'
          }
        }
      }
    });

    // Litigation Firm Template
    this.defaultTemplates.set('litigation', {
      id: 'litigation',
      name: 'Litigation Firm',
      description: 'Bold litigation firm template with burgundy and silver theme',
      templatePath: '',
      colors: {
        primary: '#800020',    // Burgundy
        secondary: '#A0A0A0',  // Silver
        accent: '#C0392B',     // Dark red
        background: '#FFFFFF', // White
        text: '#2C3E50'       // Dark gray
      },
      fonts: {
        title: 'Times New Roman',
        body: 'Times New Roman',
        accent: 'Georgia'
      },
      layouts: {
        title: {
          background: { color: '#800020' },
          titleStyle: {
            x: 1, y: 2.5, w: 8, h: 2,
            fontSize: 40, color: '#FFFFFF', fontFace: 'Times New Roman',
            align: 'center'
          },
          contentStyle: {
            x: 1, y: 5, w: 8, h: 1.5,
            fontSize: 20, color: '#A0A0A0', fontFace: 'Georgia'
          }
        },
        content: {
          background: { color: '#FFFFFF' },
          titleStyle: {
            x: 0.5, y: 0.5, w: 9, h: 1,
            fontSize: 32, color: '#800020', fontFace: 'Times New Roman',
            align: 'left'
          },
          contentStyle: {
            x: 0.5, y: 1.8, w: 9, h: 5,
            fontSize: 18, color: '#2C3E50', fontFace: 'Times New Roman',
            bulletType: '•'
          }
        },
        twoColumn: {
          background: { color: '#FFFFFF' },
          titleStyle: {
            x: 0.5, y: 0.5, w: 9, h: 1,
            fontSize: 32, color: '#800020', fontFace: 'Times New Roman',
            align: 'left'
          },
          contentStyle: {
            x: 0.5, y: 1.8, w: 4, h: 5,
            fontSize: 16, color: '#2C3E50', fontFace: 'Times New Roman',
            bulletType: '•'
          }
        },
        conclusion: {
          background: { color: '#F5F5F5' },
          titleStyle: {
            x: 1, y: 1.5, w: 8, h: 1.5,
            fontSize: 36, color: '#800020', fontFace: 'Times New Roman',
            align: 'center'
          },
          contentStyle: {
            x: 1, y: 3.5, w: 8, h: 3,
            fontSize: 20, color: '#2C3E50', fontFace: 'Times New Roman'
          }
        }
      }
    });

    // Modern Tech Law Template
    this.defaultTemplates.set('tech', {
      id: 'tech',
      name: 'Technology Law',
      description: 'Modern technology law firm template with blue and orange accents',
      templatePath: '',
      colors: {
        primary: '#2E86AB',    // Modern blue
        secondary: '#A23B72',  // Purple
        accent: '#F18F01',     // Orange
        background: '#FFFFFF', // White
        text: '#333333'       // Dark gray
      },
      fonts: {
        title: 'Segoe UI',
        body: 'Segoe UI',
        accent: 'Segoe UI Light'
      },
      layouts: {
        title: {
          background: { color: '#2E86AB' },
          titleStyle: {
            x: 1, y: 2, w: 8, h: 2,
            fontSize: 42, color: '#FFFFFF', fontFace: 'Segoe UI',
            align: 'center'
          },
          contentStyle: {
            x: 1, y: 4.5, w: 8, h: 2,
            fontSize: 22, color: '#F18F01', fontFace: 'Segoe UI Light'
          }
        },
        content: {
          background: { color: '#FFFFFF' },
          titleStyle: {
            x: 0.5, y: 0.5, w: 9, h: 1,
            fontSize: 34, color: '#2E86AB', fontFace: 'Segoe UI',
            align: 'left'
          },
          contentStyle: {
            x: 0.5, y: 1.8, w: 9, h: 5,
            fontSize: 19, color: '#333333', fontFace: 'Segoe UI',
            bulletType: '▸'
          }
        },
        twoColumn: {
          background: { color: '#FFFFFF' },
          titleStyle: {
            x: 0.5, y: 0.5, w: 9, h: 1,
            fontSize: 34, color: '#2E86AB', fontFace: 'Segoe UI',
            align: 'left'
          },
          contentStyle: {
            x: 0.5, y: 1.8, w: 4, h: 5,
            fontSize: 17, color: '#333333', fontFace: 'Segoe UI',
            bulletType: '▸'
          }
        },
        conclusion: {
          background: { color: '#F8F9FA' },
          titleStyle: {
            x: 1, y: 1.5, w: 8, h: 1.5,
            fontSize: 38, color: '#2E86AB', fontFace: 'Segoe UI',
            align: 'center'
          },
          contentStyle: {
            x: 1, y: 3.5, w: 8, h: 3,
            fontSize: 21, color: '#333333', fontFace: 'Segoe UI'
          }
        }
      }
    });
  }

  getAvailableTemplates(): LawFirmTemplate[] {
    return Array.from(this.defaultTemplates.values());
  }

  getTemplate(templateId: string): LawFirmTemplate | null {
    return this.defaultTemplates.get(templateId) || null;
  }

  createPresentationWithTemplate(
    templateId: string, 
    slides: any[], 
    metadata: any
  ): PptxGenJS {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const pptx = new PptxGenJS();

    // Set presentation properties with firm branding
    pptx.author = metadata.lawyerName || 'Legal Strategy Platform';
    pptx.company = metadata.firmName || 'Law Firm';
    pptx.title = metadata.caseTitle || 'Legal Strategy Presentation';

    // Create slides using template layouts
    slides.forEach((slideData, index) => {
      const slide = pptx.addSlide();
      this.applyTemplateToSlide(slide, template, slideData, index);
    });

    return pptx;
  }

  private applyTemplateToSlide(
    slide: any, 
    template: LawFirmTemplate, 
    slideData: any, 
    index: number
  ): void {
    let layout: TemplateLayout;

    // Determine layout based on slide type
    if (index === 0) {
      layout = template.layouts.title;
    } else if (slideData.type === 'two-column') {
      layout = template.layouts.twoColumn;
    } else if (index === slideData.totalSlides - 1) {
      layout = template.layouts.conclusion;
    } else {
      layout = template.layouts.content;
    }

    // Apply background
    if (layout.background?.color) {
      slide.background = { color: layout.background.color };
    }

    // Add logo if available
    if (template.logo?.path && fs.existsSync(template.logo.path)) {
      slide.addImage({
        path: template.logo.path,
        x: template.logo.position.x,
        y: template.logo.position.y,
        w: template.logo.position.w,
        h: template.logo.position.h
      });
    }

    // Add title
    if (slideData.title) {
      slide.addText(slideData.title, {
        x: layout.titleStyle.x,
        y: layout.titleStyle.y,
        w: layout.titleStyle.w,
        h: layout.titleStyle.h,
        fontSize: layout.titleStyle.fontSize,
        color: layout.titleStyle.color,
        fontFace: layout.titleStyle.fontFace,
        align: layout.titleStyle.align || 'left',
        bold: true
      });
    }

    // Add content
    if (slideData.content) {
      const contentOptions = {
        x: layout.contentStyle.x,
        y: layout.contentStyle.y,
        w: layout.contentStyle.w,
        h: layout.contentStyle.h,
        fontSize: layout.contentStyle.fontSize,
        color: layout.contentStyle.color,
        fontFace: layout.contentStyle.fontFace,
        bullet: layout.contentStyle.bulletType ? { type: layout.contentStyle.bulletType } : false
      };

      if (Array.isArray(slideData.content)) {
        // Bullet points
        slide.addText(slideData.content.map((item: string) => ({ text: item, options: { bullet: true } })), contentOptions);
      } else {
        // Regular text
        slide.addText(slideData.content, contentOptions);
      }
    }

    // Add graphics if available
    if (slideData.graphics && slideData.graphics.length > 0) {
      slideData.graphics.forEach((graphic: any, gIndex: number) => {
        if (fs.existsSync(graphic.path)) {
          slide.addImage({
            path: graphic.path,
            x: layout.contentStyle.x + layout.contentStyle.w + 0.5,
            y: layout.contentStyle.y + (gIndex * 2),
            w: 3,
            h: 2
          });
        }
      });
    }

    // Add footer with firm info
    this.addFooter(slide, template, slideData.pageNumber, slideData.totalSlides);
  }

  private addFooter(
    slide: any, 
    template: LawFirmTemplate, 
    pageNumber: number, 
    totalSlides: number
  ): void {
    // Add page number
    slide.addText(`${pageNumber} / ${totalSlides}`, {
      x: 9,
      y: 7.2,
      w: 1,
      h: 0.3,
      fontSize: 10,
      color: template.colors.secondary,
      fontFace: template.fonts.body,
      align: 'right'
    });

    // Add confidentiality notice
    slide.addText('CONFIDENTIAL & PRIVILEGED', {
      x: 0.5,
      y: 7.2,
      w: 4,
      h: 0.3,
      fontSize: 8,
      color: template.colors.secondary,
      fontFace: template.fonts.body,
      align: 'left'
    });
  }

  async uploadCustomTemplate(
    firmId: string,
    templateFile: Buffer,
    templateConfig: Partial<LawFirmTemplate>
  ): Promise<string> {
    const templateId = `custom_${firmId}_${Date.now()}`;
    const templatePath = path.join(this.templatesDir, `${templateId}.json`);

    // Save template configuration
    const customTemplate: LawFirmTemplate = {
      id: templateId,
      name: templateConfig.name || 'Custom Template',
      description: templateConfig.description || 'Custom law firm template',
      templatePath: templatePath,
      colors: templateConfig.colors || this.defaultTemplates.get('corporate')!.colors,
      fonts: templateConfig.fonts || this.defaultTemplates.get('corporate')!.fonts,
      logo: templateConfig.logo,
      layouts: templateConfig.layouts || this.defaultTemplates.get('corporate')!.layouts
    };

    fs.writeFileSync(templatePath, JSON.stringify(customTemplate, null, 2));
    this.defaultTemplates.set(templateId, customTemplate);

    return templateId;
  }

  async uploadFirmLogo(firmId: string, logoFile: Buffer, filename: string): Promise<string> {
    const logoPath = path.join(this.templatesDir, 'logos', `${firmId}_${filename}`);
    const logoDir = path.dirname(logoPath);
    
    if (!fs.existsSync(logoDir)) {
      fs.mkdirSync(logoDir, { recursive: true });
    }

    fs.writeFileSync(logoPath, logoFile);
    return logoPath;
  }

  getColorPaletteFromTemplate(templateId: string): any {
    const template = this.getTemplate(templateId);
    return template ? template.colors : this.defaultTemplates.get('corporate')!.colors;
  }
}