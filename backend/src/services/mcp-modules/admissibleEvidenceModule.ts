import { MCPModuleInput, MCPModuleOutput } from '../../types';

export interface AdmissibleEvidenceData {
  physicalEvidence: { item: string; admissibility: string; challenges: string[] }[];
  testimonialEvidence: { witness: string; relevance: string; credibility: string }[];
  documentaryEvidence: { document: string; authenticity: string; relevance: string }[];
  digitalEvidence: { type: string; forensicRequirements: string; chainOfCustody: string }[];
  expertEvidence: { field: string; necessity: string; qualifications: string }[];
  excludableEvidence: { evidence: string; grounds: string; likelihood: string }[];
  evidenceStrategy: string;
}

export class AdmissibleEvidenceModule {
  async analyze(input: MCPModuleInput): Promise<MCPModuleOutput> {
    // Extract case information for evidence analysis
    const caseDetails = input.caseDetails;
    const isCivilCase = caseDetails?.caseType === 'CIVIL_LITIGATION';
    const isContractDispute = caseDetails?.title?.toLowerCase().includes('contract');
    
    const mockData: AdmissibleEvidenceData = isCivilCase && isContractDispute ? {
      physicalEvidence: [
        {
          item: "Original Service Contract (15 pages with amendments)",
          admissibility: "Highly admissible as primary contract document",
          challenges: ["Authentication of amendments", "Signature verification"]
        },
        {
          item: "Payment Records and Bank Statements",
          admissibility: "Admissible as business records",
          challenges: ["Completeness of records", "Matching payment to specific services"]
        }
      ],
      testimonialEvidence: [
        {
          witness: "Mr. Smith (Plaintiff) - Client Interview",
          relevance: "Direct testimony on contract expectations and breach allegations",
          credibility: "Strong first-hand knowledge, potential bias as interested party"
        },
        {
          witness: "Ms. Johnson (Defendant) - Defendant Deposition", 
          relevance: "Defense perspective on service delivery and payment justification",
          credibility: "Key defendant testimony, credibility depends on documentation support"
        },
        {
          witness: "Project Manager - Key witness interview",
          relevance: "Third-party testimony on project timeline and delivery milestones",
          credibility: "Neutral witness with professional expertise and direct involvement"
        }
      ],
      documentaryEvidence: [
        {
          document: "47 Email Communications between parties",
          authenticity: "Digital signature verification and metadata analysis",
          relevance: "Critical evidence of service delivery issues and payment disputes"
        },
        {
          document: "Service Delivery Reports and Quality Assessments",
          authenticity: "Business records with proper foundation",
          relevance: "Establishes actual performance vs contract requirements"
        },
        {
          document: "Financial Impact Analysis and Damages Calculation",
          authenticity: "Expert accountant certification required",
          relevance: "Quantifies economic losses and mitigation efforts"
        }
      ],
      digitalEvidence: [
        {
          type: "Email communications and electronic documents",
          forensicRequirements: "Digital forensics to verify authenticity and timeline",
          chainOfCustody: "Proper preservation of electronic records and metadata"
        },
        {
          type: "Electronic payment records and bank transactions",
          forensicRequirements: "Financial records analysis and verification",
          chainOfCustody: "Bank records authentication and completeness verification"
        }
      ],
      expertEvidence: [
        {
          field: "Technical Consulting and Industry Standards",
          necessity: "Expert testimony on industry standards and service quality assessment",
          qualifications: "Certified technical consultant with relevant industry experience"
        },
        {
          field: "Financial Analysis and Damages Calculation",
          necessity: "Expert analysis on damages calculation and economic impact assessment",
          qualifications: "Certified Public Accountant with litigation support experience"
        }
      ],
      excludableEvidence: [
        {
          evidence: "Privileged attorney-client communications",
          grounds: "Legal professional privilege",
          likelihood: "High - protected communications"
        },
        {
          evidence: "Settlement negotiations communications",
          grounds: "Without prejudice privilege",
          likelihood: "Medium - depends on specific settlement communications"
        }
      ],
      evidenceStrategy: "Comprehensive evidence strategy focusing on: (1) Strong documentary foundation through original contracts and email communications, (2) Expert testimony to establish industry standards and quantify damages, (3) Third-party witnesses to provide neutral perspective on service delivery, (4) Digital evidence authentication to support timeline and communications, (5) Financial records to demonstrate actual payments vs claimed amounts."
    } : {
      // Default criminal case evidence analysis
      physicalEvidence: [
        {
          item: "Alleged weapon",
          admissibility: "Admissible if properly seized",
          challenges: ["Chain of custody", "Warrant requirements", "Search reasonableness"]
        },
        {
          item: "Clothing with alleged evidence",
          admissibility: "Subject to forensic analysis",
          challenges: ["Contamination concerns", "Storage protocols"]
        }
      ],
      testimonialEvidence: [
        {
          witness: "Complainant testimony",
          relevance: "Direct evidence of alleged incident",
          credibility: "Subject to cross-examination on inconsistencies"
        },
        {
          witness: "Police officer observations",
          relevance: "Scene and arrest circumstances",
          credibility: "Generally credible but challengeable on procedure"
        }
      ],
      documentaryEvidence: [
        {
          document: "Medical records",
          authenticity: "Requires proper business records foundation",
          relevance: "Establishes extent of alleged injuries"
        },
        {
          document: "Security camera footage",
          authenticity: "Chain of custody and timestamp verification",
          relevance: "May corroborate or contradict witness accounts"
        }
      ],
      digitalEvidence: [
        {
          type: "Cell phone communications",
          forensicRequirements: "Proper extraction and analysis protocols",
          chainOfCustody: "Must be maintained from seizure to court"
        }
      ],
      expertEvidence: [
        {
          field: "Forensic pathology",
          necessity: "If injury pattern analysis required",
          qualifications: "Board-certified forensic pathologist"
        },
        {
          field: "Digital forensics",
          necessity: "For electronic evidence analysis",
          qualifications: "Certified computer forensics examiner"
        }
      ],
      excludableEvidence: [
        {
          evidence: "Statements made without Charter warning",
          grounds: "s. 10(b) Charter breach",
          likelihood: "High if proper caution not given"
        },
        {
          evidence: "Evidence from unreasonable search",
          grounds: "s. 8 Charter breach",
          likelihood: "Depends on warrant validity and execution"
        }
      ],
      evidenceStrategy: "Focus on Charter applications to exclude problematic evidence. Strengthen admissible evidence through proper foundation and expert testimony."
    };

    return {
      moduleType: 'ADMISSIBLE_EVIDENCE',
      data: mockData,
      confidence: 0.82,
      sources: [
        "Canada Evidence Act",
        "Charter s. 24(2) Grant Framework",
        "Evidence Law Precedents"
      ],
      timestamp: new Date()
    };
  }
}