import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import { useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { isDemoMode, enterDemoMode, startTour } = useDemo();
  const [showDemoPanel, setShowDemoPanel] = useState(false);

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center'
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          🏛️ Legal Services Platform
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 4, color: 'text.secondary' }}>
          AI-Powered Legal Strategy & Course Creation Platform
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, maxWidth: 800, fontSize: '1.1rem', lineHeight: 1.6 }}>
          Streamline your legal practice with AI-driven case analysis, strategy generation, and comprehensive course creation. 
          Perfect for law firms, corporate legal departments, and legal educators.
        </Typography>

        {/* Feature Highlights */}
        <Grid container spacing={3} sx={{ mb: 4, maxWidth: 1000 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 1 }}>⚖️</Typography>
                <Typography variant="h6" gutterBottom>Legal Strategy</Typography>
                <Typography variant="body2" color="text.secondary">
                  Generate comprehensive legal strategies using advanced AI analysis of case law, precedents, and evidence
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 1 }}>🎓</Typography>
                <Typography variant="h6" gutterBottom>Course Creation</Typography>
                <Typography variant="body2" color="text.secondary">
                  Create professional legal and compliance courses with structured content and case studies
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Typography variant="h4" sx={{ mb: 1 }}>📊</Typography>
                <Typography variant="h6" gutterBottom>Smart Presentations</Typography>
                <Typography variant="body2" color="text.secondary">
                  Generate professional PowerPoint presentations with AI-enhanced visuals and content
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Key Benefits */}
        <Box sx={{ mb: 4, maxWidth: 700 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Why Choose Our Platform?
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                ✓ AI-powered legal analysis with modules
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                ✓ Automated case strategy generation
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                ✓ Professional presentation templates
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                ✓ Comprehensive course design tools
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                ✓ Evidence and precedent analysis
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                ✓ Export to PowerPoint and other formats
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {isDemoMode && (
          <Alert severity="info" sx={{ mb: 3, maxWidth: 700 }}>
            <Typography variant="body2">
              🎭 This is a prototype! Actual access needs sufficient authentication   
            </Typography>
          </Alert>
        )}

        {isAuthenticated || isDemoMode ? (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Welcome, legal professionals!
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/dashboard')}
              sx={{ mr: 2 }}
            >
              Go to Dashboard
            </Button>
            {isDemoMode && (
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => setShowDemoPanel(!showDemoPanel)}
              >
                🎭 A Quick Demo Tour
              </Button>
            )}
          </Box>
        ) : (
          <Box>
            {/* Demo Section */}
            <Alert severity="success" sx={{ mb: 3, maxWidth: 700 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                🎭 <strong>Ready to Experience the Platform?</strong>
              </Typography>
              <Typography variant="body2">
                Try our interactive demo to explore all features including case analysis, strategy generation, 
                and course creation - no registration required!
              </Typography>
            </Alert>
            
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => {
                enterDemoMode();
                setTimeout(() => {
                  router.push('/dashboard');
                  startTour('platform-overview');
                }, 500);
              }}
              sx={{ mr: 2, mb: 2, px: 4, py: 1.5 }}
            >
              🎭 Try Interactive Demo
            </Button>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Already have an account? Sign in to access your cases and strategies.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/login')}
                sx={{ mr: 2, px: 3 }}
              >
                Sign In
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.push('/register')}
                sx={{ px: 3 }}
              >
                Create Account
              </Button>
            </Box>
          </Box>
        )}

        {/* Demo Tour Selection Panel */}
        <Dialog 
          open={showDemoPanel} 
          onClose={() => setShowDemoPanel(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Select Demo Tour
          </DialogTitle>
          <DialogContent>
            <List>
              <ListItem 
                button 
                onClick={() => {
                  startTour('platform-overview');
                  setShowDemoPanel(false);
                }}
              >
                <ListItemIcon>
                  <PlayIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Platform Overview" 
                  secondary="Get an overview of the entire legal services platform"
                />
              </ListItem>
              <ListItem 
                button 
                onClick={() => {
                  startTour('case-workflow');
                  setShowDemoPanel(false);
                }}
              >
                <ListItemIcon>
                  <PlayIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Case Workflow" 
                  secondary="Learn how to manage cases and generate strategies"
                />
              </ListItem>
              <ListItem 
                button 
                onClick={() => {
                  startTour('ai-features');
                  setShowDemoPanel(false);
                }}
              >
                <ListItemIcon>
                  <PlayIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="AI Features" 
                  secondary="Explore AI-powered course creation and analysis tools"
                />
              </ListItem>
            </List>
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
}
