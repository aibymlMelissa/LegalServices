import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Container,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  TextField,
  Divider,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  Psychology as PsychologyIcon,
  Gavel as GavelIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AutoAwesomeIcon,
  Delete as DeleteIcon,
  Feedback as FeedbackIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useDemo } from '../../hooks/useDemo';
import apiService from '../../services/api';
import { Case, Services } from '../../types';
import { DEMO_CASES } from '../../data/demoData';
import { FeedbackDialog } from '../../components/FeedbackDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CaseDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, user, logout } = useAuth();
  const { isDemoMode } = useDemo();
  const [case_, setCase] = useState<Case | null>(null);
  const [strategies, setStrategies] = useState<Services[]>([]);
  const [selectedServices, setSelectedServices] = useState<Services | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [feedback, setFeedback] = useState({
    executiveSummary: '',
    keyStrengths: '',
    potentialWeaknesses: '',
    recommendedApproach: '',
    tacticalConsiderations: '',
    timelineAndMilestones: '',
    riskAssessment: '',
    expectedOutcomes: '',
    alternativeStrategies: '',
    generalFeedback: ''
  });

  // Demo preset feedback for the contract dispute case
  const demoFeedback = {
    executiveSummary: 'The executive summary should emphasize the strong documentary evidence (original contract, email communications) and quantify the financial impact more precisely. Consider adding a timeline of key events leading to the breach.',
    keyStrengths: 'Add that we have a complete email trail showing the defendant acknowledged service deficiencies. The $95,000 already paid demonstrates good faith on client\'s part. Include the independent expert witness testimony as a major strength.',
    potentialWeaknesses: 'The analysis should address the defendant\'s likely argument about change orders and scope creep. Consider the risk that partial payment might be seen as acceptance of substandard work. Add mitigation strategies for these concerns.',
    recommendedApproach: 'Recommend a two-pronged approach: 1) Immediate demand letter with detailed breach documentation, 2) Parallel preparation for mediation. The services should emphasize settlement leverage rather than jumping straight to litigation.',
    tacticalConsiderations: 'Include specific discovery requests for defendant\'s internal communications and quality control records. Consider early expert depositions to lock in favorable testimony. Add provisions for protective orders if trade secrets are involved.',
    timelineAndMilestones: 'The timeline is too compressed. Allow 45-60 days for meaningful settlement negotiations before filing suit. Add specific milestones for expert witness retention and report completion. Include case management conference planning.',
    riskAssessment: 'Add assessment of defendant\'s financial capacity to pay judgment. Consider the risk of counterclaims for alleged scope changes. Include evaluation of insurance coverage and collection prospects.',
    expectedOutcomes: 'Be more realistic about settlement range: likely 60-80% of claimed damages rather than full recovery. Add consideration of attorney fee recovery provisions in the contract. Include timeline expectations for different resolution paths.',
    alternativeStrategies: 'Consider structured settlement with ongoing performance requirements rather than lump sum. Explore licensing or ongoing service arrangements as part of resolution. Add evaluation of relationship preservation options.',
    generalFeedback: 'Overall, the services needs more focus on practical business considerations alongside legal merits. The client is likely interested in maintaining industry relationships and avoiding prolonged litigation costs. Consider adding alternative dispute resolution mechanisms and emphasizing the strong documentary evidence. The services should also address potential PR implications in this industry niche.'
  };

  useEffect(() => {
    if (!isAuthenticated && !isDemoMode) {
      router.push('/login');
      return;
    }
    if (id) {
      loadCase();
      loadTemplates();
    }
  }, [isAuthenticated, isDemoMode, router, id]);

  const loadCase = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode) {
        // Find demo case by ID
        const demoCase = DEMO_CASES.find(c => c.id === id);
        if (demoCase) {
          setCase(demoCase as Case);
          setStrategies(demoCase.services || []);
        } else {
          setError('Demo case not found');
        }
      } else {
        const caseData = await apiService.getCase(id as string);
        setCase(caseData);
        setStrategies(caseData.services || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      if (isDemoMode) {
        // Use demo templates
        setTemplates([
          { id: 'demo-template-1', name: 'Professional Law Firm Template', isDefault: true },
          { id: 'demo-template-2', name: 'Modern Corporate Template', isDefault: false }
        ]);
      } else {
        const response = await apiService.get('/templates');
        setTemplates(response.data.templates || []);
      }
    } catch (err: any) {
      console.error('Failed to load templates:', err);
    }
  };

  const generateServices = async (templateId?: string) => {
    try {
      setGenerating(true);
      setError(null);
      
      const servicesData: any = {
        caseId: id as string,
        title: `AI Services for ${case_?.title}`
      };
      
      if (templateId) {
        servicesData.templateId = templateId;
      }
      
      const response = await apiService.generateServices(servicesData);
      
      setSelectedServices(response.services);
      await loadCase(); // Reload to get updated strategies
      setTabValue(1); // Switch to services tab
      setTemplateDialogOpen(false); // Close template dialog
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate services');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateWithTemplate = () => {
    if (templates.length > 0) {
      setTemplateDialogOpen(true);
    } else {
      generateServices(); // Generate without template if none available
    }
  };

  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplateId(templateId);
    generateServices(templateId);
  };

  const downloadPresentation = async (servicesId: string) => {
    try {
      const blob = await apiService.downloadPresentation(servicesId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `services-${servicesId}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to download presentation');
    }
  };

  const deleteServices = async (servicesId: string) => {
    if (confirm('Are you sure you want to delete this services? This action cannot be undone.')) {
      try {
        await apiService.deleteServices(servicesId);
        // Remove from local state
        setStrategies(prev => prev.filter(s => s.id !== servicesId));
        // If this was the selected services, clear selection
        if (selectedServices?.id === servicesId) {
          setSelectedServices(null);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete services');
      }
    }
  };

  const openFeedbackDialog = (services: Services) => {
    setSelectedServices(services);
    setFeedback({
      executiveSummary: '',
      keyStrengths: '',
      potentialWeaknesses: '',
      recommendedApproach: '',
      tacticalConsiderations: '',
      timelineAndMilestones: '',
      riskAssessment: '',
      expectedOutcomes: '',
      alternativeStrategies: '',
      generalFeedback: ''
    });
    setFeedbackDialogOpen(true);
  };

  const regenerateWithFeedback = async () => {
    if (!selectedServices) return;
    
    try {
      setRegenerating(true);
      setError(null);
      
      const response = await apiService.regenerateServicesWithFeedback(
        selectedServices.id,
        feedback,
        `${selectedServices.title} (Improved v${(selectedServices.version || 1) + 1})`
      );
      
      // Add the new services to the list
      setStrategies(prev => [response.services, ...prev]);
      setSelectedServices(response.services);
      setFeedbackDialogOpen(false);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to regenerate services');
    } finally {
      setRegenerating(false);
    }
  };

  const loadDemoFeedback = () => {
    setFeedback(demoFeedback);
  };

  const handleCollaborativeRegeneration = async (feedbackData: any, section?: string) => {
    try {
      setRegenerating(true);
      setError(null);
      
      if (isDemoMode) {
        // Simulate collaborative regeneration in demo mode
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock improved content based on feedback
        const currentServices = selectedServices!;
        const synthesized = typeof currentServices.synthesizedServices === 'string' 
          ? JSON.parse(currentServices.synthesizedServices) 
          : currentServices.synthesizedServices;

        // Simulate AI improvements based on feedback
        const improvedContent = {
          ...synthesized,
          executiveSummary: section === 'executiveSummary' ? 
            `${synthesized.executiveSummary}\n\n🤖 [AI Enhancement]: Incorporating your feedback - Enhanced analysis with deeper focus on ${feedbackData.feedback.substring(0, 50)}...` :
            synthesized.executiveSummary,
          recommendedApproach: section === 'recommendedApproach' ?
            `${synthesized.recommendedApproach}\n\n🎯 [Strategic Update]: Based on your collaboration - ${feedbackData.feedback.substring(0, 50)}...` :
            synthesized.recommendedApproach,
          keyStrengths: section === 'keyStrengths' ?
            [...synthesized.keyStrengths, `🔍 Human-AI Insight: ${feedbackData.feedback.substring(0, 80)}`] :
            synthesized.keyStrengths
        };

        const updatedServices = {
          ...currentServices,
          synthesizedServices: JSON.stringify(improvedContent),
          version: (currentServices.version || 1) + 1,
          title: `${currentServices.title} (v${(currentServices.version || 1) + 1} - Collaborative)`
        };

        setSelectedServices(updatedServices);
        
        // Update the services in the strategies list
        setStrategies(prev => prev.map(s => 
          s.id === selectedServices!.id ? updatedServices : s
        ));
        
      } else {
        const response = await apiService.collaborativeRegeneration(selectedServices!.id, feedbackData);
        setSelectedServices(response.services);
        await loadCase();
      }
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to regenerate with collaboration');
    } finally {
      setRegenerating(false);
    }
  };

  const renderMCPAnalysis = (services: Services) => {
    const modules = [
      { key: 'legalDoctrine', title: 'Legal Doctrine', icon: <GavelIcon />, data: services.legalDoctrine },
      { key: 'legalProcedure', title: 'Legal Procedure', icon: <DescriptionIcon />, data: services.legalProcedure },
      { key: 'legalPrinciples', title: 'Legal Principles', icon: <TimelineIcon />, data: services.legalPrinciples },
      { key: 'admissibleEvidence', title: 'Admissible Evidence', icon: <DescriptionIcon />, data: services.admissibleEvidence },
      { key: 'casePrecedents', title: 'Case Precedents', icon: <GavelIcon />, data: services.casePrecedents },
      { key: 'clientPsychology', title: 'Client Psychology', icon: <PsychologyIcon />, data: services.clientPsychology }
    ];

    return (
      <Box>
        {modules.map((module) => (
          <Accordion key={module.key} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {module.icon}
                <Typography sx={{ ml: 1 }}>{module.title}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {module.data ? (
                <Box>
                  {Object.entries(module.data).map(([key, value]) => (
                    <Box key={key} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </Typography>
                      <Typography variant="body2" component="div">
                        {Array.isArray(value) ? (
                          <ul>
                            {value.map((item, index) => (
                              <li key={index}>{typeof item === 'object' ? JSON.stringify(item) : item}</li>
                            ))}
                          </ul>
                        ) : typeof value === 'object' ? (
                          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          value
                        )}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No data available</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  const renderSynthesizedServices = (services: Services) => {
    if (!services.synthesizedServices) {
      return <Typography color="text.secondary">No synthesized services available</Typography>;
    }

    // Parse the synthesized services if it's a string
    let synthesized;
    try {
      synthesized = typeof services.synthesizedServices === 'string' 
        ? JSON.parse(services.synthesizedServices) 
        : services.synthesizedServices;
    } catch (error) {
      synthesized = services.synthesizedServices;
    }

    return (
      <Box>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Executive Summary</Typography>
            <Typography variant="body1">{synthesized.executiveSummary}</Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  ✅ Key Strengths
                </Typography>
                <List dense>
                  {synthesized.keyStrengths?.map((strength: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemText primary={strength} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.main">
                  ⚠️ Potential Weaknesses
                </Typography>
                <List dense>
                  {synthesized.potentialWeaknesses?.map((weakness: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemText primary={weakness} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Recommended Approach</Typography>
                <Typography variant="body1" paragraph>{synthesized.recommendedApproach}</Typography>
                
                <Typography variant="h6" gutterBottom>Tactical Considerations</Typography>
                <List dense>
                  {synthesized.tacticalConsiderations?.map((tactic: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemText primary={tactic} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Timeline & Milestones</Typography>
                {synthesized.timelineAndMilestones?.map((milestone: any, index: number) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">{milestone.phase}</Typography>
                    <Typography variant="body2" color="text.secondary">Timeline: {milestone.timeline}</Typography>
                    <List dense>
                      {milestone.objectives?.map((objective: string, objIndex: number) => (
                        <ListItem key={objIndex}>
                          <ListItemText primary={objective} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Expected Outcomes</Typography>
                <List dense>
                  {synthesized.expectedOutcomes?.map((outcome: string, index: number) => (
                    <ListItem key={index}>
                      <ListItemText primary={outcome} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  if ((!isAuthenticated && !isDemoMode) || (!user && !isDemoMode)) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!case_) {
    return (
      <Container>
        <Typography variant="h5" color="error">Case not found</Typography>
      </Container>
    );
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/cases')}
            sx={{ mr: 2 }}
          >
            Back to Cases
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {case_.title}
          </Typography>
          <Button color="inherit" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {isDemoMode && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              🎭 <strong>Demo Case View</strong> - You're viewing demo case data with pre-generated AI analysis and legal services.
            </Typography>
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Case Details" />
            <Tab label="AI Strategies" />
            <Tab label="MCP Analysis" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Case Header */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={case_.caseType} variant="outlined" />
                  <Chip label={case_.status} color="primary" />
                </Box>
                <Button
                  variant="contained"
                  startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
                  onClick={handleGenerateWithTemplate}
                  disabled={generating}
                >
                  {generating ? 'Generating AI Services...' : 'Generate AI Services'}
                </Button>
              </Box>
              
              <Typography variant="h4" gutterBottom>{case_.title}</Typography>
              
              {case_.description && (
                <Typography variant="body1" paragraph>
                  {case_.description}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(case_.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last Updated: {new Date(case_.updatedAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📊 {strategies.length} strategies • 📋 {case_.evidence?.length || 0} evidence items
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Three Column Layout */}
          <Grid container spacing={3}>
            {/* Column 1: Case Details */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon color="primary" />
                    Case Details
                  </Typography>
                  
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Initial Case Filing"
                        secondary={`${new Date(case_.createdAt).toLocaleDateString()} - Case opened with preliminary review of contract terms and dispute claims`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Client Consultation"
                        secondary={`${new Date(Date.now() - 86400000).toLocaleDateString()} - Initial client meeting to discuss case objectives and services preferences`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Legal Research Phase"
                        secondary={`${new Date(Date.now() - 172800000).toLocaleDateString()} - Comprehensive research on contract law precedents and applicable regulations`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Discovery Planning"
                        secondary={`${new Date(Date.now() - 259200000).toLocaleDateString()} - Planned discovery timeline and identified key documents needed`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Motion Preparation"
                        secondary={`${new Date(Date.now() - 432000000).toLocaleDateString()} - Drafting preliminary motions and legal briefs for court submission`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Column 2: Material Evidence */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GavelIcon color="secondary" />
                    Material Evidence
                  </Typography>
                  
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Original Service Contract"
                        secondary={`${new Date(case_.createdAt).toLocaleDateString()} - Signed agreement between Smith and Johnson, 15 pages with amendments`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Email Communications"
                        secondary={`${new Date(Date.now() - 86400000).toLocaleDateString()} - 47 email exchanges regarding service delivery issues and payment disputes`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Payment Records"
                        secondary={`${new Date(Date.now() - 172800000).toLocaleDateString()} - Bank statements and invoices showing $95,000 paid of $150,000 total`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Service Delivery Reports"
                        secondary={`${new Date(Date.now() - 259200000).toLocaleDateString()} - Quality assessment reports and client feedback documentation`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Third-Party Witness Statements"
                        secondary={`${new Date(Date.now() - 345600000).toLocaleDateString()} - Statements from project managers and technical consultants involved`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Financial Impact Analysis"
                        secondary={`${new Date(Date.now() - 432000000).toLocaleDateString()} - Economic loss assessment and projected damages calculation`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Column 3: Interview Scripts */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PsychologyIcon color="success" />
                    Interview Scripts
                  </Typography>
                  
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Client Interview - Mr. Smith"
                        secondary={`${new Date(case_.createdAt).toLocaleDateString()} - Initial 2-hour deposition covering contract expectations and breach allegations`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Defendant Deposition - Ms. Johnson"
                        secondary={`${new Date(Date.now() - 86400000).toLocaleDateString()} - 3-hour deposition addressing service delivery challenges and payment justification`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Expert Witness - Tech Consultant"
                        secondary={`${new Date(Date.now() - 172800000).toLocaleDateString()} - Technical expert testimony on industry standards and service quality assessment`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Project Manager Interview"
                        secondary={`${new Date(Date.now() - 259200000).toLocaleDateString()} - Key witness interview regarding project timeline and delivery milestones`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Financial Analyst Consultation"
                        secondary={`${new Date(Date.now() - 345600000).toLocaleDateString()} - Expert analysis on damages calculation and economic impact assessment`}
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText
                        primary="Character Witness - Business Partner"
                        secondary={`${new Date(Date.now() - 432000000).toLocaleDateString()} - Interview with long-term business associate regarding client's reputation and practices`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {strategies.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <AutoAwesomeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No AI strategies generated yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Generate your first AI-powered legal services using our comprehensive MCP analysis.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={handleGenerateWithTemplate}
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate AI Services'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>Strategies</Typography>
                {strategies.map((services) => (
                  <Card 
                    key={services.id} 
                    sx={{ 
                      mb: 2, 
                      cursor: 'pointer',
                      border: selectedServices?.id === services.id ? 2 : 1,
                      borderColor: selectedServices?.id === services.id ? 'primary.main' : 'divider'
                    }}
                    onClick={() => setSelectedServices(services)}
                  >
                    <CardContent>
                      <Typography variant="subtitle1">{services.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(services.createdAt).toLocaleDateString()}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        {services.presentationUrl && (
                          <Button
                            size="small"
                            startIcon={<DownloadIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPresentation(services.id);
                            }}
                          >
                            Download PPT
                          </Button>
                        )}
                        <Button
                          size="small"
                          color="primary"
                          variant="outlined"
                          startIcon={<FeedbackIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openFeedbackDialog(services);
                          }}
                        >
                          Provide Feedback
                        </Button>
                        <Button
                          size="small"
                          color="secondary"
                          variant="contained"
                          startIcon={<PsychologyIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedServices(services);
                            setCollaborationDialogOpen(true);
                          }}
                          sx={{ 
                            bgcolor: 'purple.600', 
                            '&:hover': { bgcolor: 'purple.700' },
                            color: 'white'
                          }}
                        >
                          AI Collaboration
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteServices(services.id);
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Grid>

              <Grid item xs={12} md={8}>
                {selectedServices ? (
                  renderSynthesizedServices(selectedServices)
                ) : (
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                      <Typography variant="h6" color="text.secondary">
                        Select a services to view details
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {selectedServices ? (
            renderMCPAnalysis(selectedServices)
          ) : strategies.length > 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary">
                  Select a services to view MCP analysis
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No MCP analysis available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Generate an AI services to see detailed analysis from our 6 Model Content Protocol modules.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AutoAwesomeIcon />}
                  onClick={handleGenerateWithTemplate}
                  disabled={generating}
                >
                  Generate AI Services
                </Button>
              </CardContent>
            </Card>
          )}
        </TabPanel>
      </Container>

      {/* Feedback Dialog */}
      <Dialog 
        open={feedbackDialogOpen} 
        onClose={() => setFeedbackDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FeedbackIcon />
              Professional Feedback & Services Improvement
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={loadDemoFeedback}
              sx={{ ml: 2 }}
            >
              Load Demo Comments
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Provide your professional feedback on each section of the AI-generated services. The AI will use your insights to create an improved version.
            <br />
            <strong>💡 Try the "Load Demo Comments" button above to see realistic professional feedback examples!</strong>
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Executive Summary Feedback"
                multiline
                rows={3}
                fullWidth
                value={feedback.executiveSummary}
                onChange={(e) => setFeedback(prev => ({ ...prev, executiveSummary: e.target.value }))}
                placeholder="Comments on the executive summary..."
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Key Strengths Feedback"
                multiline
                rows={3}
                fullWidth
                value={feedback.keyStrengths}
                onChange={(e) => setFeedback(prev => ({ ...prev, keyStrengths: e.target.value }))}
                placeholder="Comments on identified strengths..."
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Potential Weaknesses Feedback"
                multiline
                rows={3}
                fullWidth
                value={feedback.potentialWeaknesses}
                onChange={(e) => setFeedback(prev => ({ ...prev, potentialWeaknesses: e.target.value }))}
                placeholder="Comments on potential weaknesses..."
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Recommended Approach Feedback"
                multiline
                rows={3}
                fullWidth
                value={feedback.recommendedApproach}
                onChange={(e) => setFeedback(prev => ({ ...prev, recommendedApproach: e.target.value }))}
                placeholder="Comments on the recommended approach..."
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tactical Considerations Feedback"
                multiline
                rows={3}
                fullWidth
                value={feedback.tacticalConsiderations}
                onChange={(e) => setFeedback(prev => ({ ...prev, tacticalConsiderations: e.target.value }))}
                placeholder="Comments on tactical considerations..."
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Timeline & Milestones Feedback"
                multiline
                rows={3}
                fullWidth
                value={feedback.timelineAndMilestones}
                onChange={(e) => setFeedback(prev => ({ ...prev, timelineAndMilestones: e.target.value }))}
                placeholder="Comments on timeline and milestones..."
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="General Feedback & Overall Comments"
                multiline
                rows={4}
                fullWidth
                value={feedback.generalFeedback}
                onChange={(e) => setFeedback(prev => ({ ...prev, generalFeedback: e.target.value }))}
                placeholder="Overall feedback, missing elements, strategic improvements..."
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={regenerateWithFeedback}
            variant="contained"
            startIcon={regenerating ? <CircularProgress size={20} /> : <RefreshIcon />}
            disabled={regenerating || !feedback.generalFeedback.trim()}
          >
            {regenerating ? 'Regenerating Services...' : 'Regenerate Improved Services'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Select Presentation Template
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Choose a presentation template for your law firm's branding, or proceed without a template.
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedTemplateId === template.id ? 2 : 1,
                    borderColor: selectedTemplateId === template.id ? 'primary.main' : 'divider',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => setSelectedTemplateId(template.id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {template.description}
                    </Typography>
                    
                    {/* Color Preview */}
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                      {Object.entries(template.colors).slice(0, 3).map(([key, color]) => (
                        <Box
                          key={key}
                          sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: color,
                            border: '1px solid #ccc',
                            borderRadius: 0.5
                          }}
                        />
                      ))}
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      {template.fonts.title} font family
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => generateServices()}>
            Generate Without Template
          </Button>
          <Button onClick={() => setTemplateDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => handleTemplateSelection(selectedTemplateId)}
            variant="contained"
            disabled={!selectedTemplateId || generating}
            startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          >
            {generating ? 'Generating...' : 'Generate with Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Human-AI Collaborative Feedback Dialog */}
      <FeedbackDialog
        open={collaborationDialogOpen}
        onClose={() => setCollaborationDialogOpen(false)}
        services={selectedServices}
        onRegenerate={handleCollaborativeRegeneration}
        regenerating={regenerating}
      />
    </Box>
  );
}