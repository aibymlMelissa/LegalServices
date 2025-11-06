import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DemoStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  action?: string;
  page?: string;
}

interface DemoTour {
  id: string;
  name: string;
  description: string;
  steps: DemoStep[];
}

interface DemoContextType {
  isDemoMode: boolean;
  currentTour: string | null;
  currentStep: number;
  demoUser: DemoUser | null;
  availableTours: DemoTour[];
  
  // Functions
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  skipToStep: (stepIndex: number) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEMO_USER: DemoUser = {
  id: 'demo-user-001',
  name: 'Demo User',
  email: 'demo@legalservices.com',
  role: 'LAWYER'
};

const DEMO_TOURS: DemoTour[] = [
  {
    id: 'platform-overview',
    name: 'Platform Overview',
    description: 'Get an overview of all platform features',
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to Legal Services Platform',
        description: 'This demo will guide you through all the features of our AI-powered legal platform.',
        page: '/dashboard'
      },
      {
        id: 'dashboard-overview',
        title: 'Dashboard Overview',
        description: 'Your dashboard provides access to all platform features including case management, AI services, and course design.',
        page: '/dashboard'
      },
      {
        id: 'case-management',
        title: 'Case Management',
        description: 'Create and manage legal cases with detailed information and evidence tracking.',
        page: '/cases',
        action: 'navigate'
      },
      {
        id: 'ai-services',
        title: 'AI Services Generation',
        description: 'Generate comprehensive legal strategies using our 6 MCP analysis modules.',
        page: '/services',
        action: 'navigate'
      },
      {
        id: 'course-designer',
        title: 'Legal Course Designer',
        description: 'Create structured legal courses with topics, areas, content, and case materials.',
        page: '/legal-course',
        action: 'navigate'
      }
    ]
  },
  {
    id: 'case-workflow',
    name: 'Case Management Workflow',
    description: 'Learn how to create cases and generate AI-powered legal strategies',
    steps: [
      {
        id: 'create-case',
        title: 'Create a New Case',
        description: 'Start by creating a new legal case with basic information.',
        page: '/cases'
      },
      {
        id: 'add-case-details',
        title: 'Add Case Details',
        description: 'Fill in case title, description, and select the appropriate case type.',
        page: '/cases'
      },
      {
        id: 'generate-strategy',
        title: 'Generate AI Strategy',
        description: 'Use our AI to analyze the case and generate comprehensive legal strategies.',
        page: '/cases'
      },
      {
        id: 'review-analysis',
        title: 'Review MCP Analysis',
        description: 'Examine the detailed analysis from our 6 specialized modules.',
        page: '/cases'
      },
      {
        id: 'export-presentation',
        title: 'Export Presentation',
        description: 'Generate and download professional PowerPoint presentations.',
        page: '/cases'
      }
    ]
  },
  {
    id: 'course-creation',
    name: 'Course Creation Tutorial',
    description: 'Learn how to create comprehensive legal courses',
    steps: [
      {
        id: 'course-intro',
        title: 'Legal Course Designer',
        description: 'Create structured legal education content with our course designer.',
        page: '/legal-course'
      },
      {
        id: 'create-topics',
        title: 'Create Course Topics',
        description: 'Start by creating main topics that will form the foundation of your course.',
        page: '/legal-course'
      },
      {
        id: 'add-areas',
        title: 'Add Topic Areas',
        description: 'Break down topics into specific areas for better organization.',
        page: '/legal-course'
      },
      {
        id: 'develop-content',
        title: 'Develop Content',
        description: 'Add detailed content, learning objectives, and assessments.',
        page: '/legal-course'
      },
      {
        id: 'add-materials',
        title: 'Add References',
        description: 'Include legal cases, materials, and supporting documentation.',
        page: '/legal-course'
      }
    ]
  },
  {
    id: 'ai-features',
    name: 'AI Features Deep Dive',
    description: 'Explore the advanced AI capabilities of the platform',
    steps: [
      {
        id: 'mcp-modules',
        title: 'MCP Analysis Modules',
        description: 'Our 6 specialized modules analyze different aspects of legal cases.',
        page: '/services'
      },
      {
        id: 'strategy-synthesis',
        title: 'AI Strategy Synthesis',
        description: 'See how AI combines multiple analyses into comprehensive strategies.',
        page: '/services'
      },
      {
        id: 'enhanced-presentations',
        title: 'Enhanced Presentations',
        description: 'Generate beautiful, AI-enhanced presentations with Gemini AI.',
        page: '/services'
      },
      {
        id: 'template-system',
        title: 'Template Management',
        description: 'Manage law firm templates and branding for consistent presentations.',
        page: '/templates'
      }
    ]
  }
];

interface DemoProviderProps {
  children: ReactNode;
}

export function DemoProvider({ children }: DemoProviderProps) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);

  const enterDemoMode = () => {
    setIsDemoMode(true);
    setDemoUser(DEMO_USER);
    localStorage.setItem('demoMode', 'true');
    localStorage.setItem('demoUser', JSON.stringify(DEMO_USER));
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setDemoUser(null);
    setCurrentTour(null);
    setCurrentStep(0);
    localStorage.removeItem('demoMode');
    localStorage.removeItem('demoUser');
  };

  const startTour = (tourId: string) => {
    setCurrentTour(tourId);
    setCurrentStep(0);
  };

  const nextStep = () => {
    const tour = DEMO_TOURS.find(t => t.id === currentTour);
    if (tour && currentStep < tour.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const endTour = () => {
    setCurrentTour(null);
    setCurrentStep(0);
  };

  const skipToStep = (stepIndex: number) => {
    const tour = DEMO_TOURS.find(t => t.id === currentTour);
    if (tour && stepIndex >= 0 && stepIndex < tour.steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  // Load demo mode from localStorage on mount
  useEffect(() => {
    const savedDemoMode = localStorage.getItem('demoMode');
    const savedDemoUser = localStorage.getItem('demoUser');
    
    if (savedDemoMode === 'true' && savedDemoUser) {
      setIsDemoMode(true);
      setDemoUser(JSON.parse(savedDemoUser));
    }
  }, []);

  const value: DemoContextType = {
    isDemoMode,
    currentTour,
    currentStep,
    demoUser,
    availableTours: DEMO_TOURS,
    
    enterDemoMode,
    exitDemoMode,
    startTour,
    nextStep,
    prevStep,
    endTour,
    skipToStep
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}

// Demo data
export const DEMO_CASES = [
  {
    id: 'demo-case-1',
    title: 'Johnson vs. TechCorp Employment Dispute',
    description: 'Wrongful termination case involving discrimination claims and non-compete agreement violations.',
    caseType: 'CIVIL_LITIGATION',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'demo-user-001'
  },
  {
    id: 'demo-case-2', 
    title: 'State vs. Anderson Criminal Defense',
    description: 'White-collar criminal defense case involving alleged financial fraud and money laundering.',
    caseType: 'CRIMINAL_DEFENSE',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'demo-user-001'
  }
];

export const DEMO_SERVICES = [
  {
    id: 'demo-service-1',
    title: 'AI-Generated Strategy for Johnson vs. TechCorp',
    caseId: 'demo-case-1',
    legalDoctrine: JSON.stringify({
      analysis: 'Employment law doctrine analysis focusing on at-will employment exceptions.',
      relevantLaws: ['Title VII', 'ADA', 'State Employment Laws'],
      confidence: 0.92
    }),
    synthesizedServices: JSON.stringify({
      executiveSummary: 'Comprehensive employment discrimination case with strong merit based on documented evidence of discriminatory practices.',
      keyStrengths: ['Clear documentation of discriminatory comments', 'Pattern of similar treatment', 'Violations of company policy'],
      recommendedApproach: 'Pursue settlement negotiations while preparing for trial'
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEMO_COURSE = {
  id: 'demo-course-1',
  title: 'Employment Law Fundamentals',
  description: 'Comprehensive course covering employment law principles, discrimination cases, and workplace regulations.',
  topics: [
    {
      id: 'topic-1',
      title: 'Introduction to Employment Law',
      description: 'Overview of employment law principles and key legislation.',
      areas: [
        {
          id: 'area-1',
          title: 'Historical Development',
          description: 'Evolution of employment law from common law to modern statutes.',
          content: {
            textContent: 'Employment law has evolved significantly from the traditional at-will employment doctrine...',
            objectives: ['Understand historical context', 'Identify key legislative milestones'],
            materials: [
              {
                id: 'mat-1',
                title: 'Employment Law Timeline',
                type: 'document',
                description: 'Historical overview document'
              }
            ],
            cases: [
              {
                id: 'case-1',
                title: 'Griggs v. Duke Power Co.',
                citation: '401 U.S. 424 (1971)',
                summary: 'Landmark case establishing disparate impact theory under Title VII.'
              }
            ]
          }
        }
      ]
    }
  ]
};