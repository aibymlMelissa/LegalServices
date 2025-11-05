import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  AutoAwesome as AIIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { Services } from '../types';

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
      id={`feedback-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  services: Services | null;
  onRegenerate: (feedback: any, section?: string) => Promise<void>;
  regenerating?: boolean;
}

export function FeedbackDialog({ 
  open, 
  onClose, 
  services, 
  onRegenerate,
  regenerating = false
}: FeedbackDialogProps) {
  const [tabValue, setTabValue] = useState(0);
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

  const [modifiedContent, setModifiedContent] = useState({
    executiveSummary: '',
    keyStrengths: [] as string[],
    potentialWeaknesses: [] as string[],
    recommendedApproach: '',
    tacticalConsiderations: [] as string[],
    timelineAndMilestones: [] as any[],
    expectedOutcomes: [] as string[]
  });

  React.useEffect(() => {
    if (services?.synthesizedServices) {
      try {
        const synthesized = typeof services.synthesizedServices === 'string' 
          ? JSON.parse(services.synthesizedServices) 
          : services.synthesizedServices;
        
        setModifiedContent({
          executiveSummary: synthesized.executiveSummary || '',
          keyStrengths: synthesized.keyStrengths || [],
          potentialWeaknesses: synthesized.potentialWeaknesses || [],
          recommendedApproach: synthesized.recommendedApproach || '',
          tacticalConsiderations: synthesized.tacticalConsiderations || [],
          timelineAndMilestones: synthesized.timelineAndMilestones || [],
          expectedOutcomes: synthesized.expectedOutcomes || []
        });
      } catch (error) {
        console.error('Error parsing synthesized services:', error);
      }
    }
  }, [services]);

  const handleFeedbackChange = (field: string, value: string) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const handleContentChange = (field: string, value: any) => {
    setModifiedContent(prev => ({ ...prev, [field]: value }));
  };

  const handleRegenerateSection = async (section: string) => {
    const sectionFeedback = feedback[section as keyof typeof feedback];
    if (!sectionFeedback.trim()) {
      alert('Please provide feedback for this section before regenerating.');
      return;
    }

    await onRegenerate({
      section,
      feedback: sectionFeedback,
      currentContent: modifiedContent
    }, section);
  };

  const handleRegenerateAll = async () => {
    const allFeedback = Object.entries(feedback)
      .filter(([_, value]) => value.trim() !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    if (Object.keys(allFeedback).length === 0) {
      alert('Please provide feedback in at least one section before regenerating.');
      return;
    }

    await onRegenerate({
      type: 'comprehensive',
      feedback: allFeedback,
      currentContent: modifiedContent
    });
  };

  const feedbackSections = [
    {
      key: 'executiveSummary',
      title: 'Executive Summary',
      description: 'Provide feedback on the overall case assessment and strategic overview'
    },
    {
      key: 'keyStrengths',
      title: 'Key Strengths',
      description: 'Comment on the identified strengths and suggest additions or modifications'
    },
    {
      key: 'potentialWeaknesses',
      title: 'Potential Weaknesses',
      description: 'Review the weakness analysis and suggest improvements'
    },
    {
      key: 'recommendedApproach',
      title: 'Recommended Approach',
      description: 'Provide input on the strategic recommendations'
    },
    {
      key: 'tacticalConsiderations',
      title: 'Tactical Considerations',
      description: 'Comment on specific tactical and procedural recommendations'
    },
    {
      key: 'timelineAndMilestones',
      title: 'Timeline & Milestones',
      description: 'Review and suggest changes to the project timeline'
    },
    {
      key: 'expectedOutcomes',
      title: 'Expected Outcomes',
      description: 'Provide feedback on outcome predictions and alternatives'
    }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <PsychologyIcon sx={{ mr: 1, color: 'primary.main' }} />
            Human-AI Collaboration: Legal Strategy Refinement
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {regenerating && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              🤖 AI is regenerating content based on your feedback...
            </Alert>
            <LinearProgress />
          </Box>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="💬 Provide Feedback" />
            <Tab label="📝 Edit Content" />
            <Tab label="🔄 Revision History" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom color="primary">
            🎯 Collaborative Feedback System
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Provide detailed feedback on each section. The AI will use your input to regenerate improved content.
            You can regenerate individual sections or the entire analysis.
          </Typography>

          {feedbackSections.map((section) => (
            <Accordion key={section.key} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {section.title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {section.description}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder={`Provide specific feedback for ${section.title.toLowerCase()}...`}
                  value={feedback[section.key as keyof typeof feedback]}
                  onChange={(e) => handleFeedbackChange(section.key, e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AIIcon />}
                  onClick={() => handleRegenerateSection(section.key)}
                  disabled={regenerating || !feedback[section.key as keyof typeof feedback].trim()}
                >
                  Regenerate This Section
                </Button>
              </AccordionDetails>
            </Accordion>
          ))}

          <Card sx={{ mt: 3, bgcolor: 'primary.50' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                General Strategy Feedback
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Provide overall feedback on the legal strategy, including any additional considerations, alternative approaches, or general improvements..."
                value={feedback.generalFeedback}
                onChange={(e) => handleFeedbackChange('generalFeedback', e.target.value)}
                variant="outlined"
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom color="primary">
            ✏️ Direct Content Editing
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Directly edit the AI-generated content. Your changes will be incorporated into the next AI generation cycle.
          </Typography>

          <TextField
            fullWidth
            label="Executive Summary"
            multiline
            rows={4}
            value={modifiedContent.executiveSummary}
            onChange={(e) => handleContentChange('executiveSummary', e.target.value)}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Recommended Approach"
            multiline
            rows={4}
            value={modifiedContent.recommendedApproach}
            onChange={(e) => handleContentChange('recommendedApproach', e.target.value)}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Key Strengths (one per line)"
            multiline
            rows={4}
            value={modifiedContent.keyStrengths.join('\n')}
            onChange={(e) => handleContentChange('keyStrengths', e.target.value.split('\n').filter(s => s.trim()))}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label="Potential Weaknesses (one per line)"
            multiline
            rows={4}
            value={modifiedContent.potentialWeaknesses.join('\n')}
            onChange={(e) => handleContentChange('potentialWeaknesses', e.target.value.split('\n').filter(s => s.trim()))}
            sx={{ mb: 3 }}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom color="primary">
            📚 Revision History
          </Typography>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Track the evolution of your legal strategy through human-AI collaboration.
          </Typography>

          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Revision history will be implemented in the next update. This will show:
                • All previous versions of the analysis
                • Feedback provided at each stage
                • AI improvements made based on feedback
                • Ability to rollback to previous versions
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={regenerating}>
          Close
        </Button>
        <Button 
          variant="outlined"
          startIcon={<SaveIcon />}
          disabled={regenerating}
        >
          Save Changes
        </Button>
        <Button
          variant="contained"
          startIcon={<AIIcon />}
          onClick={handleRegenerateAll}
          disabled={regenerating}
          sx={{ 
            bgcolor: 'primary.main',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          {regenerating ? 'Regenerating...' : 'Regenerate Entire Analysis'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FeedbackDialog;