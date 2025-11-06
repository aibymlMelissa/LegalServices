import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  SkipNext as NextIcon,
  SkipPrevious as PrevIcon,
  Close as CloseIcon,
  School as SchoolIcon,
  Gavel as GavelIcon,
  AutoAwesome as AIIcon,
  Description as DocsIcon
} from '@mui/icons-material';
import { useDemo } from '../hooks/useDemo';
import { useRouter } from 'next/router';

const getTourIcon = (tourId: string) => {
  switch (tourId) {
    case 'platform-overview':
      return <DocsIcon />;
    case 'case-workflow':
      return <GavelIcon />;
    case 'course-creation':
      return <SchoolIcon />;
    case 'ai-features':
      return <AIIcon />;
    default:
      return <PlayIcon />;
  }
};

export function DemoTour() {
  const {
    isDemoMode,
    currentTour,
    currentStep,
    availableTours,
    startTour,
    nextStep,
    prevStep,
    endTour,
    skipToStep
  } = useDemo();
  
  const router = useRouter();

  if (!isDemoMode) return null;

  const currentTourData = availableTours.find(t => t.id === currentTour);

  // Tour selection panel - compact bottom-right
  if (!currentTour) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1300,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 4,
          p: 2,
          maxWidth: 350,
          border: 2,
          borderColor: 'secondary.main'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            🎭 Select Demo Tour
          </Typography>
          <IconButton onClick={endTour} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Choose a guided tour:
        </Typography>
        
        <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
          {availableTours.map((tour) => (
            <ListItem 
              key={tour.id} 
              button 
              onClick={() => startTour(tour.id)}
              sx={{ 
                border: 1, 
                borderColor: 'grey.300', 
                mb: 1, 
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'primary.50'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {getTourIcon(tour.id)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {tour.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="textSecondary">
                    {tour.steps.length} steps
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
        
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button onClick={endTour} size="small" variant="outlined">
            Skip Tours & Continue
          </Button>
        </Box>
      </Box>
    );
  }

  // Active tour dialog
  if (currentTourData) {
    const currentStepData = currentTourData.steps[currentStep];
    const progress = ((currentStep + 1) / currentTourData.steps.length) * 100;

    // Navigate to step page if needed
    if (currentStepData.page && currentStepData.action === 'navigate') {
      setTimeout(() => {
        router.push(currentStepData.page!);
      }, 1000);
    }

    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1300,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
          p: 2,
          maxWidth: 400,
          border: 2,
          borderColor: 'primary.main'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Box display="flex" alignItems="center">
            {getTourIcon(currentTour)}
            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold' }}>
              {currentTourData.name}
            </Typography>
          </Box>
          <IconButton onClick={endTour} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Box mb={1}>
          <LinearProgress variant="determinate" value={progress} size="small" />
          <Typography variant="caption" color="textSecondary">
            Step {currentStep + 1} of {currentTourData.steps.length}
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {currentStepData.title}
        </Typography>
        
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          {currentStepData.description}
        </Typography>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button 
            onClick={prevStep} 
            disabled={currentStep === 0}
            size="small"
            startIcon={<PrevIcon />}
          >
            Prev
          </Button>
          
          <Button onClick={endTour} color="secondary" size="small">
            Skip
          </Button>
          
          <Button 
            onClick={nextStep}
            variant="contained"
            size="small"
            endIcon={currentStep === currentTourData.steps.length - 1 ? <CloseIcon /> : <NextIcon />}
          >
            {currentStep === currentTourData.steps.length - 1 ? 'Done' : 'Next'}
          </Button>
        </Box>
      </Box>
    );
  }

  return null;
}

export default DemoTour;