import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Divider
} from '@mui/material';
import {
  Upload as UploadIcon,
  Preview as PreviewIcon,
  Palette as PaletteIcon,
  Business as BusinessIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Image as ImageIcon,
  VisibilityOff as HideIcon,
  Visibility as ShowIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

interface Template {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    title: string;
    body: string;
    accent: string;
  };
  hasLogo: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Templates: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [showDemo, setShowDemo] = useState(true);

  // Demo templates data
  const demoTemplates: Template[] = [
    {
      id: 'demo-1',
      name: 'Corporate Legal Template',
      description: 'Professional template for corporate legal presentations',
      colors: {
        primary: '#1B365D',
        secondary: '#4A90A4', 
        accent: '#DAA520',
        background: '#FFFFFF',
        text: '#2C3E50'
      },
      fonts: {
        title: 'Calibri Bold',
        body: 'Calibri',
        accent: 'Calibri Light'
      },
      hasLogo: true
    },
    {
      id: 'demo-2',
      name: 'Modern Law Firm Template',
      description: 'Contemporary design for modern law practices',
      colors: {
        primary: '#2E4057',
        secondary: '#048A81',
        accent: '#F39C12',
        background: '#F8F9FA',
        text: '#212529'
      },
      fonts: {
        title: 'Arial Bold',
        body: 'Arial',
        accent: 'Arial Italic'
      },
      hasLogo: false
    }
  ];
  
  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [templateConfig, setTemplateConfig] = useState({
    name: '',
    description: '',
    colors: {
      primary: '#1B365D',
      secondary: '#4A90A4',
      accent: '#DAA520',
      background: '#FFFFFF',
      text: '#2C3E50'
    },
    fonts: {
      title: 'Calibri',
      body: 'Calibri',
      accent: 'Calibri Light'
    }
  });

  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [showDemo]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      if (showDemo) {
        // Show demo templates
        setTemplates(demoTemplates);
      } else {
        // Fetch real templates from API
        const response = await api.get('/templates');
        setTemplates(response.data.templates || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch templates');
      if (showDemo) {
        // Fallback to demo data on error
        setTemplates(demoTemplates);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUploadTemplate = async () => {
    try {
      if (!templateConfig.name) {
        setError('Template name is required');
        return;
      }

      setLoading(true);
      const formData = new FormData();
      
      if (templateFile) {
        formData.append('template', templateFile);
      }
      
      formData.append('templateConfig', JSON.stringify(templateConfig));

      const response = await api.post('/templates/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Template uploaded successfully!');
      setUploadDialogOpen(false);
      resetUploadForm();
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload template');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadLogo = async () => {
    try {
      if (!logoFile) {
        setError('Please select a logo file');
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await api.post('/templates/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Logo uploaded successfully!');
      setLogoFile(null);
      fetchTemplates();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload logo');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewTemplate = async (template: Template) => {
    try {
      setLoading(true);
      const response = await api.post(`/templates/${template.id}/generate-preview`);
      
      // Open download link
      const downloadUrl = response.data.downloadUrl;
      window.open(`${api.defaults.baseURL}${downloadUrl}`, '_blank');
      
      setSuccess('Template preview generated! Check your downloads.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const resetUploadForm = () => {
    setTemplateFile(null);
    setLogoFile(null);
    setTemplateConfig({
      name: '',
      description: '',
      colors: {
        primary: '#1B365D',
        secondary: '#4A90A4',
        accent: '#DAA520',
        background: '#FFFFFF',
        text: '#2C3E50'
      },
      fonts: {
        title: 'Calibri',
        body: 'Calibri',
        accent: 'Calibri Light'
      }
    });
  };

  const handleColorChange = (colorType: string, value: string) => {
    setTemplateConfig(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorType]: value
      }
    }));
  };

  const handleFontChange = (fontType: string, value: string) => {
    setTemplateConfig(prev => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [fontType]: value
      }
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <PaletteIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Presentation Templates
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your law firm's PowerPoint templates and branding
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => setShowDemo(!showDemo)}
          startIcon={showDemo ? <HideIcon /> : <ShowIcon />}
        >
          {showDemo ? 'Hide Demo' : 'Show Demo'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Available Templates" />
          <Tab label="Upload Custom Template" />
          <Tab label="Upload Logo" />
        </Tabs>
      </Box>

      {/* Available Templates Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {templates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {template.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {template.description}
                  </Typography>
                  
                  {/* Color Palette Preview */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Color Palette:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {Object.entries(template.colors).map(([key, color]) => (
                        <Box
                          key={key}
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: color,
                            border: '1px solid #ccc',
                            borderRadius: 0.5
                          }}
                          title={`${key}: ${color}`}
                        />
                      ))}
                    </Box>
                  </Box>

                  {/* Font Information */}
                  <Typography variant="subtitle2" gutterBottom>
                    Fonts:
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={`Title: ${template.fonts.title}`} 
                      size="small" 
                      sx={{ mr: 0.5, mb: 0.5 }} 
                    />
                    <Chip 
                      label={`Body: ${template.fonts.body}`} 
                      size="small" 
                      sx={{ mr: 0.5, mb: 0.5 }} 
                    />
                  </Box>

                  {template.hasLogo && (
                    <Chip 
                      icon={<ImageIcon />} 
                      label="Has Logo" 
                      color="success" 
                      size="small" 
                    />
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={() => handlePreviewTemplate(template)}
                    disabled={loading}
                  >
                    Preview
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handlePreviewTemplate(template)}
                    disabled={loading}
                  >
                    Download Sample
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Upload Custom Template Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Custom PowerPoint Template
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload your firm's custom PowerPoint template file (.pptx) and configure the styling.
            </Typography>

            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={templateConfig.name}
                  onChange={(e) => setTemplateConfig(prev => ({ ...prev, name: e.target.value }))}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  value={templateConfig.description}
                  onChange={(e) => setTemplateConfig(prev => ({ ...prev, description: e.target.value }))}
                  margin="normal"
                  multiline
                  rows={3}
                />

                {/* File Upload */}
                <Box sx={{ mt: 2 }}>
                  <input
                    accept=".pptx,.potx"
                    style={{ display: 'none' }}
                    id="template-file-input"
                    type="file"
                    onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="template-file-input">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                      fullWidth
                    >
                      {templateFile ? templateFile.name : 'Upload Template File (.pptx)'}
                    </Button>
                  </label>
                </Box>
              </Grid>

              {/* Color Configuration */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Color Palette
                </Typography>
                {Object.entries(templateConfig.colors).map(([key, value]) => (
                  <Box key={key} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ minWidth: 80, textTransform: 'capitalize' }}>
                      {key}:
                    </Typography>
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      style={{ width: 50, height: 30, border: 'none', borderRadius: 4 }}
                    />
                    <TextField
                      size="small"
                      value={value}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      sx={{ width: 100 }}
                    />
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                {/* Font Configuration */}
                <Typography variant="subtitle1" gutterBottom>
                  Font Settings
                </Typography>
                {Object.entries(templateConfig.fonts).map(([key, value]) => (
                  <FormControl fullWidth margin="normal" key={key}>
                    <InputLabel sx={{ textTransform: 'capitalize' }}>{key} Font</InputLabel>
                    <Select
                      value={value}
                      label={`${key} Font`}
                      onChange={(e) => handleFontChange(key, e.target.value)}
                    >
                      <MenuItem value="Calibri">Calibri</MenuItem>
                      <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                      <MenuItem value="Arial">Arial</MenuItem>
                      <MenuItem value="Segoe UI">Segoe UI</MenuItem>
                      <MenuItem value="Georgia">Georgia</MenuItem>
                      <MenuItem value="Calibri Light">Calibri Light</MenuItem>
                      <MenuItem value="Segoe UI Light">Segoe UI Light</MenuItem>
                    </Select>
                  </FormControl>
                ))}
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleUploadTemplate}
                disabled={loading || !templateConfig.name}
                startIcon={<UploadIcon />}
              >
                Upload Template
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Upload Logo Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Firm Logo
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload your law firm's logo to be included in all presentations.
            </Typography>

            <Box sx={{ mt: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="logo-file-input"
                type="file"
                onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="logo-file-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<ImageIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {logoFile ? logoFile.name : 'Select Logo Image'}
                </Button>
              </label>
            </Box>

            {logoFile && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <img
                  src={URL.createObjectURL(logoFile)}
                  alt="Logo Preview"
                  style={{ maxWidth: 200, maxHeight: 100, objectFit: 'contain' }}
                />
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleUploadLogo}
                disabled={loading || !logoFile}
                startIcon={<UploadIcon />}
              >
                Upload Logo
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
    </Container>
  );
};

export default Templates;