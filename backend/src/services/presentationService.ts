import pptx from 'pptxgenjs';
import { SynthesizedStrategy } from './aiOrchestrationService';
import { PresentationTemplateService, LawFirmTemplate } from './presentationTemplateService';
import path from 'path';
import fs from 'fs';

export interface PresentationOptions {
  theme?: 'professional' | 'legal' | 'modern';
  templateId?: string;  // New: Template ID for law firm branding
  includeCharts?: boolean;
  clientName?: string;
  caseTitle?: string;
  lawyerName?: string;
  firmName?: string;
}

export class PresentationService {
  private outputDir: string;
  private templateService: PresentationTemplateService;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp');
    this.templateService = new PresentationTemplateService();
    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generatePresentation(
    strategy: SynthesizedStrategy,
    options: PresentationOptions = {}
  ): Promise<string> {
    // Use template if specified, otherwise fall back to default method
    if (options.templateId) {
      return this.generatePresentationWithTemplate(strategy, options);
    }
    
    const presentation = new pptx();
    
    // Configure presentation settings
    this.configurePresentationSettings(presentation, options);
    
    // Add slides
    this.addTitleSlide(presentation, options);
    this.addExecutiveSummarySlide(presentation, strategy);
    this.addCaseStrengthsSlide(presentation, strategy);
    this.addWeaknessesAndMitigationSlide(presentation, strategy);
    this.addRecommendedApproachSlide(presentation, strategy);
    this.addTimelineSlide(presentation, strategy);
    this.addRiskAssessmentSlide(presentation, strategy);
    this.addExpectedOutcomesSlide(presentation, strategy);
    this.addAlternativeStrategiesSlide(presentation, strategy);
    this.addNextStepsSlide(presentation, strategy);

    // Generate filename and save
    const filename = this.generateFilename(options);
    const filepath = path.join(this.outputDir, filename);
    
    await presentation.writeFile({ fileName: filepath });
    
    return filename;
  }

  private configurePresentationSettings(presentation: pptx.PptxGenJS, options: PresentationOptions): void {
    presentation.defineLayout({ name: 'LAYOUT_16x9', width: 10, height: 5.625 });
    presentation.layout = 'LAYOUT_16x9';
    
    // Define color scheme based on theme
    const colorScheme = this.getColorScheme(options.theme || 'professional');
    
    // Set master slide properties
    presentation.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: { fill: colorScheme.background },
      objects: [
        {
          placeholder: {
            options: { name: 'title', type: 'title', x: 0.5, y: 0.2, w: 9, h: 1 },
            text: options.firmName || 'Legal Strategy Presentation'
          }
        }
      ]
    });
  }

  private getColorScheme(theme: string) {
    switch (theme) {
      case 'legal':
        return {
          primary: '1F4E79',
          secondary: '7F7F7F',
          accent: 'C5504B',
          background: 'FFFFFF',
          text: '000000'
        };
      case 'modern':
        return {
          primary: '2E86AB',
          secondary: 'A23B72',
          accent: 'F18F01',
          background: 'FFFFFF',
          text: '333333'
        };
      default: // professional
        return {
          primary: '1F4E79',
          secondary: '7F7F7F',
          accent: '70AD47',
          background: 'FFFFFF',
          text: '000000'
        };
    }
  }

  private addTitleSlide(presentation: pptx.PptxGenJS, options: PresentationOptions): void {
    const slide = presentation.addSlide();
    const colorScheme = this.getColorScheme(options.theme || 'professional');

    slide.addText('Legal Strategy Presentation', {
      x: 1,
      y: 1.5,
      w: 8,
      h: 1,
      fontSize: 36,
      bold: true,
      color: colorScheme.primary,
      align: 'center'
    });

    if (options.caseTitle) {
      slide.addText(options.caseTitle, {
        x: 1,
        y: 2.5,
        w: 8,
        h: 0.5,
        fontSize: 20,
        color: colorScheme.text,
        align: 'center'
      });
    }

    if (options.lawyerName || options.firmName) {
      slide.addText(`${options.lawyerName || ''}\n${options.firmName || ''}`, {
        x: 1,
        y: 4,
        w: 8,
        h: 1,
        fontSize: 14,
        color: colorScheme.secondary,
        align: 'center'
      });
    }

    slide.addText(`Generated: ${new Date().toLocaleDateString()}`, {
      x: 1,
      y: 5,
      w: 8,
      h: 0.3,
      fontSize: 10,
      color: colorScheme.secondary,
      align: 'center'
    });
  }

  private addExecutiveSummarySlide(presentation: pptx.PptxGenJS, strategy: SynthesizedStrategy): void {
    const slide = presentation.addSlide();
    const colorScheme = this.getColorScheme('professional');

    slide.addText('Executive Summary', {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: colorScheme.primary
    });

    slide.addText(strategy.executiveSummary, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 4,
      fontSize: 16,
      color: colorScheme.text,
      valign: 'top'
    });
  }

  private addCaseStrengthsSlide(presentation: pptx.PptxGenJS, strategy: SynthesizedStrategy): void {
    const slide = presentation.addSlide();
    const colorScheme = this.getColorScheme('professional');

    slide.addText('Case Strengths', {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: colorScheme.primary
    });

    const strengthsList = strategy.keyStrengths.map(strength => `• ${strength}`).join('\n');
    
    slide.addText(strengthsList, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 4,
      fontSize: 16,
      color: colorScheme.text,
      valign: 'top',
      bullet: true
    });
  }

  private addWeaknessesAndMitigationSlide(presentation: pptx.PptxGenJS, strategy: SynthesizedStrategy): void {
    const slide = presentation.addSlide();
    const colorScheme = this.getColorScheme('professional');

    slide.addText('Potential Challenges & Mitigation', {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: colorScheme.primary
    });

    const weaknessesList = strategy.potentialWeaknesses.map(weakness => `• ${weakness}`).join('\n');
    
    slide.addText('Challenges:', {
      x: 0.5,
      y: 1.2,
      w: 4,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: colorScheme.accent
    });

    slide.addText(weaknessesList, {
      x: 0.5,
      y: 1.8,
      w: 4,
      h: 3,
      fontSize: 14,
      color: colorScheme.text,
      valign: 'top'
    });

    // Add mitigation strategies from risk assessment
    const mitigationList = strategy.riskAssessment
      .map(risk => `• ${risk.mitigation}`)
      .join('\n');

    slide.addText('Mitigation Strategies:', {
      x: 5,
      y: 1.2,
      w: 4,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: colorScheme.accent
    });

    slide.addText(mitigationList, {
      x: 5,
      y: 1.8,
      w: 4,
      h: 3,
      fontSize: 14,
      color: colorScheme.text,
      valign: 'top'
    });
  }

  private addRecommendedApproachSlide(presentation: pptx.PptxGenJS, strategy: SynthesizedStrategy): void {
    const slide = presentation.addSlide();
    const colorScheme = this.getColorScheme('professional');

    slide.addText('Recommended Approach', {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: colorScheme.primary
    });

    slide.addText(strategy.recommendedApproach, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 2,
      fontSize: 16,
      color: colorScheme.text,
      valign: 'top'
    });

    slide.addText('Tactical Considerations:', {
      x: 0.5,
      y: 3.5,
      w: 9,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: colorScheme.accent
    });

    const tacticalList = strategy.tacticalConsiderations.map(tactic => `• ${tactic}`).join('\n');
    
    slide.addText(tacticalList, {
      x: 0.5,
      y: 4,
      w: 9,
      h: 1.5,
      fontSize: 14,
      color: colorScheme.text,
      valign: 'top'
    });
  }

  private addTimelineSlide(presentation: pptx.PptxGenJS, strategy: SynthesizedStrategy): void {
    const slide = presentation.addSlide();
    const colorScheme = this.getColorScheme('professional');

    slide.addText('Timeline & Milestones', {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: colorScheme.primary
    });

    // Create timeline table
    const timelineData = [
      ['Phase', 'Timeline', 'Key Objectives'],
      ...strategy.timelineAndMilestones.map(milestone => [
        milestone.phase,
        milestone.timeline,
        milestone.objectives.join(', ')
      ])
    ];

    slide.addTable(timelineData, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 3.5,
      border: { pt: 1, color: colorScheme.secondary },
      fontSize: 12,
      color: colorScheme.text
    });
  }

  private addRiskAssessmentSlide(presentation: pptx.PptxGenJS, strategy: SynthesizedStrategy): void {
    const slide = presentation.addSlide();
    const colorScheme = this.getColorScheme('professional');

    slide.addText('Risk Assessment', {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: colorScheme.primary
    });

    const riskData = [
      ['Risk', 'Likelihood', 'Mitigation Strategy'],
      ...strategy.riskAssessment.map(risk => [
        risk.risk,
        risk.likelihood,
        risk.mitigation
      ])
    ];

    slide.addTable(riskData, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 3.5,
      border: { pt: 1, color: colorScheme.secondary },
      fontSize: 12,
      color: colorScheme.text
    });
  }

  private addExpectedOutcomesSlide(presentation: pptx.PptxGenJS, strategy: SynthesizedStrategy): void {
    const slide = presentation.addSlide();
    const colorScheme = this.getColorScheme('professional');

    slide.addText('Expected Outcomes', {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: colorScheme.primary
    });

    const outcomesList = strategy.expectedOutcomes.map(outcome => `• ${outcome}`).join('\n');
    
    slide.addText(outcomesList, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 4,
      fontSize: 16,
      color: colorScheme.text,
      valign: 'top',
      bullet: true
    });
  }

  private addAlternativeStrategiesSlide(presentation: pptx.PptxGenJS, strategy: SynthesizedStrategy): void {
    const slide = presentation.addSlide();
    const colorScheme = this.getColorScheme('professional');

    slide.addText('Alternative Strategies', {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: colorScheme.primary
    });

    const alternativesList = strategy.alternativeStrategies.map(alt => `• ${alt}`).join('\n');
    
    slide.addText(alternativesList, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 4,
      fontSize: 16,
      color: colorScheme.text,
      valign: 'top',
      bullet: true
    });
  }

  private addNextStepsSlide(presentation: pptx.PptxGenJS, strategy: SynthesizedStrategy): void {
    const slide = presentation.addSlide();
    const colorScheme = this.getColorScheme('professional');

    slide.addText('Next Steps', {
      x: 0.5,
      y: 0.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: colorScheme.primary
    });

    // Extract immediate next steps from first timeline phase
    const immediateSteps = strategy.timelineAndMilestones[0]?.objectives || [
      'Review and approve strategy',
      'Begin implementation of recommended approach',
      'Schedule follow-up consultation'
    ];

    const stepsList = immediateSteps.map(step => `• ${step}`).join('\n');
    
    slide.addText('Immediate Actions:', {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: colorScheme.accent
    });

    slide.addText(stepsList, {
      x: 0.5,
      y: 1.8,
      w: 9,
      h: 2,
      fontSize: 16,
      color: colorScheme.text,
      valign: 'top',
      bullet: true
    });

    slide.addText('Questions & Discussion', {
      x: 0.5,
      y: 4.5,
      w: 9,
      h: 1,
      fontSize: 20,
      bold: true,
      color: colorScheme.primary,
      align: 'center'
    });
  }

  private async generatePresentationWithTemplate(
    strategy: SynthesizedStrategy,
    options: PresentationOptions
  ): Promise<string> {
    console.log(`Generating presentation with template: ${options.templateId}`);

    // Prepare slide data for template
    const slideData = [
      {
        title: `Legal Strategy: ${options.caseTitle || 'Case Analysis'}`,
        content: [
          strategy.executiveSummary || 'Comprehensive legal strategy analysis',
          `Prepared for: ${options.clientName || 'Client'}`,
          `By: ${options.lawyerName || 'Legal Team'}`,
          `Firm: ${options.firmName || 'Law Firm'}`
        ],
        type: 'title',
        pageNumber: 1,
        totalSlides: 10
      },
      {
        title: '⚖️ Executive Summary',
        content: [
          strategy.executiveSummary || 'Strategic legal analysis and recommendations',
          'Evidence-based approach to case management',
          'Comprehensive risk assessment and mitigation strategies'
        ],
        type: 'content',
        pageNumber: 2,
        totalSlides: 10
      },
      {
        title: '💪 Key Strengths & Advantages',
        content: strategy.keyStrengths || ['Strong legal foundation', 'Evidence-based approach', 'Precedent support'],
        type: 'content',
        pageNumber: 3,
        totalSlides: 10
      },
      {
        title: '⚠️ Risk Analysis & Mitigation',
        content: strategy.potentialWeaknesses || ['Identified challenges', 'Mitigation strategies', 'Contingency planning'],
        type: 'content',
        pageNumber: 4,
        totalSlides: 10
      },
      {
        title: '🎯 Recommended Approach',
        content: [
          strategy.recommendedApproach || 'Strategic recommendation based on comprehensive analysis',
          'Evidence-driven decision making',
          'Goal-oriented execution plan',
          'Stakeholder alignment strategy'
        ],
        type: 'content',
        pageNumber: 5,
        totalSlides: 10
      },
      {
        title: '📅 Timeline & Milestones',
        content: strategy.tacticalConsiderations || ['Phase 1: Preparation', 'Phase 2: Discovery', 'Phase 3: Resolution'],
        type: 'content',
        pageNumber: 6,
        totalSlides: 10
      },
      {
        title: '📊 Risk Assessment Matrix',
        content: [
          'Likelihood vs Impact Analysis',
          'Risk Mitigation Strategies',
          'Contingency Planning',
          'Success Probability Assessment'
        ],
        type: 'content',
        pageNumber: 7,
        totalSlides: 10
      },
      {
        title: '🎯 Expected Outcomes',
        content: strategy.expectedOutcomes || ['Favorable resolution', 'Cost-effective approach', 'Timely completion'],
        type: 'content',
        pageNumber: 8,
        totalSlides: 10
      },
      {
        title: '🔄 Alternative Strategies',
        content: strategy.alternativeStrategies || ['Alternative approach A', 'Alternative approach B', 'Fallback options'],
        type: 'content',
        pageNumber: 9,
        totalSlides: 10
      },
      {
        title: '✅ Next Steps & Action Items',
        content: [
          'Immediate action items',
          'Resource requirements assessment',
          'Success metrics establishment',
          'Follow-up schedule creation',
          'Questions & Discussion'
        ],
        type: 'conclusion',
        pageNumber: 10,
        totalSlides: 10
      }
    ];

    // Generate presentation using template
    const presentation = this.templateService.createPresentationWithTemplate(
      options.templateId!,
      slideData,
      {
        caseTitle: options.caseTitle,
        clientName: options.clientName,
        lawyerName: options.lawyerName,
        firmName: options.firmName
      }
    );

    // Generate filename and save
    const filename = this.generateFilename(options);
    const filepath = path.join(this.outputDir, filename);
    
    await presentation.writeFile(filepath);
    console.log(`Template-based presentation saved: ${filename}`);
    
    return filename;
  }

  // Method to get available templates
  getAvailableTemplates(): LawFirmTemplate[] {
    return this.templateService.getAvailableTemplates();
  }

  // Method to upload custom template
  async uploadFirmTemplate(
    firmId: string,
    templateFile: Buffer,
    templateConfig: any
  ): Promise<string> {
    return this.templateService.uploadCustomTemplate(firmId, templateFile, templateConfig);
  }

  // Method to upload firm logo
  async uploadFirmLogo(firmId: string, logoFile: Buffer, filename: string): Promise<string> {
    return this.templateService.uploadFirmLogo(firmId, logoFile, filename);
  }

  private generateFilename(options: PresentationOptions): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const caseTitle = options.caseTitle?.replace(/[^a-zA-Z0-9]/g, '_') || 'strategy';
    const templateSuffix = options.templateId ? `_${options.templateId}` : '';
    return `legal_strategy_${caseTitle}${templateSuffix}_${timestamp}_${Date.now()}.pptx`;
  }

  async getPresentation(filename: string): Promise<Buffer | null> {
    const filepath = path.join(this.outputDir, filename);
    
    try {
      if (fs.existsSync(filepath)) {
        return fs.readFileSync(filepath);
      }
      return null;
    } catch (error) {
      console.error('Error reading presentation file:', error);
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
      console.error('Error deleting presentation file:', error);
      return false;
    }
  }
}