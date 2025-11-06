import React from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Dashboard as DashboardIcon,
  School as CourseIcon,
  Visibility as DemoIcon,
  PlayArrow as PlayIcon,
  Security as PrivacyIcon,
  Shield as SafetyIcon,
  Assessment as MetricsIcon,
  Speed as PerformanceIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';

export default function DemoShowcase() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isDemoMode } = useDemo();

  const demoComponents = [
    {
      id: 'ai-course-creator',
      title: 'AI Course Creator',
      description: 'Create comprehensive courses with enterprise-grade parameter validation and multi-format export capabilities',
      icon: <CourseIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      route: '/ai-course-creator',
      features: [
        'Component-level demo mode toggle',
        'AI Regulatory Compliance sample course',
        'Advanced parameter validation',
        'Multi-format export (PDF, DOCX, XLSX, HTML)',
        'Real-time parameter feedback'
      ],
      demoData: 'Pre-loaded with "AI Regulatory Compliance" course including GDPR, CCPA, and safety standards'
    },
    {
      id: 'system-dashboard',
      title: 'System Dashboard',
      description: 'Enterprise monitoring with health status, performance metrics, and security analytics',
      icon: <DashboardIcon sx={{ fontSize: 48, color: 'success.main' }} />,
      route: '/dashboard',
      features: [
        'Component-level demo mode toggle',
        'Real-time system health monitoring',
        'Performance metrics visualization',
        'Security event tracking',
        'Resource utilization charts'
      ],
      demoData: 'Simulated enterprise data with 156 users, 847 courses, and comprehensive metrics'
    },
    {
      id: 'course-structure-demo',
      title: 'Course Structure Demo',
      description: 'Interactive demonstration of advanced course organization with content movement capabilities',
      icon: <AIIcon sx={{ fontSize: 48, color: 'secondary.main' }} />,
      route: '/course-demo',
      features: [
        'Topic → Area → Slide hierarchy',
        'Interactive content movement between components',
        'Rich slide content with regulations and examples',
        'AI Service Enhancement component integration',
        'Comprehensive regulatory compliance content'
      ],
      demoData: 'Complete AI Regulatory Compliance course with Privacy Regulations (8 slides) and AI Safety (2 slides)'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <DemoIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          Demo Showcase
        </Typography>
        <Typography variant="h5" color="textSecondary" sx={{ mb: 2 }}>
          Interactive demonstrations of enterprise AI course creation features
        </Typography>
        <Chip 
          label="ALL DEMOS INCLUDE COMPONENT-LEVEL DEMO MODE TOGGLES" 
          color="primary" 
          sx={{ fontSize: '1rem', py: 2, px: 3 }}
        />
      </Box>

      {/* Overview Alert */}
      <Alert severity="success" sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          <strong>🎭 New Demo Mode Feature:</strong> Component-Level Demo Toggles
        </Typography>
        <Typography variant="body2">
          Each component now includes its own demo mode button! Users can view the real interface first, 
          then click "🎭 Try Demo" to see it populated with sample data. No need to leave the page - 
          the entire component transforms instantly between real and demo modes.
        </Typography>
      </Alert>

      {/* Demo Components Grid */}
      <Grid container spacing={3}>
        {demoComponents.map((component) => (
          <Grid item xs={12} key={component.id}>
            <Card 
              sx={{ 
                height: '100%',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.3s ease',
                  boxShadow: 4
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {component.icon}
                  <Box sx={{ ml: 2, flex: 1 }}>
                    <Typography variant="h4" gutterBottom>
                      {component.title}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {component.description}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<PlayIcon />}
                    onClick={() => router.push(component.route)}
                    sx={{ 
                      minWidth: 160,
                      '&:hover': {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.2s'
                      }
                    }}
                  >
                    Try Demo
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Key Features:
                    </Typography>
                    <List dense>
                      {component.features.map((feature, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Chip 
                              label="✓" 
                              size="small" 
                              color="success" 
                              sx={{ minWidth: 24, height: 20 }}
                            />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      Demo Data:
                    </Typography>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: 'grey.50', 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      <Typography variant="body2">
                        {component.demoData}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* How It Works Section */}
      <Card sx={{ mt: 4, border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlayIcon color="primary" />
            How Component Demo Mode Works
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                  Step 1: Normal Mode
                </Typography>
                <Typography variant="body2">
                  Components load in normal mode showing the real interface with empty/loading states.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="secondary" sx={{ mb: 1 }}>
                  Step 2: Toggle Demo
                </Typography>
                <Typography variant="body2">
                  Click "🎭 Try Demo" button to instantly populate the component with rich sample data.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                  Step 3: Explore
                </Typography>
                <Typography variant="body2">
                  Interact with fully functional features using realistic enterprise data examples.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>💡 Pro Tip:</strong> Each component remembers its demo state, so you can switch between 
              different components and come back to find your demo data still there. Click "Exit Demo" to 
              return to the clean interface anytime.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Quick Access to Individual Demos:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            startIcon={<CourseIcon />}
            onClick={() => router.push('/ai-course-creator')}
          >
            Course Creator
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<DashboardIcon />}
            onClick={() => router.push('/dashboard')}
          >
            System Dashboard
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<AIIcon />}
            onClick={() => router.push('/course-demo')}
          >
            Course Structure Demo
          </Button>
        </Box>
      </Box>
    </Container>
  );
}