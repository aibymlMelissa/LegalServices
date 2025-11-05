import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  AppBar,
  Toolbar,
  Button,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Feedback as FeedbackIcon,
  AutoAwesome as AutoAwesomeIcon,
  VisibilityOff as HideIcon,
  Visibility as ShowIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import apiService from '../services/api';
import { DEMO_CASES } from '../data/demoData';
import { Case, Services } from '../types';

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

export default function StrategiesPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { isDemoMode } = useDemo();
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedServices, setSelectedServices] = useState<Services | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [showDemo, setShowDemo] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && !isDemoMode) {
      router.push('/login');
      return;
    }
    loadCasesWithStrategies();
  }, [isAuthenticated, isDemoMode, router]);

  useEffect(() => {
    if (isDemoMode) {
      loadCasesWithStrategies();
    }
  }, [showDemo]);

  const loadCasesWithStrategies = async () => {
    try {
      setLoading(true);
      
      if (isDemoMode && showDemo) {
        // Use demo data
        setCases(DEMO_CASES as Case[]);
        // Auto-select the first services if available
        const firstServicesCase = DEMO_CASES.find(c => c.services && c.services.length > 0);
        if (firstServicesCase && firstServicesCase.services && firstServicesCase.services.length > 0) {
          setSelectedServices(firstServicesCase.services[0]);
        }
      } else if (isDemoMode && !showDemo) {
        // Hide demo data - show empty state
        setCases([]);
        setSelectedServices(null);
      } else {
        // Fetch real data
        const casesData = await apiService.getCases();
        setCases(casesData);
        
        // Auto-select the first services if available
        const firstServicesCase = casesData.find(c => c.services && c.services.length > 0);
        if (firstServicesCase && firstServicesCase.services.length > 0) {
          setSelectedServices(firstServicesCase.services[0]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const downloadPresentation = async (servicesId: string, servicesTitle: string) => {
    try {
      const blob = await apiService.downloadPresentation(servicesId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${servicesTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pptx`;
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
        // Refresh the data
        await loadCasesWithStrategies();
        // Clear selection if the deleted services was selected
        if (selectedServices?.id === servicesId) {
          setSelectedServices(null);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete services');
      }
    }
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
        </Grid>
      </Box>
    );
  };

  // Get all strategies from all cases
  const allStrategies = cases.flatMap(case_ => 
    (case_.services || []).map(services => ({ 
      ...services, 
      caseTitle: case_.title,
      caseType: case_.caseType 
    }))
  );

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

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/dashboard')}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI Strategies
          </Typography>
          {isDemoMode && (
            <Button 
              color="inherit" 
              onClick={() => setShowDemo(!showDemo)}
              startIcon={showDemo ? <HideIcon /> : <ShowIcon />}
              sx={{ mr: 1 }}
            >
              {showDemo ? 'Hide Demo' : 'Show Demo'}
            </Button>
          )}
          <Button color="inherit" onClick={() => router.push('/cases')}>
            Cases
          </Button>
          <Button color="inherit" onClick={() => router.push('/enhance-presentation')}>
            Enhance
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

        {allStrategies.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <AutoAwesomeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No AI strategies generated yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Go to your cases and generate your first AI-powered legal services.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon />}
                onClick={() => router.push('/cases')}
              >
                Go to Cases
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>Strategies</Typography>
              {allStrategies.map((services) => (
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
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Case: {services.caseTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {new Date(services.createdAt).toLocaleDateString()}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip label={services.caseType} size="small" variant="outlined" />
                      {services.version && services.version > 1 && (
                        <Chip label={`v${services.version}`} size="small" color="primary" />
                      )}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      {services.presentationUrl && (
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPresentation(services.id, services.title);
                          }}
                        >
                          Download PPT
                        </Button>
                      )}
                      <Button
                        size="small"
                        color="secondary"
                        variant="contained"
                        startIcon={<AutoAwesomeIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/enhance-presentation?services=${services.id}`);
                        }}
                        sx={{ bgcolor: 'purple.500', '&:hover': { bgcolor: 'purple.600' } }}
                      >
                        Enhance PPT
                      </Button>
                      <Button
                        size="small"
                        color="primary"
                        variant="outlined"
                        startIcon={<FeedbackIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to case detail page with feedback dialog
                          router.push(`/cases/${services.caseId}?feedback=${services.id}`);
                        }}
                      >
                        Provide Feedback
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
                <Box>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                      <Tab label="Services Details" />
                      <Tab label="MCP Analysis" />
                    </Tabs>
                  </Box>

                  <TabPanel value={tabValue} index={0}>
                    {renderSynthesizedServices(selectedServices)}
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    <Typography variant="h6" gutterBottom>MCP Module Analysis</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Detailed analysis from our 6 Model Content Protocol modules.
                    </Typography>
                    {/* MCP analysis content would go here */}
                  </TabPanel>
                </Box>
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
      </Container>
    </Box>
  );
}