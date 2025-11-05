import { Box, Typography, Button, Card, CardContent, Container, AppBar, Toolbar, Alert, Chip } from '@mui/material';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import { useEffect } from 'react';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { isDemoMode, startTour, exitDemoMode } = useDemo();

  useEffect(() => {
    if (!isAuthenticated && !isDemoMode) {
      router.push('/login');
    }
  }, [isAuthenticated, isDemoMode, router]);

  if ((!isAuthenticated && !isDemoMode) || (!user && !isDemoMode)) {
    return null;
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Legal Services Platform
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {isDemoMode ? 'Demo User' : user?.name}
            {isDemoMode && <Chip label="DEMO" color="secondary" size="small" sx={{ ml: 1 }} />}
          </Typography>
          <Button color="inherit" onClick={isDemoMode ? exitDemoMode : logout}>
            {isDemoMode ? 'Exit Demo' : 'Logout'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>

        <Typography variant="body1" sx={{ mb: 4 }}>
          Welcome to your legal AI services platform. Here AI can help to design legal course for you, generate content in ppt, manage cases and generate AI-powered legal strategies.
        </Typography>

        {isDemoMode && (
          <Alert severity="info" sx={{ mb: 4 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              🎭 <strong>Demo Mode Active!</strong>
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              You can explore the platform with demo data. All features are fully functional!
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => startTour('platform-overview')}
                sx={{ mr: 1 }}
              >
                🎯 Start Platform Tour
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => startTour('case-workflow')}
                sx={{ mr: 1 }}
              >
                ⚖️ Case Workflow Tour
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={() => startTour('ai-features')}
              >
                🤖 AI Features Tour
              </Button>
            </Box>
          </Alert>
        )}

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                📁 Case Management
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Create and manage your legal cases. Track case details, evidence, and progress.
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/cases')}
              >
                Manage Cases
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                ⚖️ MCP Search (not yet installed)
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                View detailed search from our 6 Model Content Protocol modules.
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/cases')}
              >
                Reference
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
          🤖 AI Services for Ligitation (not yet installed)
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Generate comprehensive legal strategies in your cases using our AI-powered MCP analysis.
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/services')}
              >
                Generate Strategies
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                📊 System Configuration
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enterprise monitoring with health status, performance metrics, and security analytics. Includes component-level demo mode.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push('/system-dashboard')}
              >
                Manage System Status
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                🎨 Presentation Templates
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Manage your law firm's PowerPoint templates and branding. Upload custom templates and logos.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => router.push('/templates')}
              >
                Manage Templates
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                🎨 AI Services Presentation
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Generate graphics and highlight content with related color, use creative presentations with Gemini AI to better deliver the message.
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => router.push('/services')}
              >
                View & Enhance Communications
              </Button>
            </CardContent>
          </Card>



          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                🎓 Legal Course Designer
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Create and manage comprehensive legal courses with structured topics, areas, content, and case materials.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => router.push('/legal-course')}
              >
                Design Courses
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                🤖 Course Content Creator
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                From output of course designer, through AI with your selected materials. Let AI create the structured course content, result pass on to service presentation to generate ppt
              </Typography>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => router.push('/ai-course-creator')}
              >
                Create with AI
              </Button>
            </CardContent>
          </Card>

          
        </Box>

        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              🚀 Quick Start
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              New to the platform? Here's how to get started:
            </Typography>
            <Box component="ol" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2">
                Create your first case with case details and type
              </Typography>
              <Typography component="li" variant="body2">
                Upload or input evidence and client information
              </Typography>
              <Typography component="li" variant="body2">
                Generate AI services analysis using our MCP modules
              </Typography>
              <Typography component="li" variant="body2">
                Export your services as a PowerPoint presentation
              </Typography>
              <Typography component="li" variant="body2">
                Design first legal course with AI to generate structured topics and comprehensive contentIn  the 
              </Typography>
            </Box>
            <Button
              variant="outlined"
              sx={{ mt: 2, mr: 2 }}
              onClick={() => router.push('/cases/new')}
            >
              Create Your Case
            </Button>
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => router.push('/legal-course')}
            >
              Create Your Course
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
