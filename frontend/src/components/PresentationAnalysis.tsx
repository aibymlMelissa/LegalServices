import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  IconButton,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AIIcon,
  Psychology as PsychologyIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Timeline as TimelineIcon,
  Lightbulb as IdeaIcon,
  Visibility as VisibilityIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

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
      id={`analysis-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

interface PresentationAnalysisProps {
  services: any;
  onAnalysisUpdate?: (analysis: any) => void;
}

interface AnalysisState {
  plan: string;
  design: string;
  critique: string;
  currentStage: 'plan' | 'design' | 'critique' | 'complete';
  revisionNumber: number;
  maxRevisions: number;
}

export function PresentationAnalysis({ services, onAnalysisUpdate }: PresentationAnalysisProps) {
  const [tabValue, setTabValue] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    plan: '',
    design: '',
    critique: '',
    currentStage: 'plan',
    revisionNumber: 0,
    maxRevisions: 2
  });

  const [userFeedback, setUserFeedback] = useState({
    planFeedback: '',
    designFeedback: '',
    critiqueFeedback: '',
    generalFeedback: ''
  });

  // Simulate the CourseDesigner multi-stage process
  const generateAnalysisStage = async (stage: string, includeUserFeedback?: string) => {
    setProcessing(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      let stageContent = '';
      
      if (stage === 'plan') {
        stageContent = `🎯 **Presentation Strategy Plan**

**Objective**: Transform legal services analysis into compelling presentation format

**Key Areas to Address**:
1. **Executive Summary Visualization**
   - Create impactful opening slide with case overview
   - Highlight key legal strengths with visual emphasis
   - Use data visualization for timeline and milestones

2. **Strategic Framework**
   - Structure presentation around 3 core arguments
   - Map evidence to visual storytelling elements
   - Design logical flow from problem to solution

3. **Audience Engagement Strategy**
   - Tailor complexity level for target audience
   - Include interactive elements and Q&A preparation
   - Prepare backup slides for detailed questions

4. **Visual Design Approach**
   - Professional legal presentation template
   - Consistent color scheme reflecting case strength
   - Balance text with compelling visuals and charts

${includeUserFeedback ? `\n🤝 **Incorporating Your Feedback**: ${includeUserFeedback.substring(0, 200)}...` : ''}`;

      } else if (stage === 'design') {
        stageContent = `📊 **Presentation Design & Content Structure**

**Slide Breakdown** (Estimated 12-15 slides):

**Opening Sequence (Slides 1-3)**:
- Title slide with case name and legal team
- Executive summary with key findings
- Agenda and presentation roadmap

**Core Analysis (Slides 4-9)**:
- Legal strengths analysis with supporting evidence
- Risk assessment and mitigation strategies  
- Strategic recommendations with implementation timeline
- Financial impact and outcome projections
- Alternative approaches and contingency planning
- Timeline visualization with key milestones

**Supporting Content (Slides 10-12)**:
- Evidence summary and documentation
- Legal precedents and supporting case law
- Next steps and action items

**Closing (Slides 13-15)**:
- Key takeaways and recommendations
- Q&A preparation slides
- Contact information and follow-up

**Design Elements**:
- Professional color palette: Deep blue, gold accents, clean whites
- Consistent typography: Headlines in bold, body text readable
- Visual hierarchy with strategic use of icons and infographics
- Charts and graphs for data visualization
- High-quality imagery related to legal/business context

${includeUserFeedback ? `\n🎨 **Design Refinements Based on Your Input**: ${includeUserFeedback.substring(0, 200)}...` : ''}`;

      } else if (stage === 'critique') {
        stageContent = `🔍 **Presentation Analysis & Recommendations**

**Strengths of Current Design**:
✅ Clear logical flow from analysis to recommendations
✅ Appropriate balance of detail and high-level overview
✅ Professional visual design suitable for legal context
✅ Strong evidence integration throughout presentation

**Areas for Enhancement**:

**Content Optimization**:
- Add more specific data points to strengthen arguments
- Include comparative analysis with similar cases
- Expand on implementation timeline details
- Consider adding client testimonials or case studies

**Visual Enhancement Opportunities**:
- Integrate more interactive elements for audience engagement
- Add animation to timeline and process flows
- Consider infographic-style evidence summaries
- Improve chart readability with color coding

**Audience Considerations**:
- Prepare simplified executive version (5-7 slides)
- Develop detailed technical appendix for subject matter experts
- Create speaker notes for consistent delivery
- Add transition guidance between sections

**Technical Improvements**:
- Optimize slide loading and presentation flow
- Ensure compatibility across presentation platforms
- Include embedded video testimonials if available
- Add clickable navigation elements

**Strategic Recommendations**:
1. **Phase 1**: Implement core content and design improvements
2. **Phase 2**: Add interactive and multimedia elements  
3. **Phase 3**: Develop audience-specific variations
4. **Phase 4**: Create supporting materials and handouts

${includeUserFeedback ? `\n📝 **Addressing Your Critique**: ${includeUserFeedback.substring(0, 200)}...` : ''}`;
      }

      setAnalysisState(prev => ({
        ...prev,
        [stage]: stageContent,
        currentStage: stage === 'plan' ? 'design' : stage === 'design' ? 'critique' : 'complete',
        revisionNumber: includeUserFeedback ? prev.revisionNumber + 1 : prev.revisionNumber
      }));

      if (onAnalysisUpdate) {
        onAnalysisUpdate({ stage, content: stageContent, feedback: includeUserFeedback });
      }

    } catch (error) {
      console.error('Error generating analysis stage:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRegenerateWithFeedback = async (stage: string) => {
    const feedback = userFeedback[`${stage}Feedback` as keyof typeof userFeedback];
    if (!feedback.trim()) {
      alert('Please provide feedback before regenerating this stage.');
      return;
    }

    await generateAnalysisStage(stage, feedback);
  };

  const continueToNextStage = async () => {
    if (analysisState.currentStage === 'plan') {
      await generateAnalysisStage('design');
    } else if (analysisState.currentStage === 'design') {
      await generateAnalysisStage('critique');
    }
  };

  const getStageProgress = () => {
    switch (analysisState.currentStage) {
      case 'plan': return 25;
      case 'design': return 50;
      case 'critique': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <PsychologyIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" color="primary">
              AI Presentation Analysis - CourseDesigner Inspired
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Multi-stage presentation enhancement using human-AI collaboration workflow.
            Stages: Plan → Design → Critique → Refine (Similar to CourseDesigner process)
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">
                Current Stage: <strong>{analysisState.currentStage.toUpperCase()}</strong>
              </Typography>
              <Typography variant="body2">
                Revision: {analysisState.revisionNumber}/{analysisState.maxRevisions}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getStageProgress()} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                startIcon={processing ? <CircularProgress size={20} /> : <AIIcon />}
                onClick={() => generateAnalysisStage('plan')}
                disabled={processing}
                sx={{ mb: 1 }}
              >
                {processing ? 'Generating...' : 'Start Analysis Process'}
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                onClick={continueToNextStage}
                disabled={processing || analysisState.currentStage === 'complete'}
              >
                Continue to Next Stage
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab 
            label="📋 Plan" 
            icon={analysisState.plan ? <Chip label="✓" size="small" color="success" /> : undefined}
          />
          <Tab 
            label="🎨 Design" 
            icon={analysisState.design ? <Chip label="✓" size="small" color="success" /> : undefined}
          />
          <Tab 
            label="🔍 Critique" 
            icon={analysisState.critique ? <Chip label="✓" size="small" color="success" /> : undefined}
          />
          <Tab label="💬 Collaboration" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom color="primary">
          📋 Presentation Strategy Plan
        </Typography>
        {analysisState.plan ? (
          <Box>
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                {analysisState.plan}
              </Typography>
            </Paper>
            <Box display="flex" gap={1}>
              <Button 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={() => generateAnalysisStage('plan')}
                disabled={processing}
              >
                Regenerate Plan
              </Button>
              <Button 
                size="small" 
                startIcon={<SaveIcon />}
                variant="outlined"
              >
                Save Plan
              </Button>
            </Box>
          </Box>
        ) : (
          <Alert severity="info">
            Click "Start Analysis Process" to generate the presentation strategy plan.
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom color="primary">
          🎨 Presentation Design & Structure
        </Typography>
        {analysisState.design ? (
          <Box>
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                {analysisState.design}
              </Typography>
            </Paper>
            <Box display="flex" gap={1}>
              <Button 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={() => generateAnalysisStage('design')}
                disabled={processing}
              >
                Regenerate Design
              </Button>
              <Button 
                size="small" 
                startIcon={<DownloadIcon />}
                variant="outlined"
              >
                Export Design
              </Button>
            </Box>
          </Box>
        ) : (
          <Alert severity="info">
            Complete the Plan stage first, then continue to Design.
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom color="primary">
          🔍 Presentation Critique & Enhancement
        </Typography>
        {analysisState.critique ? (
          <Box>
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                {analysisState.critique}
              </Typography>
            </Paper>
            <Box display="flex" gap={1}>
              <Button 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={() => generateAnalysisStage('critique')}
                disabled={processing}
              >
                Regenerate Critique
              </Button>
              <Button 
                size="small" 
                startIcon={<VisibilityIcon />}
                variant="outlined"
              >
                Preview Final
              </Button>
            </Box>
          </Box>
        ) : (
          <Alert severity="info">
            Complete Plan and Design stages first to receive critique analysis.
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h6" gutterBottom color="primary">
          💬 Human-AI Collaboration Feedback
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Provide specific feedback on each stage. AI will incorporate your insights to improve the analysis.
        </Typography>

        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Plan Stage Feedback</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Provide feedback on the presentation strategy plan..."
              value={userFeedback.planFeedback}
              onChange={(e) => setUserFeedback(prev => ({ ...prev, planFeedback: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <Button
              size="small"
              startIcon={<AIIcon />}
              onClick={() => handleRegenerateWithFeedback('plan')}
              disabled={processing}
            >
              Regenerate Plan with Feedback
            </Button>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Design Stage Feedback</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Provide feedback on the presentation design and structure..."
              value={userFeedback.designFeedback}
              onChange={(e) => setUserFeedback(prev => ({ ...prev, designFeedback: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <Button
              size="small"
              startIcon={<AIIcon />}
              onClick={() => handleRegenerateWithFeedback('design')}
              disabled={processing}
            >
              Regenerate Design with Feedback
            </Button>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Critique Stage Feedback</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Provide feedback on the presentation critique and recommendations..."
              value={userFeedback.critiqueFeedback}
              onChange={(e) => setUserFeedback(prev => ({ ...prev, critiqueFeedback: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <Button
              size="small"
              startIcon={<AIIcon />}
              onClick={() => handleRegenerateWithFeedback('critique')}
              disabled={processing}
            >
              Regenerate Critique with Feedback
            </Button>
          </AccordionDetails>
        </Accordion>
      </TabPanel>
    </Box>
  );
}

export default PresentationAnalysis;