import React, { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Paper,
  Tabs,
  Tab,
  Slide,
  Snackbar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  MoveUp as MoveIcon,
  ContentCopy as CopyIcon,
  School as CourseIcon,
  Gavel as RegulationIcon,
  Security as PrivacyIcon,
  Shield as SafetyIcon,
  AutoAwesome as AIIcon,
  CheckCircle as CheckIcon,
  ArrowForward as ArrowIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

interface CourseSlide {
  id: string;
  title: string;
  content: string[];
  keyPoints: string[];
  regulations: string[];
  examples: string[];
}

interface CourseArea {
  id: string;
  title: string;
  description: string;
  slides: CourseSlide[];
}

interface CourseTopic {
  id: string;
  title: string;
  description: string;
  areas: CourseArea[];
  totalSlides: number;
}

interface CourseComponent {
  id: string;
  name: string;
  description: string;
  slides: CourseSlide[];
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

export default function AICourseDemo() {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedSlide, setSelectedSlide] = useState<CourseSlide | null>(null);
  const [slideDialog, setSlideDialog] = useState(false);
  const [moveDialog, setMoveDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Demo Course Data - AI Regulatory Compliance
  const demoTopics: CourseTopic[] = [
    {
      id: 'regulations-privacy',
      title: 'Regulations on Privacy',
      description: 'Comprehensive overview of privacy regulations affecting AI systems',
      totalSlides: 8,
      areas: [
        {
          id: 'gdpr-compliance',
          title: 'GDPR Compliance for AI Systems',
          description: 'Understanding GDPR requirements for AI data processing',
          slides: [
            {
              id: 'gdpr-intro',
              title: 'GDPR Fundamentals for AI',
              content: [
                'The General Data Protection Regulation (GDPR) significantly impacts AI systems that process personal data.',
                'AI systems must comply with principles of lawfulness, fairness, and transparency.',
                'Data minimization principle requires AI to use only necessary personal data.',
                'Purpose limitation ensures AI processes data only for specified, explicit purposes.'
              ],
              keyPoints: [
                'GDPR applies to all AI systems processing EU residents\' data',
                'Legal basis required for each AI processing activity',
                'Data subjects have rights regarding automated decision-making'
              ],
              regulations: ['GDPR Article 6', 'GDPR Article 22', 'GDPR Recital 71'],
              examples: [
                'AI hiring systems requiring explicit consent',
                'Recommendation engines with opt-out mechanisms',
                'Automated credit scoring with human oversight'
              ]
            },
            {
              id: 'gdpr-rights',
              title: 'Data Subject Rights in AI Systems',
              content: [
                'Right to explanation: Users can request explanations for automated decisions.',
                'Right to rectification: Incorrect data in AI training sets must be correctable.',
                'Right to erasure: "Right to be forgotten" applies to AI training data.',
                'Right to data portability: Users can request their data in machine-readable format.'
              ],
              keyPoints: [
                'Explainable AI becomes legally required in many cases',
                'Data deletion from AI models presents technical challenges',
                'Regular audits needed to ensure rights compliance'
              ],
              regulations: ['GDPR Article 15-22', 'GDPR Article 12'],
              examples: [
                'Netflix explaining why certain shows are recommended',
                'Banks explaining loan denial decisions',
                'Social media platforms allowing data export'
              ]
            },
            {
              id: 'gdpr-implementation',
              title: 'Implementing GDPR-Compliant AI',
              content: [
                'Privacy by Design: Build privacy protections into AI systems from the start.',
                'Data Protection Impact Assessments (DPIAs) required for high-risk AI processing.',
                'Regular compliance audits and documentation of AI processing activities.',
                'Staff training on GDPR requirements for AI development and deployment.'
              ],
              keyPoints: [
                'Technical and organizational measures must be implemented',
                'Regular risk assessments for AI systems',
                'Clear policies for data subject requests'
              ],
              regulations: ['GDPR Article 25', 'GDPR Article 35', 'GDPR Article 30'],
              examples: [
                'Differential privacy in AI training',
                'Federated learning to minimize data exposure',
                'Regular deletion of training data'
              ]
            }
          ]
        },
        {
          id: 'ccpa-requirements',
          title: 'California Consumer Privacy Act (CCPA)',
          description: 'CCPA requirements for AI systems processing California residents\' data',
          slides: [
            {
              id: 'ccpa-overview',
              title: 'CCPA Overview for AI Systems',
              content: [
                'CCPA provides California consumers with rights regarding their personal information.',
                'AI systems must provide clear disclosure about data collection and use.',
                'Consumers have the right to opt-out of sale of personal information.',
                'AI systems processing sensitive personal information require additional protections.'
              ],
              keyPoints: [
                'Applies to businesses with $25M+ annual revenue or processing 50,000+ consumers',
                'AI systems must support consumer rights requests',
                'Special protections for sensitive personal information'
              ],
              regulations: ['CCPA Section 1798.100', 'CCPA Section 1798.120'],
              examples: [
                'AI advertising systems with opt-out mechanisms',
                'Personalization engines with data disclosure',
                'Biometric AI systems requiring consent'
              ]
            }
          ]
        },
        {
          id: 'international-privacy',
          title: 'International Privacy Frameworks',
          description: 'Global privacy regulations affecting AI deployment',
          slides: [
            {
              id: 'international-overview',
              title: 'Global Privacy Landscape for AI',
              content: [
                'China\'s Personal Information Protection Law (PIPL) requires consent for AI processing.',
                'Brazil\'s LGPD follows GDPR-like principles for AI systems.',
                'Japan\'s APPI provides guidelines for AI and automated decision-making.',
                'Canada\'s PIPEDA requires meaningful consent for AI data processing.'
              ],
              keyPoints: [
                'Multi-jurisdictional compliance required for global AI deployment',
                'Similar principles across jurisdictions with local variations',
                'Cross-border data transfer restrictions affect AI training'
              ],
              regulations: ['PIPL Article 24', 'LGPD Article 20', 'PIPEDA Section 6.1'],
              examples: [
                'Global AI platforms with region-specific privacy controls',
                'Cross-border AI training with data localization',
                'International AI services with local privacy officers'
              ]
            }
          ]
        },
        {
          id: 'emerging-privacy',
          title: 'Emerging Privacy Technologies',
          description: 'New technologies and approaches for privacy-preserving AI',
          slides: [
            {
              id: 'privacy-tech',
              title: 'Privacy-Enhancing Technologies for AI',
              content: [
                'Differential privacy adds mathematical noise to protect individual privacy.',
                'Homomorphic encryption allows computation on encrypted data.',
                'Secure multi-party computation enables collaborative AI without data sharing.',
                'Federated learning keeps data decentralized while training global models.'
              ],
              keyPoints: [
                'Technical solutions to achieve privacy compliance',
                'Trade-offs between privacy and AI model performance',
                'Regulatory acceptance of privacy-enhancing technologies'
              ],
              regulations: ['GDPR Article 25', 'NIST Privacy Framework'],
              examples: [
                'Apple\'s differential privacy in iOS',
                'Google\'s federated learning for keyboard predictions',
                'Healthcare AI using homomorphic encryption'
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'ai-service-safety',
      title: 'AI Service Product Safety',
      description: 'Safety requirements and standards for AI service products',
      totalSlides: 2,
      areas: [
        {
          id: 'safety-standards',
          title: 'AI Safety Standards and Compliance',
          description: 'Key safety standards and regulatory requirements for AI products',
          slides: [
            {
              id: 'safety-overview',
              title: 'AI Product Safety Framework',
              content: [
                'EU AI Act establishes risk-based approach to AI safety regulation.',
                'High-risk AI systems require conformity assessments and CE marking.',
                'Quality management systems must be implemented for AI products.',
                'Post-market monitoring and incident reporting required for AI systems.'
              ],
              keyPoints: [
                'Risk assessment determines regulatory requirements',
                'Safety standards vary by AI application domain',
                'Continuous monitoring throughout AI system lifecycle'
              ],
              regulations: ['EU AI Act Article 9', 'ISO/IEC 23053', 'IEC 61508'],
              examples: [
                'Medical AI devices requiring FDA approval',
                'Autonomous vehicle safety standards',
                'AI-powered financial trading system compliance'
              ]
            },
            {
              id: 'safety-implementation',
              title: 'Implementing AI Safety Measures',
              content: [
                'Robust testing and validation procedures for AI systems.',
                'Human oversight and intervention capabilities in critical applications.',
                'Bias testing and fairness evaluation throughout development.',
                'Cybersecurity measures to protect AI systems from attacks.'
              ],
              keyPoints: [
                'Multi-layered approach to AI safety',
                'Industry-specific safety requirements',
                'Regular safety audits and updates'
              ],
              regulations: ['ISO/IEC 23894', 'NIST AI RMF', 'IEEE 2857'],
              examples: [
                'AI content moderation with human review',
                'Safety-critical AI with fail-safe mechanisms',
                'AI testing with adversarial examples'
              ]
            }
          ]
        }
      ]
    }
  ];

  // AI Service Enhancement Component
  const [aiEnhancementComponent] = useState<CourseComponent>({
    id: 'ai-enhancement',
    name: 'AI Service Enhancements',
    description: 'Advanced AI techniques and service improvements',
    slides: []
  });

  const [componentSlides, setComponentSlides] = useState<CourseSlide[]>([]);

  const handleSlideView = (slide: CourseSlide) => {
    setSelectedSlide(slide);
    setSlideDialog(true);
  };

  const handleMoveSlide = (slide: CourseSlide) => {
    setSelectedSlide(slide);
    setMoveDialog(true);
  };

  const confirmMoveSlide = () => {
    if (selectedSlide) {
      setComponentSlides(prev => [...prev, selectedSlide]);
      setSnackbar({
        open: true,
        message: `Slide "${selectedSlide.title}" moved to AI Service Enhancements component`
      });
      setMoveDialog(false);
      setSelectedSlide(null);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const startSlideshow = () => {
    setIsPlaying(true);
    setCurrentSlideIndex(0);
  };

  const stopSlideshow = () => {
    setIsPlaying(false);
  };

  const nextSlide = () => {
    const allSlides = demoTopics.flatMap(topic => 
      topic.areas.flatMap(area => area.slides)
    );
    if (currentSlideIndex < allSlides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CourseIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          AI Regulatory Compliance Course Demo
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Interactive demonstration of enterprise course structure with content movement capabilities
        </Typography>
      </Box>

      {/* Course Overview */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Course Structure:
        </Typography>
        <Typography variant="body2">
          • <strong>Topic 1:</strong> Regulations on Privacy (4 areas, 8 total slides)
          <br />
          • <strong>Topic 2:</strong> AI Service Product Safety (1 area, 2 total slides)
          <br />
          • <strong>Demo Feature:</strong> Move slides to "AI Service Enhancements" component
        </Typography>
      </Alert>

      {/* Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
          <Tab 
            label={`Regulations on Privacy (${demoTopics[0].totalSlides} slides)`} 
            icon={<PrivacyIcon />} 
          />
          <Tab 
            label={`AI Service Product Safety (${demoTopics[1].totalSlides} slides)`} 
            icon={<SafetyIcon />} 
          />
          <Tab 
            label={`AI Service Enhancements (${componentSlides.length} slides)`} 
            icon={<AIIcon />} 
          />
        </Tabs>
      </Card>

      {/* Topic 1: Regulations on Privacy */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {demoTopics[0].areas.map((area) => (
            <Grid item xs={12} key={area.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RegulationIcon color="primary" />
                    {area.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {area.description}
                  </Typography>
                  <Chip 
                    label={`${area.slides.length} slides`} 
                    color="primary" 
                    size="small" 
                    sx={{ mb: 2 }} 
                  />
                  
                  <Grid container spacing={2}>
                    {area.slides.map((slide, index) => (
                      <Grid item xs={12} md={6} lg={4} key={slide.id}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            height: '100%',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { 
                              borderColor: 'primary.main',
                              transform: 'translateY(-2px)',
                              transition: 'all 0.2s'
                            }
                          }}
                        >
                          <Typography variant="h6" gutterBottom>
                            Slide {index + 1}: {slide.title}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            {slide.content[0].substring(0, 100)}...
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Chip label={`${slide.keyPoints.length} key points`} size="small" />
                            <Chip label={`${slide.regulations.length} regulations`} size="small" color="secondary" />
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<ViewIcon />}
                              onClick={() => handleSlideView(slide)}
                              variant="outlined"
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              startIcon={<MoveIcon />}
                              onClick={() => handleMoveSlide(slide)}
                              variant="contained"
                              color="secondary"
                            >
                              Move to AI Enhancement
                            </Button>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Topic 2: AI Service Product Safety */}
      <TabPanel value={currentTab} index={1}>
        <Grid container spacing={3}>
          {demoTopics[1].areas.map((area) => (
            <Grid item xs={12} key={area.id}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SafetyIcon color="primary" />
                    {area.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {area.description}
                  </Typography>
                  <Chip 
                    label={`${area.slides.length} slides`} 
                    color="primary" 
                    size="small" 
                    sx={{ mb: 2 }} 
                  />
                  
                  <Grid container spacing={2}>
                    {area.slides.map((slide, index) => (
                      <Grid item xs={12} md={6} key={slide.id}>
                        <Paper 
                          sx={{ 
                            p: 2, 
                            height: '100%',
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { 
                              borderColor: 'primary.main',
                              transform: 'translateY(-2px)',
                              transition: 'all 0.2s'
                            }
                          }}
                        >
                          <Typography variant="h6" gutterBottom>
                            Slide {index + 1}: {slide.title}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            {slide.content[0].substring(0, 100)}...
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Chip label={`${slide.keyPoints.length} key points`} size="small" />
                            <Chip label={`${slide.regulations.length} regulations`} size="small" color="secondary" />
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              startIcon={<ViewIcon />}
                              onClick={() => handleSlideView(slide)}
                              variant="outlined"
                            >
                              View
                            </Button>
                            <Button
                              size="small"
                              startIcon={<MoveIcon />}
                              onClick={() => handleMoveSlide(slide)}
                              variant="contained"
                              color="secondary"
                            >
                              Move to AI Enhancement
                            </Button>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* AI Service Enhancements Component */}
      <TabPanel value={currentTab} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon color="primary" />
              AI Service Enhancements Component
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              This component receives slides moved from other topics for enhanced AI service development.
            </Typography>
            
            {componentSlides.length === 0 ? (
              <Alert severity="info">
                <Typography variant="body2">
                  No slides have been moved to this component yet. Use the "Move to AI Enhancement" button from other topics to add content here.
                </Typography>
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {componentSlides.map((slide, index) => (
                  <Grid item xs={12} md={6} key={`component-${slide.id}`}>
                    <Paper 
                      sx={{ 
                        p: 2, 
                        border: '2px solid',
                        borderColor: 'success.main',
                        bgcolor: 'success.50'
                      }}
                    >
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckIcon color="success" />
                        Moved Slide {index + 1}: {slide.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {slide.content[0].substring(0, 120)}...
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip label="Enhanced for AI Services" size="small" color="success" />
                        <Chip label={`${slide.keyPoints.length} key points`} size="small" />
                      </Box>
                      
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleSlideView(slide)}
                        variant="outlined"
                      >
                        View Full Content
                      </Button>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Slide Detail Dialog */}
      <Dialog 
        open={slideDialog} 
        onClose={() => setSlideDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedSlide && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RegulationIcon />
              {selectedSlide.title}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Content:</Typography>
                {selectedSlide.content.map((paragraph, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                    • {paragraph}
                  </Typography>
                ))}
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Key Points:</Typography>
                {selectedSlide.keyPoints.map((point, idx) => (
                  <Chip key={idx} label={point} sx={{ m: 0.5 }} size="small" />
                ))}
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Relevant Regulations:</Typography>
                {selectedSlide.regulations.map((reg, idx) => (
                  <Chip key={idx} label={reg} color="secondary" sx={{ m: 0.5 }} size="small" />
                ))}
              </Box>
              
              <Box>
                <Typography variant="h6" gutterBottom>Examples:</Typography>
                {selectedSlide.examples.map((example, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 1 }}>
                    {idx + 1}. {example}
                  </Typography>
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSlideDialog(false)}>Close</Button>
              <Button 
                onClick={() => {
                  handleMoveSlide(selectedSlide);
                  setSlideDialog(false);
                }}
                variant="contained"
                startIcon={<MoveIcon />}
              >
                Move to AI Enhancement
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Move Confirmation Dialog */}
      <Dialog open={moveDialog} onClose={() => setMoveDialog(false)}>
        <DialogTitle>Move Slide to AI Service Enhancements</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to move the slide <strong>"{selectedSlide?.title}"</strong> to the AI Service Enhancements component?
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              This action will copy the slide content to the AI Service Enhancements component where it can be enhanced with AI-specific improvements and modifications.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialog(false)}>Cancel</Button>
          <Button onClick={confirmMoveSlide} variant="contained" startIcon={<ArrowIcon />}>
            Move Slide
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Demo Instructions */}
      <Card sx={{ mt: 4, border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlayIcon color="primary" />
            Demo Instructions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Course Structure:</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><RegulationIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Topic 1: Regulations on Privacy" 
                    secondary="4 areas with detailed compliance content"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><SafetyIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Topic 2: AI Service Product Safety" 
                    secondary="1 area focused on safety standards"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AIIcon /></ListItemIcon>
                  <ListItemText 
                    primary="AI Service Enhancements Component" 
                    secondary="Receives moved slides for enhancement"
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Interactive Features:</Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><ViewIcon /></ListItemIcon>
                  <ListItemText 
                    primary="View Slides" 
                    secondary="Click 'View' to see full slide content"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><MoveIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Move Content" 
                    secondary="Transfer slides between components"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Track Changes" 
                    secondary="Monitor moved content in destination"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}