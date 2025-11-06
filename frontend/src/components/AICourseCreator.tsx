import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Container,
  Button,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  Chip,
  Paper,
  LinearProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  School as SchoolIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  Description as DocumentIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Visibility as PreviewIcon,
  VisibilityOff as HideIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface CourseParameters {
  course_title: string;
  target_audience: string;
  teaching_style: string;
  teaching_objective: string;
  compulsory_areas: string[];
  duration?: string;
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  learning_outcomes?: string[];
  assessment_methods?: string[];
  materials_required?: string[];
  technology_requirements?: string[];
  metadata?: {
    created_at: string;
    updated_at: string;
    version: string;
    author: string;
  };
}

interface CourseTopic {
  title: string;
  description: string;
  learning_objectives: string[];
  content_outline: string;
  key_concepts: string[];
  practical_applications: string[];
  assessment_suggestions: string[];
  estimated_duration: string;
}

interface GeneratedCourse {
  title: string;
  description: string;
  teaching_goal: string;
  teaching_method: string;
  topics: CourseTopic[];
  references: string[];
  generated_metadata: {
    generation_time: string;
    ai_model: string;
    material_sources: string[];
  };
}

interface ProcessedMaterial {
  id: string;
  filename: string;
  title: string;
  content: string;
  metadata: {
    size: number;
    type: string;
    wordCount: number;
  };
}

interface GenerationProgress {
  step: string;
  progress: number;
  message: string;
  data?: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} style={{ paddingTop: '16px' }}>
      {value === index && children}
    </div>
  );
}

export default function AICourseCreator() {
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [currentTab, setCurrentTab] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Course parameters
  const [parameters, setParameters] = useState<CourseParameters>({
    course_title: '',
    target_audience: 'Graduate students',
    teaching_style: 'Interactive and engaging',
    teaching_objective: '',
    compulsory_areas: [],
    duration: '',
    difficulty_level: 'intermediate',
    prerequisites: [],
    learning_outcomes: [],
    assessment_methods: [],
    materials_required: [],
    technology_requirements: []
  });
  
  // Parameter validation state
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions?: string[];
  } | null>(null);
  const [savedParameterFiles, setSavedParameterFiles] = useState<string[]>([]);
  
  // Generation state
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  
  // Materials state
  const [uploadedMaterials, setUploadedMaterials] = useState<ProcessedMaterial[]>([]);
  const [recommendedMaterials, setRecommendedMaterials] = useState<ProcessedMaterial[]>([]);
  const [searchResults, setSearchResults] = useState<ProcessedMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // UI state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [previewDialog, setPreviewDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [newArea, setNewArea] = useState('');
  
  // Component-level demo mode
  const [isComponentDemoMode, setIsComponentDemoMode] = useState(false);
  const [showDemoContent, setShowDemoContent] = useState(true);
  
  // Demo data for AI Regulatory Compliance course
  const demoParameters: CourseParameters = {
    course_title: 'AI Regulatory Compliance',
    target_audience: 'Legal professionals and compliance officers',
    teaching_style: 'Case study based with practical examples',
    teaching_objective: 'To equip legal professionals with comprehensive understanding of AI regulatory frameworks including GDPR, CCPA, and emerging safety standards, enabling effective compliance strategies for AI-powered systems.',
    compulsory_areas: [
      'GDPR compliance for AI systems',
      'Data subject rights in automated processing',
      'AI safety standards and frameworks',
      'Cross-border data transfer regulations',
      'Emerging privacy-enhancing technologies'
    ],
    duration: '6 weeks intensive program',
    difficulty_level: 'advanced',
    prerequisites: [
      'Basic understanding of data protection law',
      'Familiarity with AI/ML concepts',
      'Legal background preferred'
    ],
    learning_outcomes: [
      'Assess AI systems for regulatory compliance',
      'Implement GDPR-compliant AI processes',
      'Design privacy-by-design AI architectures',
      'Navigate international privacy frameworks'
    ],
    assessment_methods: [
      'Case study analysis',
      'Compliance framework design',
      'Regulatory impact assessments'
    ],
    materials_required: [
      'Access to legal databases',
      'Regulatory compliance software',
      'Case study materials'
    ],
    technology_requirements: [
      'Computer with internet access',
      'Document management system',
      'Video conferencing capability'
    ]
  };

  const demoGeneratedCourse: GeneratedCourse = {
    title: 'AI Regulatory Compliance',
    description: 'Comprehensive course covering AI regulatory frameworks, privacy laws, and compliance strategies for legal professionals.',
    teaching_goal: 'Enable legal professionals to navigate complex AI regulatory landscape with confidence and practical expertise.',
    teaching_method: 'Interactive case studies, regulatory analysis, and hands-on compliance framework development.',
    topics: [
      {
        title: 'GDPR Fundamentals for AI Systems',
        description: 'Understanding how GDPR applies to AI systems and automated decision-making processes.',
        learning_objectives: [
          'Identify when GDPR applies to AI processing',
          'Understand data subject rights in AI contexts',
          'Implement privacy-by-design principles'
        ],
        content_outline: 'Introduction to GDPR principles, AI-specific requirements, data subject rights, lawful basis for processing, and practical implementation strategies.',
        key_concepts: ['Data minimization', 'Purpose limitation', 'Automated decision-making', 'Right to explanation'],
        practical_applications: [
          'AI hiring system compliance assessment',
          'Recommendation engine privacy controls',
          'Automated credit scoring oversight'
        ],
        assessment_suggestions: [
          'GDPR compliance audit of AI system',
          'Data subject rights implementation plan',
          'Privacy impact assessment design'
        ],
        estimated_duration: '2 weeks'
      },
      {
        title: 'AI Safety Standards and Frameworks',
        description: 'Comprehensive overview of emerging AI safety regulations and international standards.',
        learning_objectives: [
          'Navigate EU AI Act requirements',
          'Implement safety management systems',
          'Conduct AI risk assessments'
        ],
        content_outline: 'EU AI Act overview, risk-based regulatory approach, safety standards, conformity assessments, and post-market monitoring requirements.',
        key_concepts: ['Risk-based approach', 'High-risk AI systems', 'Conformity assessment', 'CE marking'],
        practical_applications: [
          'Medical AI device regulatory pathway',
          'Autonomous vehicle safety compliance',
          'Financial AI risk management'
        ],
        assessment_suggestions: [
          'AI risk assessment framework',
          'Safety management system design',
          'Regulatory compliance roadmap'
        ],
        estimated_duration: '2 weeks'
      }
    ],
    references: [
      'EU General Data Protection Regulation (GDPR)',
      'California Consumer Privacy Act (CCPA)',
      'EU Artificial Intelligence Act',
      'ISO/IEC 23053:2022 - Framework for AI systems using ML',
      'NIST AI Risk Management Framework'
    ],
    generated_metadata: {
      generation_time: new Date().toISOString(),
      ai_model: 'GPT-4',
      material_sources: ['Legal databases', 'Regulatory frameworks', 'Industry best practices']
    }
  };

  const toggleComponentDemo = () => {
    setIsComponentDemoMode(!isComponentDemoMode);
    
    if (!isComponentDemoMode) {
      // Entering demo mode - populate with demo data
      setParameters(demoParameters);
      setGeneratedCourse(demoGeneratedCourse);
      setActiveStep(3); // Show the generated course
      setSnackbar({
        open: true,
        message: '🎭 Demo mode activated! Showing AI Regulatory Compliance course example.',
        severity: 'success'
      });
    } else {
      // Exiting demo mode - reset to clean state
      setParameters({
        course_title: '',
        target_audience: 'Graduate students',
        teaching_style: 'Interactive and engaging',
        teaching_objective: '',
        compulsory_areas: [],
        duration: '',
        difficulty_level: 'intermediate',
        prerequisites: [],
        learning_outcomes: [],
        assessment_methods: [],
        materials_required: [],
        technology_requirements: []
      });
      setGeneratedCourse(null);
      setActiveStep(0);
      setSnackbar({
        open: true,
        message: '✨ Demo mode deactivated. Ready for your course creation.',
        severity: 'success'
      });
    }
  };

  // Handle hide/show demo content
  useEffect(() => {
    if (isComponentDemoMode) {
      if (showDemoContent) {
        // Show demo data
        setParameters(demoParameters);
        setGeneratedCourse(demoGeneratedCourse);
        setActiveStep(3);
      } else {
        // Hide demo data - reset to clean state
        setParameters({
          course_title: '',
          target_audience: 'Graduate students',
          teaching_style: 'Interactive and engaging',
          teaching_objective: '',
          compulsory_areas: [],
          duration: '',
          difficulty_level: 'intermediate',
          prerequisites: [],
          learning_outcomes: [],
          assessment_methods: [],
          materials_required: [],
          technology_requirements: []
        });
        setGeneratedCourse(null);
        setActiveStep(0);
      }
    }
  }, [showDemoContent, isComponentDemoMode]);

  const steps = [
    'Define Course Parameters',
    'Upload Teaching Materials',
    'Generate Course with AI',
    'Review and Refine',
    'Export Course'
  ];

  // File upload with dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/courses/materials/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      setUploadedMaterials(prev => [...prev, ...result.materials]);
      setSnackbar({
        open: true,
        message: `Successfully uploaded ${result.materials.length} materials`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Upload error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload materials',
        severity: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/html': ['.html', '.htm'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt']
    },
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  // Generate course with AI
  const handleGenerateCourse = async () => {
    if (!parameters.course_title || !parameters.teaching_objective) {
      setSnackbar({
        open: true,
        message: 'Please provide course title and teaching objective',
        severity: 'error'
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ step: 'starting', progress: 0, message: 'Initializing AI course generation...' });

    try {
      const response = await fetch('/api/courses/generate-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          parameters,
          useStream: true
        }),
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'complete') {
                  setGenerationProgress({ step: 'completed', progress: 100, message: 'Course generation completed!' });
                  break;
                } else if (data.type === 'error') {
                  throw new Error(data.message);
                } else {
                  setGenerationProgress(data);
                  
                  if (data.data?.course) {
                    setGeneratedCourse(data.data.course);
                  }
                }
              } catch (e) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate course',
        severity: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Search materials
  const handleSearchMaterials = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(`/api/courses/materials/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      setSearchResults(result.materials);
    } catch (error) {
      console.error('Search error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to search materials',
        severity: 'error'
      });
    }
  };

  // Get recommended materials
  const getRecommendedMaterials = async () => {
    if (!parameters.course_title) return;

    try {
      const response = await fetch('/api/courses/materials/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: parameters.course_title,
          target_audience: parameters.target_audience,
          compulsory_areas: parameters.compulsory_areas
        }),
      });

      if (!response.ok) {
        throw new Error('Recommendation failed');
      }

      const result = await response.json();
      setRecommendedMaterials(result.materials);
    } catch (error) {
      console.error('Recommendation error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to get material recommendations',
        severity: 'error'
      });
    }
  };

  // Validate parameters
  const validateParameters = async () => {
    try {
      const response = await fetch('/api/courses/parameters/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(parameters),
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const result = await response.json();
      setValidationResult(result);
      
      if (!result.isValid) {
        setSnackbar({
          open: true,
          message: `Parameter validation failed: ${result.errors.join(', ')}`,
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to validate parameters',
        severity: 'error'
      });
    }
  };

  // Save parameters
  const saveParameters = async () => {
    try {
      const response = await fetch('/api/courses/parameters/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(parameters),
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      const result = await response.json();
      setSnackbar({
        open: true,
        message: `Parameters saved as: ${result.filename}`,
        severity: 'success'
      });
      
      // Refresh parameter files list
      loadParameterFiles();
    } catch (error) {
      console.error('Save error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save parameters',
        severity: 'error'
      });
    }
  };

  // Load parameter files list
  const loadParameterFiles = async () => {
    try {
      const response = await fetch('/api/courses/parameters/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load parameter files');
      }

      const result = await response.json();
      setSavedParameterFiles(result.files);
    } catch (error) {
      console.error('Load files error:', error);
    }
  };

  // Load parameters from file
  const loadParametersFromFile = async (filename: string) => {
    try {
      const response = await fetch(`/api/courses/parameters/load/${filename}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load parameters');
      }

      const result = await response.json();
      setParameters(result.parameters);
      setSnackbar({
        open: true,
        message: `Parameters loaded from: ${filename}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Load parameters error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load parameters',
        severity: 'error'
      });
    }
  };

  // Add compulsory area
  const handleAddCompulsoryArea = () => {
    if (newArea.trim() && !parameters.compulsory_areas.includes(newArea.trim())) {
      setParameters(prev => ({
        ...prev,
        compulsory_areas: [...prev.compulsory_areas, newArea.trim()]
      }));
      setNewArea('');
    }
  };

  // Remove compulsory area
  const handleRemoveCompulsoryArea = (area: string) => {
    setParameters(prev => ({
      ...prev,
      compulsory_areas: prev.compulsory_areas.filter(a => a !== area)
    }));
  };

  // Add array item helper
  const addArrayItem = (field: keyof CourseParameters, value: string) => {
    if (value.trim() && Array.isArray(parameters[field])) {
      const currentArray = parameters[field] as string[];
      if (!currentArray.includes(value.trim())) {
        setParameters(prev => ({
          ...prev,
          [field]: [...currentArray, value.trim()]
        }));
      }
    }
  };

  // Remove array item helper
  const removeArrayItem = (field: keyof CourseParameters, value: string) => {
    if (Array.isArray(parameters[field])) {
      const currentArray = parameters[field] as string[];
      setParameters(prev => ({
        ...prev,
        [field]: currentArray.filter(item => item !== value)
      }));
    }
  };

  // Export course with advanced options
  const exportCourse = async (format: 'csv' | 'xlsx' | 'html' | 'json' | 'docx' | 'pdf') => {
    if (!generatedCourse) return;

    try {
      const response = await fetch('/api/courses/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          courseData: generatedCourse,
          format,
          options: {
            includeMetadata: true,
            customStyling: format === 'html' || format === 'docx',
            detailedContent: true
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${generatedCourse.title}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSnackbar({
        open: true,
        message: `Course exported as ${format.toUpperCase()}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export course',
        severity: 'error'
      });
    }
  };

  // Auto-validate parameters when they change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (parameters.course_title || parameters.teaching_objective) {
        validateParameters();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [parameters]);

  // Auto-generate recommendations when parameters change
  useEffect(() => {
    const timer = setTimeout(() => {
      getRecommendedMaterials();
    }, 1000);

    return () => clearTimeout(timer);
  }, [parameters.course_title, parameters.target_audience, parameters.compulsory_areas]);

  // Load parameter files on component mount
  useEffect(() => {
    loadParameterFiles();
  }, []);

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ textAlign: 'center', flex: 1 }}>
            <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <AIIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              AI Course Creator
              {isComponentDemoMode && showDemoContent && (
                <Chip 
                  label="DEMO MODE" 
                  color="secondary" 
                  size="small" 
                  sx={{ ml: 2, animation: 'pulse 2s infinite' }} 
                />
              )}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {isComponentDemoMode 
                ? '🎭 Demonstration: AI Regulatory Compliance course example'
                : 'Generate comprehensive courses using AI with your teaching materials'
              }
            </Typography>
          </Box>
          <Button
            variant={isComponentDemoMode ? "contained" : "outlined"}
            color={isComponentDemoMode ? "secondary" : "primary"}
            onClick={toggleComponentDemo}
            startIcon={isComponentDemoMode ? <StopIcon /> : <PlayIcon />}
            size="large"
            sx={{ 
              minWidth: 160,
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s'
              }
            }}
          >
            {isComponentDemoMode ? 'Exit Demo' : '🎭 Try Demo'}
          </Button>
          {isComponentDemoMode && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowDemoContent(!showDemoContent)}
              startIcon={showDemoContent ? <HideIcon /> : <PreviewIcon />}
              sx={{ ml: 2 }}
            >
              {showDemoContent ? 'Hide Demo' : 'Show Demo'}
            </Button>
          )}
        </Box>
        
        {isComponentDemoMode && showDemoContent && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Demo Mode Active:</strong> You're viewing a pre-generated "AI Regulatory Compliance" course with complete data. 
              Click through the steps to explore enterprise course creation features, or click "Exit Demo" to create your own course.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Progress Stepper */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="horizontal" sx={{ mb: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {/* Generation Progress */}
          {generationProgress && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {generationProgress.message}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={generationProgress.progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Step Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Define Course Parameters
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Provide the fundamental details for your course. The AI will use these parameters to generate tailored content.
                  </Typography>

                  {/* Parameter validation display */}
                  {validationResult && (
                    <Alert 
                      severity={validationResult.isValid ? 'success' : 'error'} 
                      sx={{ mb: 3 }}
                    >
                      <Typography variant="subtitle2">
                        Parameter Validation: {validationResult.isValid ? 'Valid' : 'Issues Found'}
                      </Typography>
                      {validationResult.errors.length > 0 && (
                        <List dense>
                          {validationResult.errors.map((error, idx) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemText primary={`• ${error}`} />
                            </ListItem>
                          ))}
                        </List>
                      )}
                      {validationResult.warnings.length > 0 && (
                        <List dense>
                          {validationResult.warnings.map((warning, idx) => (
                            <ListItem key={idx} sx={{ py: 0 }}>
                              <ListItemText primary={`⚠️ ${warning}`} />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Alert>
                  )}

                  {/* Saved parameter files */}
                  {savedParameterFiles.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Load Saved Parameters
                      </Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel>Select Parameter File</InputLabel>
                        <Select
                          label="Select Parameter File"
                          onChange={(e) => loadParametersFromFile(e.target.value)}
                        >
                          {savedParameterFiles.map((file) => (
                            <MenuItem key={file} value={file}>
                              {file}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Course Title"
                        value={parameters.course_title}
                        onChange={(e) => setParameters(prev => ({ ...prev, course_title: e.target.value }))}
                        placeholder="e.g., Business Innovation and Sustainability"
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Target Audience</InputLabel>
                        <Select
                          value={parameters.target_audience}
                          label="Target Audience"
                          onChange={(e) => setParameters(prev => ({ ...prev, target_audience: e.target.value }))}
                        >
                          <MenuItem value="Graduate students">Graduate students</MenuItem>
                          <MenuItem value="Undergraduate students">Undergraduate students</MenuItem>
                          <MenuItem value="Working professionals">Working professionals</MenuItem>
                          <MenuItem value="Executive education">Executive education</MenuItem>
                          <MenuItem value="General public">General public</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Teaching Style</InputLabel>
                        <Select
                          value={parameters.teaching_style}
                          label="Teaching Style"
                          onChange={(e) => setParameters(prev => ({ ...prev, teaching_style: e.target.value }))}
                        >
                          <MenuItem value="Interactive and engaging">Interactive and engaging</MenuItem>
                          <MenuItem value="Formal and structured">Formal and structured</MenuItem>
                          <MenuItem value="Case study based">Case study based</MenuItem>
                          <MenuItem value="Discussion focused">Discussion focused</MenuItem>
                          <MenuItem value="Hands-on practical">Hands-on practical</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Teaching Objective"
                        multiline
                        rows={3}
                        value={parameters.teaching_objective}
                        onChange={(e) => setParameters(prev => ({ ...prev, teaching_objective: e.target.value }))}
                        placeholder="e.g., To develop skills in sustainable business management and prepare students for leadership roles in the 21st century"
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Compulsory Knowledge Areas
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                        <TextField
                          size="small"
                          label="Add Knowledge Area"
                          value={newArea}
                          onChange={(e) => setNewArea(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddCompulsoryArea();
                            }
                          }}
                        />
                        <IconButton onClick={handleAddCompulsoryArea} color="primary">
                          <AddIcon />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {parameters.compulsory_areas.map((area) => (
                          <Chip
                            key={area}
                            label={area}
                            onDelete={() => handleRemoveCompulsoryArea(area)}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Grid>

                    {/* Advanced Parameters Section */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Advanced Course Settings
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Duration"
                        value={parameters.duration || ''}
                        onChange={(e) => setParameters(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g., 8 weeks, 3 months"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Difficulty Level</InputLabel>
                        <Select
                          value={parameters.difficulty_level || 'intermediate'}
                          label="Difficulty Level"
                          onChange={(e) => setParameters(prev => ({ ...prev, difficulty_level: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                        >
                          <MenuItem value="beginner">Beginner</MenuItem>
                          <MenuItem value="intermediate">Intermediate</MenuItem>
                          <MenuItem value="advanced">Advanced</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Prerequisites */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Prerequisites
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        {(parameters.prerequisites || []).map((prereq) => (
                          <Chip
                            key={prereq}
                            label={prereq}
                            onDelete={() => removeArrayItem('prerequisites', prereq)}
                            color="secondary"
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Grid>

                    {/* Learning Outcomes */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Learning Outcomes
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                        {(parameters.learning_outcomes || []).map((outcome) => (
                          <Chip
                            key={outcome}
                            label={outcome}
                            onDelete={() => removeArrayItem('learning_outcomes', outcome)}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                      variant="outlined"
                      onClick={saveParameters}
                      disabled={!parameters.course_title}
                    >
                      Save Parameters
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!parameters.course_title || !parameters.teaching_objective || (validationResult && !validationResult.isValid)}
                    >
                      Next: Upload Materials
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Upload Teaching Materials
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Upload relevant documents to enhance the AI course generation. Supported formats: PDF, DOCX, TXT, HTML, PPTX.
                  </Typography>
                  
                  <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                    <Tab label="File Upload" icon={<CloudUploadIcon />} />
                    <Tab label="Material Search" icon={<SearchIcon />} />
                    <Tab label="Recommendations" icon={<AIIcon />} />
                  </Tabs>
                  
                  <TabPanel value={currentTab} index={0}>
                    <Paper
                      {...getRootProps()}
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: isDragActive ? 'primary.main' : 'grey.300',
                        bgcolor: isDragActive ? 'primary.50' : 'grey.50',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <input {...getInputProps()} />
                      <CloudUploadIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                      {isUploading ? (
                        <>
                          <CircularProgress size={24} sx={{ mb: 2 }} />
                          <Typography variant="h6">Processing files...</Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="h6" gutterBottom>
                            {isDragActive ? 'Drop the files here' : 'Drag & drop teaching materials'}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            or click to select files
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                            Max 10 files, 50MB each
                          </Typography>
                        </>
                      )}
                    </Paper>
                    
                    {uploadedMaterials.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Uploaded Materials ({uploadedMaterials.length})
                        </Typography>
                        <List>
                          {uploadedMaterials.map((material) => (
                            <ListItem key={material.id}>
                              <ListItemIcon>
                                <DocumentIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary={material.title}
                                secondary={`${material.filename} • ${material.metadata.wordCount} words • ${material.metadata.type}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </TabPanel>
                  
                  <TabPanel value={currentTab} index={1}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                      <TextField
                        fullWidth
                        label="Search materials"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSearchMaterials();
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={handleSearchMaterials}
                      >
                        Search
                      </Button>
                    </Box>
                    
                    {searchResults.length > 0 && (
                      <List>
                        {searchResults.map((material) => (
                          <ListItem key={material.id}>
                            <ListItemIcon>
                              <DocumentIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={material.title}
                              secondary={`${material.metadata.wordCount} words • ${material.metadata.type}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </TabPanel>
                  
                  <TabPanel value={currentTab} index={2}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      AI-recommended materials based on your course parameters:
                    </Typography>
                    
                    {recommendedMaterials.length > 0 ? (
                      <List>
                        {recommendedMaterials.map((material) => (
                          <ListItem key={material.id}>
                            <ListItemIcon>
                              <AIIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={material.title}
                              secondary={`${material.metadata.wordCount} words • ${material.metadata.type} • Recommended for: ${parameters.course_title}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                        <Typography variant="body2" color="textSecondary">
                          No recommendations available. Upload materials or adjust course parameters.
                        </Typography>
                      </Paper>
                    )}
                  </TabPanel>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack}>
                      Back
                    </Button>
                    <Button variant="contained" onClick={handleNext}>
                      Next: Generate Course
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Generate Course with AI
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Click the button below to start AI-powered course generation based on your parameters and materials.
                  </Typography>
                  
                  <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
                    <Typography variant="h6" gutterBottom>
                      Course Preview
                    </Typography>
                    <Typography><strong>Title:</strong> {parameters.course_title}</Typography>
                    <Typography><strong>Target Audience:</strong> {parameters.target_audience}</Typography>
                    <Typography><strong>Teaching Style:</strong> {parameters.teaching_style}</Typography>
                    <Typography><strong>Materials:</strong> {uploadedMaterials.length} uploaded, {recommendedMaterials.length} recommended</Typography>
                  </Paper>
                  
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={isGenerating ? <StopIcon /> : <PlayIcon />}
                      onClick={handleGenerateCourse}
                      disabled={isGenerating}
                      color={isGenerating ? "error" : "primary"}
                    >
                      {isGenerating ? 'Stop Generation' : 'Generate Course with AI'}
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack}>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!generatedCourse}
                    >
                      Next: Review Course
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 3 && generatedCourse && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Review and Refine
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Review the AI-generated course content and make any necessary adjustments.
                  </Typography>
                  
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2">
                      Course generated successfully! {generatedCourse.topics.length} topics created.
                    </Typography>
                  </Alert>
                  
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{generatedCourse.title}</Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>{generatedCourse.description}</Typography>
                      <Typography><strong>Teaching Goal:</strong> {generatedCourse.teaching_goal}</Typography>
                      <Typography><strong>Teaching Method:</strong> {generatedCourse.teaching_method}</Typography>
                    </CardContent>
                  </Card>
                  
                  {generatedCourse.topics.map((topic, index) => (
                    <Accordion key={index} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">
                          Topic {index + 1}: {topic.title}
                        </Typography>
                        <Chip
                          label={topic.estimated_duration}
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {topic.description}
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Learning Objectives:
                        </Typography>
                        <List dense>
                          {topic.learning_objectives.map((objective, idx) => (
                            <ListItem key={idx} sx={{ py: 0.5 }}>
                              <ListItemText primary={`• ${objective}`} />
                            </ListItem>
                          ))}
                        </List>
                        
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Key Concepts:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {topic.key_concepts.map((concept, idx) => (
                            <Chip key={idx} label={concept} size="small" variant="outlined" />
                          ))}
                        </Box>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Assessment Suggestions:
                        </Typography>
                        <List dense>
                          {topic.assessment_suggestions.map((assessment, idx) => (
                            <ListItem key={idx} sx={{ py: 0.5 }}>
                              <ListItemText primary={`• ${assessment}`} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack}>
                      Back
                    </Button>
                    <Box>
                      <Button
                        startIcon={<PreviewIcon />}
                        onClick={() => setPreviewDialog(true)}
                        sx={{ mr: 2 }}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                      >
                        Next: Export
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}

              {activeStep === 4 && generatedCourse && (
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Export Course
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                    Your AI-generated course is ready! Export it in your preferred format.
                  </Typography>
                  
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2">
                      Course "{generatedCourse.title}" has been successfully generated and saved.
                    </Typography>
                  </Alert>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Card sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h6">PDF Export</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Professional PDF document
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          fullWidth
                          onClick={() => exportCourse('pdf')}
                        >
                          Download PDF
                        </Button>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h6">Word Document</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Editable DOCX format
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          fullWidth
                          onClick={() => exportCourse('docx')}
                        >
                          Download DOCX
                        </Button>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h6">Excel Spreadsheet</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Structured data format
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          fullWidth
                          onClick={() => exportCourse('xlsx')}
                        >
                          Download XLSX
                        </Button>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Card sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h6">HTML Export</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Interactive web format
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          fullWidth
                          onClick={() => exportCourse('html')}
                        >
                          Download HTML
                        </Button>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h6">CSV Export</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Data analysis format
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          fullWidth
                          onClick={() => exportCourse('csv')}
                        >
                          Download CSV
                        </Button>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Card sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h6">JSON Data</Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          Raw course data
                        </Typography>
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          fullWidth
                          onClick={() => exportCourse('json')}
                        >
                          Download JSON
                        </Button>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Course Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {generatedCourse.topics.length}
                        </Typography>
                        <Typography variant="body2">Topics</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {generatedCourse.references.length}
                        </Typography>
                        <Typography variant="body2">References</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {uploadedMaterials.length}
                        </Typography>
                        <Typography variant="body2">Materials Used</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4" color="primary">
                          {generatedCourse.generated_metadata.ai_model}
                        </Typography>
                        <Typography variant="body2">AI Model</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack}>
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setSnackbar({
                          open: true,
                          message: 'Course creation completed successfully!',
                          severity: 'success'
                        });
                        // Could navigate to course dashboard
                      }}
                    >
                      Finish
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI Assistant
              </Typography>
              
              {!isGenerating && generationProgress && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {generationProgress.message}
                  </Typography>
                </Alert>
              )}
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                The AI will analyze your course parameters and materials to generate:
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Structured course outline" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Learning objectives" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Key concepts & topics" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Assessment suggestions" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon color="primary" /></ListItemIcon>
                  <ListItemText primary="Practical applications" />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Progress Summary
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
              </Typography>
              
              {uploadedMaterials.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  📚 {uploadedMaterials.length} materials uploaded
                </Typography>
              )}
              
              {generatedCourse && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  ✅ Course generated with {generatedCourse.topics.length} topics
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}