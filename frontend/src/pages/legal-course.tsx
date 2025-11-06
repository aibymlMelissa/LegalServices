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
  Tabs,
  Tab,
  Grid,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  TextareaAutosize
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Topic as TopicIcon,
  Article as ArticleIcon,
  LibraryBooks as LibraryBooksIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  Gavel as GavelIcon,
  Assignment as AssignmentIcon,
  VisibilityOff as HideIcon,
  Visibility as ShowIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import { DEMO_COURSES } from '../data/demoData';

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
      id={`course-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface CourseData {
  id?: string;
  title: string;
  description: string;
  topics: CourseTopic[];
  createdAt?: string;
  updatedAt?: string;
}

interface CourseTopic {
  id: string;
  title: string;
  description: string;
  areas: TopicArea[];
  orderIndex: number;
}

interface TopicArea {
  id: string;
  title: string;
  description: string;
  content: AreaContent;
  orderIndex: number;
}

interface AreaContent {
  id: string;
  textContent: string;
  objectives: string[];
  materials: CourseMaterial[];
  cases: LegalCase[];
  assessments: Assessment[];
}

interface CourseMaterial {
  id: string;
  title: string;
  type: 'document' | 'video' | 'audio' | 'link' | 'image';
  url: string;
  description: string;
  metadata?: any;
}

interface LegalCase {
  id: string;
  title: string;
  citation: string;
  summary: string;
  relevantLaws: string[];
  keyPoints: string[];
  outcome: string;
  lessonLearned: string;
}

interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'essay' | 'case_study' | 'presentation' | 'practical';
  description: string;
  criteria: string[];
  weight: number;
}

export default function LegalCoursePage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const { isDemoMode } = useDemo();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    topics: []
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [saveDialog, setSaveDialog] = useState(false);
  const [loadDialog, setLoadDialog] = useState(false);
  const [savedCourses, setSavedCourses] = useState<CourseData[]>([]);

  // Current editing states
  const [currentTopic, setCurrentTopic] = useState<CourseTopic | null>(null);
  const [currentArea, setCurrentArea] = useState<TopicArea | null>(null);
  const [currentContent, setCurrentContent] = useState<AreaContent | null>(null);
  const [showDemo, setShowDemo] = useState(true);

  useEffect(() => {
    if (!isAuthenticated && !isDemoMode) {
      router.push('/login');
    }
  }, [isAuthenticated, isDemoMode, router]);

  useEffect(() => {
    loadSavedCourses();
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      loadSavedCourses();
    }
  }, [showDemo]);

  const loadSavedCourses = () => {
    try {
      if (isDemoMode && showDemo) {
        // Load demo courses
        setSavedCourses(DEMO_COURSES as any);
        // Load first demo course by default
        if (DEMO_COURSES.length > 0) {
          setCourseData(DEMO_COURSES[0] as any);
        }
      } else if (isDemoMode && !showDemo) {
        // Hide demo data - show empty state
        setSavedCourses([]);
        setCourseData({
          title: '',
          description: '',
          topics: []
        });
      } else {
        const saved = localStorage.getItem('legalCourses');
        if (saved) {
          setSavedCourses(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('Error loading saved courses:', error);
    }
  };

  const saveCourse = (courseName?: string) => {
    try {
      const courseToSave = {
        ...courseData,
        id: courseData.id || Date.now().toString(),
        updatedAt: new Date().toISOString(),
        createdAt: courseData.createdAt || new Date().toISOString()
      };

      if (courseName) {
        courseToSave.title = courseName;
      }

      const saved = localStorage.getItem('legalCourses');
      let courses: CourseData[] = saved ? JSON.parse(saved) : [];
      
      const existingIndex = courses.findIndex(c => c.id === courseToSave.id);
      if (existingIndex >= 0) {
        courses[existingIndex] = courseToSave;
      } else {
        courses.push(courseToSave);
      }

      localStorage.setItem('legalCourses', JSON.stringify(courses));
      setCourseData(courseToSave);
      setSavedCourses(courses);
      setSnackbar({ open: true, message: 'Course saved successfully!', severity: 'success' });
      setSaveDialog(false);
    } catch (error) {
      console.error('Error saving course:', error);
      setSnackbar({ open: true, message: 'Failed to save course', severity: 'error' });
    }
  };

  const loadCourse = (course: CourseData) => {
    setCourseData(course);
    setLoadDialog(false);
    setSnackbar({ open: true, message: 'Course loaded successfully!', severity: 'success' });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const addNewTopic = () => {
    const newTopic: CourseTopic = {
      id: Date.now().toString(),
      title: 'New Topic',
      description: '',
      areas: [],
      orderIndex: courseData.topics.length
    };
    setCourseData(prev => ({
      ...prev,
      topics: [...prev.topics, newTopic]
    }));
    setCurrentTopic(newTopic);
    setEditMode(true);
  };

  const addNewArea = (topicId: string) => {
    const newArea: TopicArea = {
      id: Date.now().toString(),
      title: 'New Area',
      description: '',
      content: {
        id: Date.now().toString() + '_content',
        textContent: '',
        objectives: [],
        materials: [],
        cases: [],
        assessments: []
      },
      orderIndex: 0
    };

    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.map(topic => 
        topic.id === topicId 
          ? { ...topic, areas: [...topic.areas, newArea] }
          : topic
      )
    }));
    setCurrentArea(newArea);
    setEditMode(true);
  };

  const addNewMaterial = (topicId: string, areaId: string) => {
    const newMaterial: CourseMaterial = {
      id: Date.now().toString(),
      title: 'New Material',
      type: 'document',
      url: '',
      description: ''
    };

    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.map(t => 
        t.id === topicId ? {
          ...t,
          areas: t.areas.map(a => 
            a.id === areaId ? {
              ...a,
              content: {
                ...a.content,
                materials: [...a.content.materials, newMaterial]
              }
            } : a
          )
        } : t
      )
    }));
  };

  const addNewCase = (topicId: string, areaId: string) => {
    const newCase: LegalCase = {
      id: Date.now().toString(),
      title: 'New Legal Case',
      citation: '',
      summary: '',
      relevantLaws: [],
      keyPoints: [],
      outcome: '',
      lessonLearned: ''
    };

    setCourseData(prev => ({
      ...prev,
      topics: prev.topics.map(t => 
        t.id === topicId ? {
          ...t,
          areas: t.areas.map(a => 
            a.id === areaId ? {
              ...a,
              content: {
                ...a.content,
                cases: [...a.content.cases, newCase]
              }
            } : a
          )
        } : t
      )
    }));
  };

  if ((!isAuthenticated && !isDemoMode) || (!user && !isDemoMode)) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* App Bar */}
      <AppBar position="static" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => router.push('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Legal Course Designer
            {isDemoMode && showDemo && <Chip label="DEMO" color="secondary" size="small" sx={{ ml: 1 }} />}
          </Typography>
          
          <Button
            color="inherit"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialog(true)}
            sx={{ mr: 2 }}
          >
            Save
          </Button>
          
          <Button
            color="inherit"
            startIcon={<UploadIcon />}
            onClick={() => setLoadDialog(true)}
            sx={{ mr: 2 }}
          >
            Load
          </Button>
          
          {isDemoMode && (
            <Button
              color="inherit"
              startIcon={showDemo ? <HideIcon /> : <ShowIcon />}
              onClick={() => setShowDemo(!showDemo)}
              sx={{ mr: 2 }}
            >
              {showDemo ? 'Hide Demo' : 'Show Demo'}
            </Button>
          )}
          
          <Button
            color="inherit"
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Done' : 'Edit'}
          </Button>
          
          <Button color="inherit" onClick={logout} sx={{ ml: 2 }}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Demo Mode Alert */}
        {isDemoMode && showDemo && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              🎓 <strong>Course Designer Demo</strong>
            </Typography>
            <Typography variant="body2">
              You're viewing a pre-loaded employment law course. Try editing, adding content, or creating new topics!
            </Typography>
          </Alert>
        )}

        {/* Course Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                {editMode ? (
                  <TextField
                    fullWidth
                    label="Course Title"
                    value={courseData.title}
                    onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
                    sx={{ mb: 2 }}
                  />
                ) : (
                  <Typography variant="h4" gutterBottom>
                    {courseData.title || 'Legal Course Title'}
                  </Typography>
                )}
                
                {editMode ? (
                  <TextField
                    fullWidth
                    label="Course Description"
                    multiline
                    rows={3}
                    value={courseData.description}
                    onChange={(e) => setCourseData(prev => ({ ...prev, description: e.target.value }))}
                  />
                ) : (
                  <Typography variant="body1" color="textSecondary">
                    {courseData.description || 'Course description will appear here'}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="textSecondary">
                    Topics: {courseData.topics.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Areas: {courseData.topics.reduce((sum, topic) => sum + topic.areas.length, 0)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Card>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<TopicIcon />} label="Course Topic Creation" />
            <Tab icon={<ArticleIcon />} label="Topic Area Creation" />
            <Tab icon={<DescriptionIcon />} label="Area Content Creation" />
            <Tab icon={<LibraryBooksIcon />} label="Cases and Material Reference" />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={currentTab} index={0}>
            {/* Course Topic Creation Tab */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5">Course Topic Creation</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addNewTopic}
                disabled={!editMode}
              >
                Add Topic
              </Button>
            </Box>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Create and manage course topics that form the foundation of your legal course.
            </Typography>

            <Grid container spacing={2}>
              {courseData.topics.map((topic, index) => (
                <Grid item xs={12} md={6} key={topic.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      {editMode ? (
                        <>
                          <TextField
                            fullWidth
                            label="Topic Title"
                            value={topic.title}
                            onChange={(e) => {
                              setCourseData(prev => ({
                                ...prev,
                                topics: prev.topics.map(t => 
                                  t.id === topic.id ? { ...t, title: e.target.value } : t
                                )
                              }));
                            }}
                            sx={{ mb: 2 }}
                          />
                          <TextField
                            fullWidth
                            label="Topic Description"
                            multiline
                            rows={3}
                            value={topic.description}
                            onChange={(e) => {
                              setCourseData(prev => ({
                                ...prev,
                                topics: prev.topics.map(t => 
                                  t.id === topic.id ? { ...t, description: e.target.value } : t
                                )
                              }));
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <Typography variant="h6" gutterBottom>
                            {topic.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                            {topic.description}
                          </Typography>
                        </>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Chip label={`${topic.areas.length} areas`} size="small" />
                        {editMode && (
                          <Box>
                            <IconButton 
                              size="small" 
                              onClick={() => addNewArea(topic.id)}
                              color="primary"
                            >
                              <AddIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                setCourseData(prev => ({
                                  ...prev,
                                  topics: prev.topics.filter(t => t.id !== topic.id)
                                }));
                              }}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              {courseData.topics.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <TopicIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No topics created yet
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Start by creating your first course topic
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addNewTopic}
                      disabled={!editMode}
                    >
                      Create First Topic
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            {/* Topic Area Creation Tab */}
            <Typography variant="h5" gutterBottom>
              Topic Area Creation
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Define specific areas within each topic to organize your course content effectively.
            </Typography>

            {courseData.topics.map((topic) => (
              <Accordion key={topic.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">{topic.title}</Typography>
                  <Chip label={`${topic.areas.length} areas`} size="small" sx={{ ml: 2 }} />
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {topic.areas.map((area) => (
                      <Grid item xs={12} md={6} key={area.id}>
                        <Card>
                          <CardContent>
                            {editMode ? (
                              <>
                                <TextField
                                  fullWidth
                                  label="Area Title"
                                  value={area.title}
                                  onChange={(e) => {
                                    setCourseData(prev => ({
                                      ...prev,
                                      topics: prev.topics.map(t => 
                                        t.id === topic.id ? {
                                          ...t,
                                          areas: t.areas.map(a => 
                                            a.id === area.id ? { ...a, title: e.target.value } : a
                                          )
                                        } : t
                                      )
                                    }));
                                  }}
                                  sx={{ mb: 2 }}
                                />
                                <TextField
                                  fullWidth
                                  label="Area Description"
                                  multiline
                                  rows={2}
                                  value={area.description}
                                  onChange={(e) => {
                                    setCourseData(prev => ({
                                      ...prev,
                                      topics: prev.topics.map(t => 
                                        t.id === topic.id ? {
                                          ...t,
                                          areas: t.areas.map(a => 
                                            a.id === area.id ? { ...a, description: e.target.value } : a
                                          )
                                        } : t
                                      )
                                    }));
                                  }}
                                />
                              </>
                            ) : (
                              <>
                                <Typography variant="h6" gutterBottom>
                                  {area.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {area.description}
                                </Typography>
                              </>
                            )}
                            
                            {editMode && (
                              <Box sx={{ mt: 2, textAlign: 'right' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setCourseData(prev => ({
                                      ...prev,
                                      topics: prev.topics.map(t => 
                                        t.id === topic.id ? {
                                          ...t,
                                          areas: t.areas.filter(a => a.id !== area.id)
                                        } : t
                                      )
                                    }));
                                  }}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                    
                    {editMode && (
                      <Grid item xs={12}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => addNewArea(topic.id)}
                        >
                          Add New Area
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}

            {courseData.topics.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <ArticleIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No topics available
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Create topics first in the "Course Topic Creation" tab
                </Typography>
              </Paper>
            )}
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            {/* Area Content Creation Tab */}
            <Typography variant="h5" gutterBottom>
              Area Content Creation
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Develop detailed content for each area including objectives, materials, and assessments.
            </Typography>

            {courseData.topics.map((topic) => (
              <Accordion key={topic.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">{topic.title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {topic.areas.map((area) => (
                    <Accordion key={area.id} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">{area.title}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                              Content
                            </Typography>
                            {editMode ? (
                              <TextField
                                fullWidth
                                label="Area Content"
                                multiline
                                rows={6}
                                value={area.content.textContent}
                                onChange={(e) => {
                                  setCourseData(prev => ({
                                    ...prev,
                                    topics: prev.topics.map(t => 
                                      t.id === topic.id ? {
                                        ...t,
                                        areas: t.areas.map(a => 
                                          a.id === area.id ? {
                                            ...a,
                                            content: { ...a.content, textContent: e.target.value }
                                          } : a
                                        )
                                      } : t
                                    )
                                  }));
                                }}
                              />
                            ) : (
                              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                                  {area.content.textContent || 'No content available'}
                                </Typography>
                              </Paper>
                            )}
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                              Learning Objectives
                            </Typography>
                            <List dense>
                              {area.content.objectives.map((objective, index) => (
                                <ListItem key={index}>
                                  <ListItemText primary={`• ${objective}`} />
                                  {editMode && (
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setCourseData(prev => ({
                                          ...prev,
                                          topics: prev.topics.map(t => 
                                            t.id === topic.id ? {
                                              ...t,
                                              areas: t.areas.map(a => 
                                                a.id === area.id ? {
                                                  ...a,
                                                  content: {
                                                    ...a.content,
                                                    objectives: a.content.objectives.filter((_, i) => i !== index)
                                                  }
                                                } : a
                                              )
                                            } : t
                                          )
                                        }));
                                      }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  )}
                                </ListItem>
                              ))}
                            </List>
                            {editMode && (
                              <TextField
                                fullWidth
                                label="Add Objective"
                                size="small"
                                onKeyPress={(e: any) => {
                                  if (e.key === 'Enter' && e.target.value.trim()) {
                                    setCourseData(prev => ({
                                      ...prev,
                                      topics: prev.topics.map(t => 
                                        t.id === topic.id ? {
                                          ...t,
                                          areas: t.areas.map(a => 
                                            a.id === area.id ? {
                                              ...a,
                                              content: {
                                                ...a.content,
                                                objectives: [...a.content.objectives, e.target.value.trim()]
                                              }
                                            } : a
                                          )
                                        } : t
                                      )
                                    }));
                                    e.target.value = '';
                                  }
                                }}
                              />
                            )}
                          </Grid>
                          
                          <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>
                              Assessments
                            </Typography>
                            <List dense>
                              {area.content.assessments.map((assessment, index) => (
                                <ListItem key={assessment.id}>
                                  <ListItemText 
                                    primary={assessment.title}
                                    secondary={`${assessment.type} - Weight: ${assessment.weight}%`}
                                  />
                                  {editMode && (
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setCourseData(prev => ({
                                          ...prev,
                                          topics: prev.topics.map(t => 
                                            t.id === topic.id ? {
                                              ...t,
                                              areas: t.areas.map(a => 
                                                a.id === area.id ? {
                                                  ...a,
                                                  content: {
                                                    ...a.content,
                                                    assessments: a.content.assessments.filter(ass => ass.id !== assessment.id)
                                                  }
                                                } : a
                                              )
                                            } : t
                                          )
                                        }));
                                      }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  )}
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </TabPanel>

          <TabPanel value={currentTab} index={3}>
            {/* Cases and Material Reference Tab */}
            <Typography variant="h5" gutterBottom>
              Cases and Material Reference
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Add legal cases, reference materials, and supporting documentation to enhance learning.
            </Typography>

            {courseData.topics.map((topic) => (
              <Accordion key={topic.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">{topic.title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {topic.areas.map((area) => (
                    <Accordion key={area.id} sx={{ mb: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">{area.title}</Typography>
                        <Box sx={{ ml: 2 }}>
                          <Chip label={`${area.content.materials.length} materials`} size="small" sx={{ mr: 1 }} />
                          <Chip label={`${area.content.cases.length} cases`} size="small" />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={3}>
                          {/* Materials Section */}
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6">Materials</Typography>
                              {editMode && (
                                <Button
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => addNewMaterial(topic.id, area.id)}
                                >
                                  Add Material
                                </Button>
                              )}
                            </Box>
                            
                            <List dense>
                              {area.content.materials.map((material) => (
                                <ListItem key={material.id}>
                                  <ListItemIcon>
                                    <DescriptionIcon />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={material.title}
                                    secondary={`${material.type} - ${material.description}`}
                                  />
                                  {editMode && (
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setCourseData(prev => ({
                                          ...prev,
                                          topics: prev.topics.map(t => 
                                            t.id === topic.id ? {
                                              ...t,
                                              areas: t.areas.map(a => 
                                                a.id === area.id ? {
                                                  ...a,
                                                  content: {
                                                    ...a.content,
                                                    materials: a.content.materials.filter(m => m.id !== material.id)
                                                  }
                                                } : a
                                              )
                                            } : t
                                          )
                                        }));
                                      }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  )}
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                          
                          {/* Legal Cases Section */}
                          <Grid item xs={12} md={6}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                              <Typography variant="h6">Legal Cases</Typography>
                              {editMode && (
                                <Button
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => addNewCase(topic.id, area.id)}
                                >
                                  Add Case
                                </Button>
                              )}
                            </Box>
                            
                            <List dense>
                              {area.content.cases.map((legalCase) => (
                                <ListItem key={legalCase.id}>
                                  <ListItemIcon>
                                    <GavelIcon />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={legalCase.title}
                                    secondary={legalCase.citation}
                                  />
                                  {editMode && (
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setCourseData(prev => ({
                                          ...prev,
                                          topics: prev.topics.map(t => 
                                            t.id === topic.id ? {
                                              ...t,
                                              areas: t.areas.map(a => 
                                                a.id === area.id ? {
                                                  ...a,
                                                  content: {
                                                    ...a.content,
                                                    cases: a.content.cases.filter(c => c.id !== legalCase.id)
                                                  }
                                                } : a
                                              )
                                            } : t
                                          )
                                        }));
                                      }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  )}
                                </ListItem>
                              ))}
                            </List>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </TabPanel>
        </Card>
      </Container>

      {/* Save Dialog */}
      <Dialog open={saveDialog} onClose={() => setSaveDialog(false)}>
        <DialogTitle>Save Course</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Course Name"
            fullWidth
            variant="outlined"
            value={courseData.title}
            onChange={(e) => setCourseData(prev => ({ ...prev, title: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog(false)}>Cancel</Button>
          <Button onClick={() => saveCourse()} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={loadDialog} onClose={() => setLoadDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Load Course</DialogTitle>
        <DialogContent>
          <List>
            {savedCourses.map((course) => (
              <ListItem 
                key={course.id} 
                button 
                onClick={() => loadCourse(course)}
                sx={{ border: 1, borderColor: 'grey.300', mb: 1, borderRadius: 1 }}
              >
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText
                  primary={course.title}
                  secondary={`${course.topics.length} topics • Updated: ${course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : 'Unknown'}`}
                />
              </ListItem>
            ))}
            {savedCourses.length === 0 && (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                No saved courses found.
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}