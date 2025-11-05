import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  AppBar,
  Toolbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  AutoAwesome as AIIcon,
  Psychology as PsychologyIcon,
  Slideshow as SlideshowIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import api from '../services/api';
import { PresentationAnalysis } from '../components/PresentationAnalysis';
import { DEMO_CASES } from '../data/demoData';

interface Services {
  id: string;
  title: string;
  caseTitle?: string;
  caseType?: string;
  case?: {
    title: string;
  };
  createdAt: string;
}

interface EnhancementRequest {
  presentationGoals: string;
  targetAudience: string;
  preferredStyle: 'professional' | 'creative' | 'modern' | 'academic' | 'corporate';
  colorScheme: 'vibrant' | 'muted' | 'monochrome' | 'custom';
  customColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  includeVisuals: boolean;
  emphasizePoints?: string[];
  additionalInstructions?: string;
}

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
      id={`enhance-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function EnhancePresentationPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { isDemoMode } = useDemo();
  
  const [strategies, setStrategies] = useState<Services[]>([]);
  const [selectedServices, setSelectedServices] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const [enhancementRequest, setEnhancementRequest] = useState<EnhancementRequest>({
    presentationGoals: '',
    targetAudience: '',
    preferredStyle: 'professional',
    colorScheme: 'vibrant',
    includeVisuals: true,
    emphasizePoints: [],
    additionalInstructions: ''
  });

  const [emphasizePointInput, setEmphasizePointInput] = useState('');

  useEffect(() => {
    if (!isAuthenticated && !isDemoMode) {
      router.push('/login');
      return;
    }
    
    loadStrategies();
  }, [isAuthenticated, isDemoMode, router]);

  useEffect(() => {
    // Auto-select services from URL params and populate form
    if (router.query.services && typeof router.query.services === 'string' && strategies.length > 0) {
      setSelectedServices(router.query.services);
      
      // Find the selected services and auto-populate presentation goals
      const services = strategies.find(s => s.id === router.query.services);
      if (services) {
        const caseTitle = services.caseTitle || services.case?.title || 'Case';
        setEnhancementRequest(prev => ({
          ...prev,
          presentationGoals: `Create an engaging presentation for: ${services.title} (${caseTitle})`
        }));
      }
    }
  }, [router.query.services, strategies]);

  const loadStrategies = async () => {
    try {
      if (isDemoMode) {
        // Use demo data
        const demoStrategies = DEMO_CASES.flatMap(case_ => 
          (case_.services || []).map(services => ({ 
            ...services, 
            caseTitle: case_.title,
            caseType: case_.caseType,
            case: {
              title: case_.title
            }
          }))
        );
        setStrategies(demoStrategies);
      } else {
        // Get all cases with their strategies included
        const casesResponse = await api.getCases();
        const allStrategies: Services[] = [];
        
        // Extract strategies from each case
        for (const caseItem of casesResponse) {
          if (caseItem.services && caseItem.services.length > 0) {
            const strategiesWithCase = caseItem.services.map((services: any) => ({
              ...services,
              caseTitle: caseItem.title,
              caseType: caseItem.caseType,
              case: {
                title: caseItem.title
              }
            }));
            allStrategies.push(...strategiesWithCase);
          }
        }
        
        setStrategies(allStrategies);
      }
    } catch (error) {
      console.error('Failed to load strategies:', error);
      setError('Failed to load strategies');
    } finally {
      setLoadingStrategies(false);
    }
  };

  const handleAddEmphasizePoint = () => {
    if (emphasizePointInput.trim() && !enhancementRequest.emphasizePoints?.includes(emphasizePointInput.trim())) {
      setEnhancementRequest(prev => ({
        ...prev,
        emphasizePoints: [...(prev.emphasizePoints || []), emphasizePointInput.trim()]
      }));
      setEmphasizePointInput('');
    }
  };

  const handleRemoveEmphasizePoint = (point: string) => {
    setEnhancementRequest(prev => ({
      ...prev,
      emphasizePoints: prev.emphasizePoints?.filter(p => p !== point) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedServices) {
      setError('Please select a services');
      return;
    }

    if (!enhancementRequest.presentationGoals.trim()) {
      setError('Please provide presentation goals');
      return;
    }

    if (!enhancementRequest.targetAudience.trim()) {
      setError('Please specify target audience');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.generateEnhancedPresentation(selectedServices, enhancementRequest);
      setSuccess(`Enhanced presentation generated successfully! File: ${response.filename}`);
      
      // Optionally download the file automatically
      const downloadResponse = await api.downloadEnhancedPresentation(selectedServices);
      
      const url = window.URL.createObjectURL(new Blob([downloadResponse]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', response.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Enhancement failed:', error);
      setError(error.response?.data?.error || 'Failed to enhance presentation');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (loadingStrategies) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
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
            onClick={() => router.push('/strategies')}
            sx={{ mr: 2 }}
          >
            Back to Strategies
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Enhance Presentation
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user.name}
          </Typography>
          <Button color="inherit" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🎨 AI Services Enhancement - Presentation Analysis
        </Typography>

        <Typography variant="body1" sx={{ mb: 4 }}>
          Transform your legal services presentations with CourseDesigner-inspired AI analysis and SlideGenerator integration.
        </Typography>

        {isDemoMode && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              🎭 <strong>Demo Mode</strong> - Experience the AI Services Enhancement workflow with sample data and CourseDesigner-inspired collaboration.
            </Typography>
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab 
              label="🎯 Traditional Enhancement" 
              icon={<AIIcon />}
            />
            <Tab 
              label="🧠 Presentation Analysis" 
              icon={<PsychologyIcon />}
            />
            <Tab 
              label="📊 Slide Generator" 
              icon={<SlideshowIcon />}
            />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Show selected services info */}
        {selectedServices && strategies.length > 0 && (() => {
          const services = strategies.find(s => s.id === selectedServices);
          const caseTitle = services?.caseTitle || services?.case?.title || 'Case';
          return services ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>Selected Services:</strong> {services.title} - {caseTitle}
              {services.caseType && <span> ({services.caseType})</span>}
            </Alert>
          ) : null;
        })()}

        <TabPanel value={tabValue} index={0}>
          <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Services Selection */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Select Services to Enhance</InputLabel>
                    <Select
                      value={selectedServices}
                      onChange={(e) => setSelectedServices(e.target.value)}
                      label="Select Services to Enhance"
                    >
                      {strategies.length === 0 ? (
                        <MenuItem disabled value="">
                          No strategies available - Please generate strategies from your cases first
                        </MenuItem>
                      ) : (
                        strategies.map((services) => {
                          const caseTitle = services.caseTitle || services.case?.title || 'Case';
                          const caseType = services.caseType ? ` (${services.caseType})` : '';
                          return (
                            <MenuItem key={services.id} value={services.id}>
                              {services.title} - {caseTitle}{caseType} ({new Date(services.createdAt).toLocaleDateString()})
                            </MenuItem>
                          );
                        })
                      )}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Presentation Goals */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Presentation Goals"
                    value={enhancementRequest.presentationGoals}
                    onChange={(e) => setEnhancementRequest(prev => ({ ...prev, presentationGoals: e.target.value }))}
                    multiline
                    rows={3}
                    placeholder="e.g., Persuade the jury, Inform the client, Present to partners..."
                    helperText="Describe what you want to achieve with this presentation"
                  />
                </Grid>

                {/* Target Audience */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Target Audience"
                    value={enhancementRequest.targetAudience}
                    onChange={(e) => setEnhancementRequest(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="e.g., Jury, Client, Law firm partners, Court..."
                  />
                </Grid>

                {/* Preferred Style */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Preferred Style</InputLabel>
                    <Select
                      value={enhancementRequest.preferredStyle}
                      onChange={(e) => setEnhancementRequest(prev => ({ ...prev, preferredStyle: e.target.value as any }))}
                      label="Preferred Style"
                    >
                      <MenuItem value="professional">Professional</MenuItem>
                      <MenuItem value="creative">Creative</MenuItem>
                      <MenuItem value="modern">Modern</MenuItem>
                      <MenuItem value="academic">Academic</MenuItem>
                      <MenuItem value="corporate">Corporate</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Color Scheme */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Color Scheme</InputLabel>
                    <Select
                      value={enhancementRequest.colorScheme}
                      onChange={(e) => setEnhancementRequest(prev => ({ ...prev, colorScheme: e.target.value as any }))}
                      label="Color Scheme"
                    >
                      <MenuItem value="vibrant">Vibrant</MenuItem>
                      <MenuItem value="muted">Muted</MenuItem>
                      <MenuItem value="monochrome">Monochrome</MenuItem>
                      <MenuItem value="custom">Custom</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Include Visuals */}
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={enhancementRequest.includeVisuals}
                        onChange={(e) => setEnhancementRequest(prev => ({ ...prev, includeVisuals: e.target.checked }))}
                      />
                    }
                    label="Include Visual Elements (charts, diagrams, icons)"
                  />
                </Grid>

                {/* Custom Colors */}
                {enhancementRequest.colorScheme === 'custom' && (
                  <>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Primary Color"
                        value={enhancementRequest.customColors?.primary || ''}
                        onChange={(e) => setEnhancementRequest(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, primary: e.target.value } as any
                        }))}
                        placeholder="#1F4E79"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Secondary Color"
                        value={enhancementRequest.customColors?.secondary || ''}
                        onChange={(e) => setEnhancementRequest(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, secondary: e.target.value } as any
                        }))}
                        placeholder="#7F7F7F"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Accent Color"
                        value={enhancementRequest.customColors?.accent || ''}
                        onChange={(e) => setEnhancementRequest(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, accent: e.target.value } as any
                        }))}
                        placeholder="#70AD47"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <TextField
                        fullWidth
                        label="Background Color"
                        value={enhancementRequest.customColors?.background || ''}
                        onChange={(e) => setEnhancementRequest(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, background: e.target.value } as any
                        }))}
                        placeholder="#FFFFFF"
                      />
                    </Grid>
                  </>
                )}

                {/* Emphasize Points */}
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Points to Emphasize
                    </Typography>
                    <Box display="flex" gap={1} mb={2}>
                      <TextField
                        value={emphasizePointInput}
                        onChange={(e) => setEmphasizePointInput(e.target.value)}
                        placeholder="Add a point to emphasize..."
                        size="small"
                        sx={{ flexGrow: 1 }}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddEmphasizePoint()}
                      />
                      <Button onClick={handleAddEmphasizePoint} variant="outlined">
                        Add
                      </Button>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {enhancementRequest.emphasizePoints?.map((point) => (
                        <Chip
                          key={point}
                          label={point}
                          onDelete={() => handleRemoveEmphasizePoint(point)}
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                </Grid>

                {/* Additional Instructions */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Additional Instructions"
                    value={enhancementRequest.additionalInstructions}
                    onChange={(e) => setEnhancementRequest(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                    multiline
                    rows={3}
                    placeholder="Any specific requirements or preferences for the enhanced presentation..."
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Generating Enhanced Presentation...
                      </>
                    ) : (
                      '🎨 Generate Enhanced Presentation'
                    )}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                🧠 Presentation Analysis - CourseDesigner Inspired
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Multi-stage AI presentation enhancement using human-AI collaboration workflow similar to CourseDesigner.
              </Typography>
              
              {selectedServices ? (
                <PresentationAnalysis 
                  services={strategies.find(s => s.id === selectedServices)}
                  onAnalysisUpdate={(analysis) => {
                    console.log('Analysis updated:', analysis);
                  }}
                />
              ) : (
                <Alert severity="info">
                  Please select a legal services analysis from the first tab to begin presentation analysis.
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom color="primary">
                📊 Slide Generator - SlideGenerator Integration
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
                Generate presentation slides from your legal analysis using the SlideGenerator approach.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  🚧 <strong>Coming Soon</strong> - SlideGenerator integration for automatic slide creation from legal services analysis.
                  This will include:
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                  <li>Automatic slide generation from analysis content</li>
                  <li>Professional legal presentation templates</li>
                  <li>Visual elements and charts integration</li>
                  <li>PowerPoint export functionality</li>
                </Box>
              </Alert>

              {selectedServices && (
                <Card sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Preview: Slide Generation for Selected Services
                    </Typography>
                    <Typography variant="body2">
                      Services: {strategies.find(s => s.id === selectedServices)?.title || 'Selected Analysis'}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      sx={{ mt: 2 }}
                      disabled
                    >
                      Generate Slides (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Container>
    </Box>
  );
}