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
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Slideshow as SlideshowIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { Case, Services } from '../types';

export default function PresentationsPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadCasesWithStrategies();
  }, [isAuthenticated, router]);

  const loadCasesWithStrategies = async () => {
    try {
      setLoading(true);
      const casesData = await apiService.getCases();
      setCases(casesData);
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

  if (!isAuthenticated || !user) {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Get all strategies with presentations
  const strategiesWithPresentations = cases
    .flatMap(case_ => 
      (case_.strategies || []).map(services => ({ 
        ...services, 
        caseTitle: case_.title,
        caseType: case_.caseType 
      }))
    )
    .filter(services => services.presentationUrl);

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
            PowerPoint Presentations
          </Typography>
          <Button color="inherit" onClick={() => router.push('/cases')}>
            Cases
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

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            PowerPoint Presentations
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Download and view your AI-generated legal services presentations.
          </Typography>
        </Box>

        {strategiesWithPresentations.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <SlideshowIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No presentations available yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate AI strategies from your cases to create PowerPoint presentations.
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/cases')}
              >
                Go to Cases
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {strategiesWithPresentations.map((services) => (
              <Grid item xs={12} md={6} lg={4} key={services.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                        {services.title}
                      </Typography>
                      <Chip
                        label={services.caseType}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Case: {services.caseTitle}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      {services.version && services.version > 1 && (
                        <Chip label={`v${services.version}`} size="small" color="primary" />
                      )}
                      {services.professionalFeedback && (
                        <Chip label="Improved" size="small" color="success" />
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Created: {new Date(services.createdAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>

                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => downloadPresentation(services.id, services.title)}
                    >
                      Download PowerPoint
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {strategiesWithPresentations.length > 0 && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              📊 {strategiesWithPresentations.length} presentation{strategiesWithPresentations.length !== 1 ? 's' : ''} available
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
}