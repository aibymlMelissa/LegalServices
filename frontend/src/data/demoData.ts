// Demo data for the Legal Services Platform

export const DEMO_CASES = [
  {
    id: 'demo-case-1',
    title: 'Johnson vs. TechCorp Employment Dispute',
    description: 'Wrongful termination case involving discrimination claims and non-compete agreement violations. Client alleges termination based on age discrimination and retaliation for reporting safety violations.',
    caseType: 'CIVIL_LITIGATION',
    status: 'ACTIVE',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z',
    userId: 'demo-user-001',
    services: [
      {
        id: 'demo-service-1',
        title: 'AI-Generated Strategy Analysis',
        caseId: 'demo-case-1',
        legalDoctrine: JSON.stringify({
          analysis: 'Employment law doctrine focusing on at-will employment exceptions and discrimination protections.',
          relevantLaws: ['Title VII of Civil Rights Act', 'Age Discrimination in Employment Act', 'State Whistleblower Protection Act'],
          keyPrinciples: ['Burden of proof in discrimination cases', 'Pretext analysis', 'Protected activity definition'],
          confidence: 0.92
        }),
        legalProcedure: JSON.stringify({
          analysis: 'Federal civil procedure for employment discrimination cases in federal court.',
          requiredFilings: ['EEOC Charge', 'Right to Sue Letter', 'Federal Court Complaint'],
          timelines: ['180/300 day EEOC deadline', '90 day federal filing deadline'],
          confidence: 0.88
        }),
        synthesizedServices: JSON.stringify({
          executiveSummary: 'Strong employment discrimination case with multiple viable claims including age discrimination, retaliation, and potential contract violations.',
          keyStrengths: [
            'Clear documentation of discriminatory comments by supervisor',
            'Pattern of replacing older employees with younger workers',
            'Protected whistleblowing activity prior to termination',
            'Violations of company policy procedures'
          ],
          potentialWeaknesses: [
            'At-will employment status',
            'Performance issues documented in file',
            'Economic downturn affecting company layoffs'
          ],
          recommendedApproach: 'Pursue federal discrimination claim while negotiating settlement. Prepare for discovery phase focusing on company hiring patterns and supervisor communications.',
          expectedOutcomes: ['Settlement range $75,000-$150,000', 'Trial verdict potential $200,000+', 'Reinstatement possible but unlikely'],
          timelineAndMilestones: [
            { phase: 'Discovery', timeline: '6 months', objectives: ['Document production', 'Depositions', 'Expert witness identification'] },
            { phase: 'Mediation', timeline: '8 months', objectives: ['Settlement negotiations', 'Damage calculation', 'Resolution attempt'] },
            { phase: 'Trial Preparation', timeline: '12 months', objectives: ['Witness preparation', 'Exhibit preparation', 'Trial briefs'] }
          ]
        }),
        createdAt: '2024-01-16T09:15:00Z',
        updatedAt: '2024-01-16T09:15:00Z'
      }
    ],
    evidence: [
      {
        id: 'demo-evidence-1',
        title: 'Supervisor Email Thread',
        description: 'Email communications showing discriminatory language and bias',
        evidenceType: 'DIGITAL',
        metadata: { fileType: 'email', dateRange: '2023-10-01 to 2023-12-15' },
        createdAt: '2024-01-15T11:00:00Z',
        caseId: 'demo-case-1'
      },
      {
        id: 'demo-evidence-2',
        title: 'Performance Review History',
        description: 'Three years of performance reviews showing consistent good ratings',
        evidenceType: 'DOCUMENT',
        metadata: { pages: 15, years: '2021-2023' },
        createdAt: '2024-01-15T11:30:00Z',
        caseId: 'demo-case-1'
      }
    ]
  },
  {
    id: 'demo-case-2',
    title: 'State vs. Anderson Criminal Defense',
    description: 'White-collar criminal defense case involving alleged financial fraud, money laundering, and conspiracy charges. Complex multi-defendant case with extensive financial records.',
    caseType: 'CRIMINAL_DEFENSE',
    status: 'ACTIVE',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-22T16:30:00Z',
    userId: 'demo-user-001',
    services: [
      {
        id: 'demo-service-2',
        title: 'Criminal Defense Strategy Analysis',
        caseId: 'demo-case-2',
        legalDoctrine: JSON.stringify({
          analysis: 'Federal criminal law focusing on white-collar defense strategies and constitutional protections.',
          relevantLaws: ['18 USC § 1341 (Mail Fraud)', '18 USC § 1956 (Money Laundering)', '18 USC § 371 (Conspiracy)'],
          keyPrinciples: ['Burden of proof beyond reasonable doubt', 'Intent requirements', 'Conspiracy elements'],
          confidence: 0.95
        }),
        synthesizedServices: JSON.stringify({
          executiveSummary: 'Complex white-collar criminal case requiring thorough financial analysis and aggressive pretrial motions strategy.',
          keyStrengths: [
            'Lack of direct evidence of criminal intent',
            'Potential Fourth Amendment violations in search',
            'Weak conspiracy evidence linking defendant to co-conspirators',
            'Strong character witnesses and community ties'
          ],
          recommendedApproach: 'File comprehensive suppression motions, challenge financial analysis methodology, negotiate plea with cooperation if evidence is strong.',
          expectedOutcomes: ['Dismissal of some charges possible', 'Plea negotiation likely', 'Trial risk assessment: moderate to high']
        }),
        createdAt: '2024-01-11T14:20:00Z',
        updatedAt: '2024-01-11T14:20:00Z'
      }
    ],
    evidence: [
      {
        id: 'demo-evidence-3',
        title: 'Financial Records 2020-2023',
        description: 'Bank statements, transaction records, and accounting documents',
        evidenceType: 'DOCUMENT',
        metadata: { fileCount: 847, totalPages: 3421 },
        createdAt: '2024-01-10T10:00:00Z',
        caseId: 'demo-case-2'
      }
    ]
  },
  {
    id: 'demo-case-3',
    title: 'Martinez Family Custody Dispute',
    description: 'Child custody modification case involving relocation, parenting time adjustments, and child support modifications.',
    caseType: 'FAMILY_LAW',
    status: 'DRAFT',
    createdAt: '2024-01-25T13:15:00Z',
    updatedAt: '2024-01-25T13:15:00Z',
    userId: 'demo-user-001',
    services: [],
    evidence: []
  }
];

export const DEMO_COURSES = [
  {
    id: 'demo-course-1',
    title: 'Employment Law Fundamentals',
    description: 'Comprehensive course covering employment law principles, discrimination cases, and workplace regulations for new attorneys.',
    topics: [
      {
        id: 'topic-1',
        title: 'Introduction to Employment Law',
        description: 'Overview of employment law principles, historical development, and key federal legislation.',
        orderIndex: 0,
        areas: [
          {
            id: 'area-1',
            title: 'Historical Development of Employment Law',
            description: 'Evolution from common law to modern employment statutes.',
            orderIndex: 0,
            content: {
              id: 'content-1',
              textContent: `Employment law has evolved significantly from the traditional at-will employment doctrine to a complex framework of federal and state protections.

Key Historical Milestones:
- 1935: National Labor Relations Act
- 1964: Title VII of Civil Rights Act
- 1967: Age Discrimination in Employment Act
- 1990: Americans with Disabilities Act

The modern employment relationship balances employer prerogatives with employee protections, creating a nuanced legal landscape that attorneys must navigate carefully.`,
              objectives: [
                'Understand the historical development of employment law',
                'Identify key legislative milestones',
                'Analyze the shift from at-will to protected employment',
                'Recognize the interplay between federal and state laws'
              ],
              materials: [
                {
                  id: 'mat-1',
                  title: 'Employment Law Timeline',
                  type: 'document',
                  url: '/materials/timeline.pdf',
                  description: 'Comprehensive timeline of employment law development'
                },
                {
                  id: 'mat-2',
                  title: 'Key Legislation Summary',
                  type: 'document',
                  url: '/materials/legislation.pdf',
                  description: 'Summary of major employment law statutes'
                }
              ],
              cases: [
                {
                  id: 'case-1',
                  title: 'Griggs v. Duke Power Co.',
                  citation: '401 U.S. 424 (1971)',
                  summary: 'Landmark Supreme Court case establishing the disparate impact theory under Title VII.',
                  relevantLaws: ['Title VII'],
                  keyPoints: [
                    'Prohibited employment practices need not be intentionally discriminatory',
                    'Employer burden to show job-relatedness of requirements',
                    'Business necessity defense'
                  ],
                  outcome: 'Unanimous decision favoring plaintiff',
                  lessonLearned: 'Employment tests and requirements must be job-related and consistent with business necessity.'
                }
              ],
              assessments: [
                {
                  id: 'assess-1',
                  title: 'Historical Development Quiz',
                  type: 'quiz',
                  description: 'Multiple choice quiz on key dates and legislation',
                  criteria: ['Accuracy', 'Comprehension', 'Application'],
                  weight: 10
                }
              ]
            }
          }
        ]
      },
      {
        id: 'topic-2',
        title: 'Discrimination and Harassment Law',
        description: 'Deep dive into discrimination claims, harassment, and hostile work environment cases.',
        orderIndex: 1,
        areas: [
          {
            id: 'area-2',
            title: 'Types of Discrimination Claims',
            description: 'Overview of protected classes and discrimination theories.',
            orderIndex: 0,
            content: {
              id: 'content-2',
              textContent: `Discrimination in employment can take various forms and affect different protected classes.

Protected Classes under Federal Law:
- Race and Color
- Religion
- Sex (including pregnancy, gender identity, sexual orientation)
- National Origin
- Age (40 and older)
- Disability

Types of Discrimination:
- Disparate Treatment: Intentional discrimination
- Disparate Impact: Neutral policies with discriminatory effects
- Harassment: Unwelcome conduct based on protected characteristics`,
              objectives: [
                'Identify all federally protected classes',
                'Distinguish between disparate treatment and disparate impact',
                'Recognize harassment and hostile work environment claims',
                'Apply legal standards to fact patterns'
              ],
              materials: [],
              cases: [],
              assessments: []
            }
          }
        ]
      }
    ],
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-01-25T15:30:00Z'
  }
];

export const DEMO_TEMPLATES = [
  {
    id: 'demo-template-1',
    name: 'Professional Law Firm Template',
    description: 'Clean, professional template suitable for client presentations and court filings.',
    isDefault: true,
    settings: {
      colorScheme: 'professional',
      fontFamily: 'Times New Roman',
      logoPosition: 'top-left'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'demo-template-2',
    name: 'Modern Corporate Template',
    description: 'Contemporary design for corporate legal work and business presentations.',
    isDefault: false,
    settings: {
      colorScheme: 'modern',
      fontFamily: 'Arial',
      logoPosition: 'top-center'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const DEMO_USER = {
  id: 'demo-user-001',
  name: 'Demo User',
  email: 'demo@legalservices.com',
  role: 'LAWYER',
  createdAt: '2024-01-01T00:00:00Z'
};