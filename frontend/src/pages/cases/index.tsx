import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  AppBar,
  Toolbar,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useDemo } from '../../hooks/useDemo';
import apiService from '../../services/api';
import { Case, CaseType } from '../../types';
import { DEMO_CASES } from '../../data/demoData';

const caseTypeLabels = {
  CRIMINAL_DEFENSE: 'Criminal Defense',
  CRIMINAL_PROSECUTION: 'Criminal Prosecution', 
  CIVIL_LITIGATION: 'Civil Litigation',
  FAMILY_LAW: 'Family Law',
  CORPORATE_LAW: 'Corporate Law',
  OTHER: 'Other'
};

const statusColors = {
  DRAFT: 'default' as const,
  ACTIVE: 'primary' as const,
  COMPLETED: 'success' as const,
  ARCHIVED: 'secondary' as const
};

export default function CasesPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { isDemoMode } = useDemo();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newCase, setNewCase] = useState({
    title: '',
    description: '',
    caseType: CaseType.CRIMINAL_DEFENSE
  });
  const [submitting, setSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && !isDemoMode) {
      router.push('/login');
      return;
    }
    loadCases();
  }, [isAuthenticated, isDemoMode, router]);

  useEffect(() => {
    if (isDemoMode) {
      loadCases();
    }
  }, [showDemo]);

  const loadCases = async () => {
    try {
      setLoading(true);
      if (isDemoMode && showDemo) {
        // Use demo data
        setCases(DEMO_CASES as Case[]);
      } else if (isDemoMode && !showDemo) {
        // Show empty state when demo is hidden
        setCases([]);
      } else {
        const casesData = await apiService.getCases();
        setCases(casesData);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load cases');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async () => {
    try {
      setSubmitting(true);
      await apiService.createCase(newCase);
      setOpenDialog(false);
      setNewCase({ title: '', description: '', caseType: CaseType.CRIMINAL_DEFENSE });
      await loadCases();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (confirm('Are you sure you want to delete this case?')) {
      try {
        await apiService.deleteCase(caseId);
        await loadCases();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete case');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if ((!isAuthenticated && !isDemoMode) || (!user && !isDemoMode)) {
    return null;
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Legal Services Platform - Case Management
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            My Cases
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {isDemoMode && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => setShowDemo(!showDemo)}
              >
                {showDemo ? 'Hide Demo' : 'Show Demo'}
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              New Case
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {isDemoMode && showDemo && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              🎭 <strong>Demo Case Management</strong>
            </Typography>
            <Typography variant="body2">
              You're viewing {DEMO_CASES.length} pre-loaded demo cases. Click on any case to see detailed AI analysis and legal services!
            </Typography>
          </Alert>
        )}

        {loading ? (
          <Typography>Loading cases...</Typography>
        ) : cases.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No cases yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create your first case to get started with AI-powered legal services generation.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Create Your First Case
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {cases.map((case_) => (
              <Grid item xs={12} md={6} lg={4} key={case_.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Chip 
                        label={caseTypeLabels[case_.caseType as keyof typeof caseTypeLabels]} 
                        size="small" 
                        variant="outlined"
                      />
                      <Chip 
                        label={case_.status} 
                        size="small" 
                        color={statusColors[case_.status as keyof typeof statusColors]}
                      />
                    </Box>
                    
                    <Typography variant="h6" component="h2" gutterBottom>
                      {case_.title}
                    </Typography>
                    
                    {case_.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {case_.description.length > 100 
                          ? `${case_.description.substring(0, 100)}...` 
                          : case_.description
                        }
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Created: {formatDate(case_.createdAt)}
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        📊 {case_.services?.length || 0} services
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📋 {case_.evidence?.length || 0} evidence items
                      </Typography>
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => router.push(`/cases/${case_.id}`)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteCase(case_.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create Case Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Case Title"
              fullWidth
              variant="outlined"
              value={newCase.title}
              onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newCase.description}
              onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label="Case Type"
              fullWidth
              select
              variant="outlined"
              value={newCase.caseType}
              onChange={(e) => setNewCase({ ...newCase, caseType: e.target.value as CaseType })}
            >
              {Object.entries(caseTypeLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateCase} 
              variant="contained"
              disabled={!newCase.title.trim() || submitting}
            >
              {submitting ? 'Creating...' : 'Create Case'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}