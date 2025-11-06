import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import mermaid from 'mermaid';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

export interface ChartConfig {
  type: 'bar' | 'pie' | 'line' | 'doughnut' | 'radar';
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string[];
      borderColor?: string[];
      borderWidth?: number;
    }[];
  };
  options?: any;
}

export interface DiagramConfig {
  type: 'flowchart' | 'timeline' | 'mindmap' | 'gitgraph';
  content: string;
}

export class GraphicsGenerationService {
  private outputDir: string;
  private chartJS: ChartJSNodeCanvas;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp', 'graphics');
    this.ensureOutputDirectory();
    
    // Initialize Chart.js canvas
    this.chartJS = new ChartJSNodeCanvas({ 
      width: 800, 
      height: 600,
      backgroundColour: 'white'
    });
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateChart(config: ChartConfig, colorPalette: any): Promise<string> {
    try {
      // Apply color palette to chart
      const enhancedConfig = this.applyColorPalette(config, colorPalette);
      
      // Generate chart image
      const buffer = await this.chartJS.renderToBuffer(enhancedConfig);
      
      // Save to file
      const filename = `chart_${Date.now()}.png`;
      const filepath = path.join(this.outputDir, filename);
      fs.writeFileSync(filepath, buffer);
      
      console.log('Chart generated:', filename);
      return filepath;
    } catch (error) {
      console.error('Error generating chart:', error);
      throw error;
    }
  }

  async generateDiagram(config: DiagramConfig, colorPalette: any): Promise<string> {
    try {
      // Initialize mermaid
      mermaid.initialize({ 
        startOnLoad: false,
        theme: 'base',
        themeVariables: {
          primaryColor: colorPalette.primary,
          primaryTextColor: colorPalette.text,
          primaryBorderColor: colorPalette.accent,
          lineColor: colorPalette.secondary,
          background: colorPalette.background
        }
      });

      // Launch puppeteer for diagram rendering
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      // Create HTML with mermaid diagram
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
        </head>
        <body style="background: white; margin: 20px;">
          <div class="mermaid">
            ${config.content}
          </div>
          <script>
            mermaid.initialize({ 
              startOnLoad: true,
              theme: 'base',
              themeVariables: {
                primaryColor: '${colorPalette.primary}',
                primaryTextColor: '${colorPalette.text}',
                primaryBorderColor: '${colorPalette.accent}',
                lineColor: '${colorPalette.secondary}',
                background: '${colorPalette.background}'
              }
            });
          </script>
        </body>
        </html>
      `;

      await page.setContent(html);
      await page.waitForSelector('.mermaid svg', { timeout: 10000 });

      // Take screenshot of the diagram
      const filename = `diagram_${Date.now()}.png`;
      const filepath = path.join(this.outputDir, filename);
      
      const element = await page.$('.mermaid');
      if (element) {
        await element.screenshot({ path: filepath, background: 'white' });
      }

      await browser.close();
      
      console.log('Diagram generated:', filename);
      return filepath;
    } catch (error) {
      console.error('Error generating diagram:', error);
      throw error;
    }
  }

  generateLegalIcon(iconType: string, colorPalette: any): string {
    // For now, return SVG path as string - can be enhanced with actual icon generation
    const iconSvg = this.getLegalIconSvg(iconType, colorPalette);
    const filename = `icon_${iconType}_${Date.now()}.svg`;
    const filepath = path.join(this.outputDir, filename);
    
    fs.writeFileSync(filepath, iconSvg);
    return filepath;
  }

  private applyColorPalette(config: ChartConfig, colorPalette: any): any {
    const enhancedConfig = JSON.parse(JSON.stringify(config));
    
    // Apply colors based on chart type
    if (enhancedConfig.data.datasets) {
      enhancedConfig.data.datasets.forEach((dataset: any, index: number) => {
        if (!dataset.backgroundColor) {
          dataset.backgroundColor = this.generateChartColors(colorPalette, dataset.data.length);
        }
        if (!dataset.borderColor) {
          dataset.borderColor = colorPalette.primary;
        }
        dataset.borderWidth = dataset.borderWidth || 2;
      });
    }

    // Add responsive options
    enhancedConfig.options = {
      ...enhancedConfig.options,
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: colorPalette.text
          }
        },
        title: {
          color: colorPalette.text
        }
      },
      scales: {
        x: {
          ticks: {
            color: colorPalette.text
          },
          grid: {
            color: colorPalette.secondary + '40'
          }
        },
        y: {
          ticks: {
            color: colorPalette.text
          },
          grid: {
            color: colorPalette.secondary + '40'
          }
        }
      }
    };

    return enhancedConfig;
  }

  private generateChartColors(colorPalette: any, count: number): string[] {
    const baseColors = [
      colorPalette.primary,
      colorPalette.accent,
      colorPalette.secondary,
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
      '#FF6384'
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  private getLegalIconSvg(iconType: string, colorPalette: any): string {
    const iconTemplates: { [key: string]: string } = {
      scales: `
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <g fill="${colorPalette.primary}">
            <rect x="45" y="20" width="10" height="60"/>
            <circle cx="25" cy="35" r="15" fill="none" stroke="${colorPalette.primary}" stroke-width="2"/>
            <circle cx="75" cy="35" r="15" fill="none" stroke="${colorPalette.primary}" stroke-width="2"/>
            <line x1="25" y1="20" x2="75" y2="20" stroke="${colorPalette.primary}" stroke-width="3"/>
            <rect x="20" y="75" width="60" height="5"/>
          </g>
        </svg>
      `,
      gavel: `
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <g fill="${colorPalette.primary}">
            <rect x="20" y="30" width="40" height="10" rx="5" transform="rotate(45 40 35)"/>
            <rect x="35" y="45" width="8" height="30"/>
            <ellipse cx="45" cy="80" rx="15" ry="5"/>
          </g>
        </svg>
      `,
      document: `
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <g fill="${colorPalette.primary}">
            <rect x="25" y="15" width="50" height="70" fill="none" stroke="${colorPalette.primary}" stroke-width="2"/>
            <line x1="35" y1="30" x2="65" y2="30" stroke="${colorPalette.secondary}" stroke-width="2"/>
            <line x1="35" y1="40" x2="65" y2="40" stroke="${colorPalette.secondary}" stroke-width="2"/>
            <line x1="35" y1="50" x2="55" y2="50" stroke="${colorPalette.secondary}" stroke-width="2"/>
          </g>
        </svg>
      `,
      shield: `
        <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 15 L25 25 L25 55 Q25 75 50 85 Q75 75 75 55 L75 25 Z" 
                fill="none" stroke="${colorPalette.primary}" stroke-width="3"/>
          <path d="M40 45 L47 52 L65 35" fill="none" stroke="${colorPalette.accent}" stroke-width="3"/>
        </svg>
      `
    };

    return iconTemplates[iconType] || iconTemplates['scales'];
  }

  // Helper method to create common legal charts
  createStrengthChart(strengths: string[], colorPalette: any): ChartConfig {
    return {
      type: 'bar',
      data: {
        labels: strengths.map(s => s.substring(0, 20) + '...'),
        datasets: [{
          label: 'Strength Assessment',
          data: strengths.map(() => Math.floor(Math.random() * 40) + 60), // 60-100 range
          backgroundColor: [colorPalette.primary, colorPalette.accent, colorPalette.secondary]
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Key Strengths Analysis'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Strength Score'
            }
          }
        }
      }
    };
  }

  createRiskChart(risks: string[], colorPalette: any): ChartConfig {
    return {
      type: 'doughnut',
      data: {
        labels: ['Low Risk', 'Medium Risk', 'High Risk'],
        datasets: [{
          label: 'Risk Assessment',
          data: [60, 30, 10], // Sample risk distribution
          backgroundColor: [colorPalette.primary, '#FFA500', '#FF6B6B']
        }]
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Risk Distribution'
          }
        }
      }
    };
  }

  createTimelineFlowchart(milestones: any[], colorPalette: any): DiagramConfig {
    const flowchart = `
      flowchart TD
        Start([Case Initiation]) --> Phase1[Pre-trial Preparation]
        Phase1 --> Phase2[Discovery Phase]
        Phase2 --> Phase3[Motion Practice]
        Phase3 --> Phase4[Trial Preparation]
        Phase4 --> End([Resolution])
        
        style Start fill:${colorPalette.primary}
        style End fill:${colorPalette.accent}
        style Phase1 fill:${colorPalette.secondary}
        style Phase2 fill:${colorPalette.secondary}
        style Phase3 fill:${colorPalette.secondary}
        style Phase4 fill:${colorPalette.secondary}
    `;

    return {
      type: 'flowchart',
      content: flowchart
    };
  }

  async cleanupTempFiles(): Promise<void> {
    try {
      const files = fs.readdirSync(this.outputDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < oneHourAgo) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up graphics temp files:', error);
    }
  }
}