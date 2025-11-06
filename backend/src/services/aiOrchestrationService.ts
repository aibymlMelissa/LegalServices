import axios from 'axios';
import { MCPModuleOutput, LegalStrategyRequest, LegalStrategyResponse } from '../types';

export interface LLMProvider {
  name: string;
  apiKey: string;
  endpoint: string;
}

export interface SynthesizedStrategy {
  executiveSummary: string;
  keyStrengths: string[];
  potentialWeaknesses: string[];
  recommendedApproach: string;
  tacticalConsiderations: string[];
  timelineAndMilestones: { phase: string; timeline: string; objectives: string[] }[];
  riskAssessment: { risk: string; likelihood: string; mitigation: string }[];
  expectedOutcomes: string[];
  alternativeStrategies: string[];
}

export class AIOrchestrationService {
  private llmProviders: { [key: string]: LLMProvider };

  constructor() {
    this.llmProviders = {
      openai: {
        name: 'OpenAI',
        apiKey: process.env.OPENAI_API_KEY || '',
        endpoint: 'https://api.openai.com/v1/chat/completions'
      },
      gemini: {
        name: 'Google Gemini',
        apiKey: process.env.GEMINI_API_KEY || '',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
      }
    };
  }

  async synthesizeLegalStrategy(
    mcpOutputs: { [key: string]: MCPModuleOutput },
    caseContext: any,
    provider: 'openai' | 'gemini' = 'gemini'
  ): Promise<SynthesizedStrategy> {
    const prompt = this.buildSynthesisPrompt(mcpOutputs, caseContext);
    
    try {
      if (provider === 'openai') {
        return await this.callOpenAI(prompt);
      } else {
        return await this.callGemini(prompt);
      }
    } catch (error) {
      console.error(`Error synthesizing legal strategy with ${provider}:`, error);
      // Try fallback provider
      const fallbackProvider = provider === 'openai' ? 'gemini' : 'openai';
      try {
        console.log(`Trying fallback provider: ${fallbackProvider}`);
        if (fallbackProvider === 'openai') {
          return await this.callOpenAI(prompt);
        } else {
          return await this.callGemini(prompt);
        }
      } catch (fallbackError) {
        console.error(`Fallback provider ${fallbackProvider} also failed:`, fallbackError);
        return this.generateFallbackStrategy(mcpOutputs);
      }
    }
  }

  async regenerateStrategyWithFeedback(
    mcpOutputs: { [key: string]: MCPModuleOutput },
    caseContext: any,
    previousStrategy: SynthesizedStrategy,
    professionalFeedback: any,
    provider: 'openai' | 'gemini' = 'gemini'
  ): Promise<SynthesizedStrategy> {
    const prompt = this.buildFeedbackPrompt(mcpOutputs, caseContext, previousStrategy, professionalFeedback);
    
    try {
      if (provider === 'openai') {
        return await this.callOpenAI(prompt);
      } else {
        return await this.callGemini(prompt);
      }
    } catch (error) {
      console.error(`Error regenerating strategy with feedback using ${provider}:`, error);
      // Try fallback provider
      const fallbackProvider = provider === 'openai' ? 'gemini' : 'openai';
      try {
        console.log(`Trying fallback provider for feedback regeneration: ${fallbackProvider}`);
        if (fallbackProvider === 'openai') {
          return await this.callOpenAI(prompt);
        } else {
          return await this.callGemini(prompt);
        }
      } catch (fallbackError) {
        console.error(`Fallback provider ${fallbackProvider} also failed for feedback regeneration:`, fallbackError);
        return this.generateFallbackStrategy(mcpOutputs);
      }
    }
  }

  private buildSynthesisPrompt(mcpOutputs: { [key: string]: MCPModuleOutput }, caseContext: any): string {
    return `
As an expert legal strategist with deep expertise in multimodal analysis and presentation creation, analyze the comprehensive case information and synthesize an optimal legal strategy that will be used to create compelling PowerPoint presentations.

CASE CONTEXT:
${JSON.stringify(caseContext, null, 2)}

COMPREHENSIVE MCP MODULE ANALYSIS:

🏛️ LEGAL DOCTRINE ANALYSIS:
${JSON.stringify(mcpOutputs.legalDoctrine?.data || {}, null, 2)}

📋 LEGAL PROCEDURE FRAMEWORK:
${JSON.stringify(mcpOutputs.legalProcedure?.data || {}, null, 2)}

⚖️ LEGAL PRINCIPLES FOUNDATION:
${JSON.stringify(mcpOutputs.legalPrinciples?.data || {}, null, 2)}

📁 ADMISSIBLE EVIDENCE ASSESSMENT:
${JSON.stringify(mcpOutputs.admissibleEvidence?.data || {}, null, 2)}

📚 CASE PRECEDENTS RESEARCH:
${JSON.stringify(mcpOutputs.casePrecedents?.data || {}, null, 2)}

🧠 CLIENT PSYCHOLOGY PROFILE:
${JSON.stringify(mcpOutputs.clientPsychology?.data || {}, null, 2)}

STRATEGIC SYNTHESIS REQUIREMENTS:

Generate a comprehensive, presentation-ready legal strategy that incorporates visual storytelling elements and clear, impactful messaging suitable for PowerPoint presentations. Focus on:

1. **Executive Impact**: Create compelling executive summaries that grab attention
2. **Visual Hierarchies**: Structure information for slide-by-slide clarity
3. **Narrative Flow**: Build a logical progression from analysis to action
4. **Risk Visualization**: Present risks and mitigations in clear, actionable terms
5. **Timeline Clarity**: Create milestone-driven timelines with specific deliverables
6. **Outcome Scenarios**: Present multiple pathways with probability assessments

Return your response in this exact JSON format with rich, presentation-ready content:

{
  "executiveSummary": "A compelling 2-3 sentence overview that captures the essence of the strategy and its key value proposition. Focus on the most impactful elements that would appear on slide 2 of a presentation.",
  "keyStrengths": [
    "Strength 1 - specific and quantifiable where possible",
    "Strength 2 - linked to evidence or precedent",
    "Strength 3 - client or case-specific advantage",
    "Strength 4 - procedural or strategic leverage point"
  ],
  "potentialWeaknesses": [
    "Weakness 1 - honest assessment of vulnerability",
    "Weakness 2 - procedural or evidentiary challenge",
    "Weakness 3 - opposing counsel likely arguments"
  ],
  "recommendedApproach": "A detailed 3-4 sentence strategic recommendation that clearly outlines the primary path forward, including key tactical elements and success metrics.",
  "tacticalConsiderations": [
    "Tactical point 1 - immediate action item",
    "Tactical point 2 - evidence-gathering strategy",
    "Tactical point 3 - communication/negotiation approach",
    "Tactical point 4 - contingency planning element"
  ],
  "timelineAndMilestones": [
    {
      "phase": "Discovery & Preparation",
      "timeline": "30-45 days",
      "objectives": [
        "Complete evidence review and cataloging",
        "Conduct witness interviews",
        "Prepare expert testimony framework"
      ]
    },
    {
      "phase": "Motion Practice",
      "timeline": "15-30 days", 
      "objectives": [
        "File preliminary motions",
        "Address admissibility challenges",
        "Establish procedural framework"
      ]
    },
    {
      "phase": "Settlement Negotiations",
      "timeline": "30-60 days",
      "objectives": [
        "Present compelling settlement package",
        "Leverage discovered strengths",
        "Explore alternative resolutions"
      ]
    }
  ],
  "riskAssessment": [
    {
      "risk": "Evidence exclusion or admissibility challenges",
      "likelihood": "Medium",
      "mitigation": "Prepare multiple evidentiary pathways and backup authentication methods"
    },
    {
      "risk": "Unfavorable precedent application",
      "likelihood": "Low-Medium", 
      "mitigation": "Distinguish adverse cases and emphasize favorable factual distinctions"
    },
    {
      "risk": "Client testimony vulnerabilities",
      "likelihood": "Medium",
      "mitigation": "Comprehensive witness preparation and strategic sequencing"
    }
  ],
  "expectedOutcomes": [
    "Primary outcome: Favorable settlement at 70-80% of claimed damages",
    "Secondary outcome: Favorable trial verdict with full damages recovery", 
    "Tertiary outcome: Partial recovery through negotiated resolution"
  ],
  "alternativeStrategies": [
    "Alternative 1: Emphasize business relationship preservation through structured settlement",
    "Alternative 2: Focus on precedent-setting aspects for industry standards",
    "Alternative 3: Explore mediation with industry expert as neutral facilitator"
  ]
}

CRITICAL: Ensure all content is specific, actionable, and suitable for professional presentation to clients, judges, or opposing counsel. Each element should contribute to a cohesive narrative that builds confidence and demonstrates thorough preparation.
`;
  }

  private buildFeedbackPrompt(
    mcpOutputs: { [key: string]: MCPModuleOutput }, 
    caseContext: any, 
    previousStrategy: SynthesizedStrategy, 
    professionalFeedback: any
  ): string {
    return `
As an expert legal strategist specializing in multimodal presentation development, you must regenerate and significantly improve a legal strategy based on valuable professional feedback from an experienced legal practitioner. This improved strategy will be used to create compelling PowerPoint presentations.

CASE CONTEXT:
${JSON.stringify(caseContext, null, 2)}

🔍 COMPREHENSIVE MCP MODULE ANALYSIS:
${Object.entries(mcpOutputs).map(([key, output]) => `
${key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:
${JSON.stringify(output.data || {}, null, 2)}
`).join('\n')}

📊 PREVIOUS STRATEGY BASELINE:
${JSON.stringify(previousStrategy, null, 2)}

💡 PROFESSIONAL FEEDBACK INTEGRATION:
A senior legal professional has provided the following expert feedback for improvement:

🎯 **Executive Summary Enhancement**: ${professionalFeedback.executiveSummary || 'No feedback provided'}

💪 **Strengths Amplification**: ${professionalFeedback.keyStrengths || 'No feedback provided'}

⚠️ **Vulnerability Management**: ${professionalFeedback.potentialWeaknesses || 'No feedback provided'}

🚀 **Approach Refinement**: ${professionalFeedback.recommendedApproach || 'No feedback provided'}

⚡ **Tactical Optimization**: ${professionalFeedback.tacticalConsiderations || 'No feedback provided'}

⏰ **Timeline Adjustment**: ${professionalFeedback.timelineAndMilestones || 'No feedback provided'}

🎲 **Risk Calibration**: ${professionalFeedback.riskAssessment || 'No feedback provided'}

🎯 **Outcome Refinement**: ${professionalFeedback.expectedOutcomes || 'No feedback provided'}

🔄 **Alternative Enhancement**: ${professionalFeedback.alternativeStrategies || 'No feedback provided'}

🌟 **OVERALL STRATEGIC GUIDANCE**: ${professionalFeedback.generalFeedback || 'No general feedback provided'}

IMPROVEMENT MANDATE:
Create a significantly enhanced, presentation-ready legal strategy that:

1. **Integrates Professional Wisdom**: Seamlessly incorporate all feedback while maintaining strategic coherence
2. **Enhances Visual Impact**: Structure content for maximum presentation effectiveness
3. **Addresses Specific Concerns**: Directly respond to each piece of feedback with actionable improvements
4. **Maintains Legal Rigor**: Ensure all enhancements meet professional legal standards
5. **Optimizes Client Value**: Focus on practical outcomes that serve client interests
6. **Strengthens Narrative**: Create a more compelling and persuasive story

Generate your IMPROVED strategy in this exact JSON format with enhanced, presentation-ready content:

{
  "executiveSummary": "A refined and compelling 2-3 sentence executive overview that incorporates the professional feedback while maintaining impact and clarity. Address any concerns raised about the previous summary.",
  "keyStrengths": [
    "Enhanced strength 1 - incorporating professional insights",
    "Refined strength 2 - with added specificity and evidence",
    "Amplified strength 3 - addressing feedback concerns",
    "Strengthened strength 4 - with professional validation"
  ],
  "potentialWeaknesses": [
    "Refined weakness 1 - incorporating professional assessment",
    "Enhanced weakness 2 - with improved mitigation awareness", 
    "Professional-validated weakness 3 - with realistic evaluation"
  ],
  "recommendedApproach": "An improved and detailed strategic recommendation that directly addresses professional feedback, incorporating suggested refinements while maintaining strategic focus and practical implementation pathways.",
  "tacticalConsiderations": [
    "Enhanced tactical element 1 - incorporating professional guidance",
    "Refined tactical element 2 - addressing feedback specifics",
    "Improved tactical element 3 - with professional validation",
    "Strategic tactical element 4 - optimized for outcomes"
  ],
  "timelineAndMilestones": [
    {
      "phase": "Enhanced phase name incorporating feedback",
      "timeline": "Adjusted timeline based on professional input",
      "objectives": [
        "Refined objective 1 addressing feedback",
        "Enhanced objective 2 with professional insights",
        "Improved objective 3 for better outcomes"
      ]
    }
  ],
  "riskAssessment": [
    {
      "risk": "Enhanced risk description incorporating professional perspective",
      "likelihood": "Calibrated assessment based on feedback",
      "mitigation": "Improved mitigation strategy addressing professional concerns"
    }
  ],
  "expectedOutcomes": [
    "Refined primary outcome incorporating professional insights",
    "Enhanced secondary outcome with realistic probabilities",
    "Improved tertiary outcome addressing feedback concerns"
  ],
  "alternativeStrategies": [
    "Enhanced alternative 1 incorporating professional feedback",
    "Refined alternative 2 addressing strategic concerns", 
    "Improved alternative 3 with professional validation"
  ]
}

CRITICAL SUCCESS FACTORS:
- Every element must show clear improvement from the previous version
- All professional feedback must be meaningfully addressed
- Content must be suitable for high-stakes professional presentations
- Strategy must maintain internal consistency while incorporating enhancements
- Focus on practical implementation and measurable outcomes
`;
  }

  private async callOpenAI(prompt: string): Promise<SynthesizedStrategy> {
    const response = await axios.post(
      this.llmProviders.openai.endpoint,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal strategist specializing in criminal and civil law. Provide comprehensive, practical legal strategies based on case analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.llmProviders.openai.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    return this.parseStrategyResponse(content);
  }

  private async callGemini(prompt: string): Promise<SynthesizedStrategy> {
    const response = await axios.post(
      `${this.llmProviders.gemini.endpoint}?key=${this.llmProviders.gemini.apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.2,
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
    return this.parseStrategyResponse(content);
  }

  private parseStrategyResponse(content: string): SynthesizedStrategy {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing LLM response:', error);
    }

    // Fallback parsing or default response
    return this.generateDefaultStrategy();
  }

  private generateFallbackStrategy(mcpOutputs: { [key: string]: MCPModuleOutput }): SynthesizedStrategy {
    return {
      executiveSummary: "Comprehensive defense strategy based on available evidence and precedents. Focus on procedural safeguards and constitutional protections.",
      keyStrengths: [
        "Strong precedential support available",
        "Constitutional protections applicable",
        "Client cooperation and support network"
      ],
      potentialWeaknesses: [
        "Evidence challenges require careful handling",
        "Procedural requirements must be met precisely",
        "Public perception considerations"
      ],
      recommendedApproach: "Multi-pronged defense focusing on Charter applications, evidence challenges, and alternative resolutions.",
      tacticalConsiderations: [
        "Early Charter applications to exclude problematic evidence",
        "Thorough cross-examination preparation",
        "Expert witness considerations",
        "Plea negotiation possibilities"
      ],
      timelineAndMilestones: [
        {
          phase: "Pre-trial preparation",
          timeline: "60-90 days",
          objectives: ["Complete disclosure review", "File Charter applications", "Retain experts"]
        },
        {
          phase: "Motion practice",
          timeline: "30-45 days",
          objectives: ["Argue admissibility issues", "Resolve procedural matters"]
        },
        {
          phase: "Trial preparation",
          timeline: "30 days",
          objectives: ["Finalize witness list", "Prepare client testimony", "Review strategy"]
        }
      ],
      riskAssessment: [
        {
          risk: "Evidence admission",
          likelihood: "Medium",
          mitigation: "Strong Charter applications and procedural challenges"
        },
        {
          risk: "Client testimony challenges",
          likelihood: "Medium",
          mitigation: "Thorough preparation and support accommodations"
        }
      ],
      expectedOutcomes: [
        "Potential dismissal on Charter grounds",
        "Reduced charges through negotiation",
        "Acquittal after trial",
        "Guilty plea to lesser offense"
      ],
      alternativeStrategies: [
        "Focus on restorative justice approaches",
        "Emphasize rehabilitation and community service",
        "Explore diversion programs if available"
      ]
    };
  }

  private generateDefaultStrategy(): SynthesizedStrategy {
    return {
      executiveSummary: "Standard legal strategy framework requiring case-specific customization.",
      keyStrengths: ["Legal framework available", "Procedural protections in place"],
      potentialWeaknesses: ["Requires detailed case analysis"],
      recommendedApproach: "Comprehensive legal analysis and strategic planning required.",
      tacticalConsiderations: ["Follow standard legal procedures", "Ensure client rights protected"],
      timelineAndMilestones: [
        {
          phase: "Initial assessment",
          timeline: "14 days",
          objectives: ["Complete case review", "Identify key issues"]
        }
      ],
      riskAssessment: [
        {
          risk: "Insufficient case analysis",
          likelihood: "High",
          mitigation: "Conduct thorough case review and strategy development"
        }
      ],
      expectedOutcomes: ["Strategy dependent on detailed case analysis"],
      alternativeStrategies: ["Multiple approaches available pending case specifics"]
    };
  }
}