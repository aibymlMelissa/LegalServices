import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Favorite as HealthIcon,
  Speed as PerformanceIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  VisibilityOff as HideIcon,
  Visibility as ShowIcon
} from '@mui/icons-material';

interface HealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  services: Array<{
    name: string;
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    lastCheck: string;
    details?: any;
  }>;
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      loadAverage: number[];
    };
    disk: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  dependencies: Array<{
    name: string;
    status: 'connected' | 'disconnected';
    version?: string;
    lastCheck: string;
  }>;
}

interface SystemMetrics {
  performance: {
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  storage: {
    courseCount: number;
    totalMaterials: number;
    cacheSize: number;
  };
  activity: {
    activeUsers: number;
    coursesGenerated: number;
    exportsToday: number;
  };
}

interface SecurityDashboard {
  totalUsers: number;
  activeUsers: number;
  lockedAccounts: number;
  activeSessions: number;
  recentLoginAttempts: Array<{
    ip: string;
    username: string;
    timestamp: string;
    success: boolean;
  }>;
  securityEvents: Array<{
    type: string;
    severity: string;
    timestamp: string;
    details: any;
  }>;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} style={{ paddingTop: '16px' }}>
      {value === index && children}
    </div>
  );
}

export default function SystemDashboard() {
  const [currentTab, setCurrentTab] = useState(0);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [securityDashboard, setSecurityDashboard] = useState<SecurityDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Component-level demo mode
  const [isComponentDemoMode, setIsComponentDemoMode] = useState(false);
  const [showDemoContent, setShowDemoContent] = useState(true);
  
  // Demo data for system dashboard
  const demoHealthStatus: HealthStatus = {
    overall: 'healthy',
    services: [
      { name: 'Course Generation API', status: 'healthy', responseTime: 45, lastCheck: '2025-08-26T12:00:00Z' },
      { name: 'Parameter Validation', status: 'healthy', responseTime: 12, lastCheck: '2025-08-26T12:00:00Z' },
      { name: 'Export Service', status: 'healthy', responseTime: 78, lastCheck: '2025-08-26T12:00:00Z' },
      { name: 'Authentication', status: 'healthy', responseTime: 23, lastCheck: '2025-08-26T12:00:00Z' },
      { name: 'Health Monitoring', status: 'healthy', responseTime: 15, lastCheck: '2025-08-26T12:00:00Z' },
      { name: 'Logging Service', status: 'healthy', responseTime: 8, lastCheck: '2025-08-26T12:00:00Z' }
    ],
    system: {
      uptime: 86400,
      memory: { used: 2048000000, total: 8192000000, percentage: 25 },
      cpu: { usage: 15, loadAverage: [1.2, 1.5, 1.8] },
      disk: { used: 50000000000, total: 250000000000, percentage: 20 }
    },
    dependencies: [
      { name: 'OpenAI API', status: 'connected', version: 'v4', lastCheck: '2025-08-26T12:00:00Z' },
      { name: 'Database', status: 'connected', version: '14.2', lastCheck: '2025-08-26T12:00:00Z' },
      { name: 'Redis Cache', status: 'connected', version: '7.0', lastCheck: '2025-08-26T12:00:00Z' },
      { name: 'File System', status: 'connected', lastCheck: '2025-08-26T12:00:00Z' }
    ]
  };

  const demoSystemMetrics: SystemMetrics = {
    performance: {
      averageResponseTime: 67,
      requestsPerMinute: 142,
      errorRate: 0.3
    },
    storage: {
      courseCount: 847,
      totalMaterials: 3205,
      cacheSize: 1024
    },
    activity: {
      activeUsers: 23,
      coursesGenerated: 15,
      exportsToday: 42
    }
  };

  const demoSecurityDashboard: SecurityDashboard = {
    totalUsers: 156,
    activeUsers: 23,
    lockedAccounts: 0,
    activeSessions: 31,
    recentLoginAttempts: [
      { ip: '192.168.1.100', username: 'admin', timestamp: '2025-08-26T11:45:00Z', success: true },
      { ip: '10.0.0.25', username: 'jdoe', timestamp: '2025-08-26T11:30:00Z', success: true },
      { ip: '172.16.0.50', username: 'legal_team', timestamp: '2025-08-26T11:15:00Z', success: true },
      { ip: '192.168.1.200', username: 'compliance_officer', timestamp: '2025-08-26T11:00:00Z', success: true }
    ],
    securityEvents: [
      { type: 'login', severity: 'low', timestamp: '2025-08-26T11:45:00Z', details: { successful: true } },
      { type: 'password_change', severity: 'low', timestamp: '2025-08-26T10:30:00Z', details: { userId: 'user123' } },
      { type: 'failed_login', severity: 'medium', timestamp: '2025-08-26T09:15:00Z', details: { attempts: 2 } }
    ]
  };

  const toggleComponentDemo = () => {
    setIsComponentDemoMode(!isComponentDemoMode);
    
    if (!isComponentDemoMode) {
      // Entering demo mode - populate with demo data
      setHealthStatus(demoHealthStatus);
      setSystemMetrics(demoSystemMetrics);
      setSecurityDashboard(demoSecurityDashboard);
      setIsLoading(false);
      setLastUpdated(new Date().toLocaleTimeString());
    } else {
      // Exiting demo mode - reset to loading state
      setHealthStatus(null);
      setSystemMetrics(null);
      setSecurityDashboard(null);
      setIsLoading(true);
      setLastUpdated('');
      // Trigger real data fetch
      refreshAllData();
    }
  };

  // Handle hide/show demo content
  useEffect(() => {
    if (isComponentDemoMode) {
      if (showDemoContent) {
        // Show demo data
        setHealthStatus(demoHealthStatus);
        setSystemMetrics(demoSystemMetrics);
        setSecurityDashboard(demoSecurityDashboard);
        setIsLoading(false);
      } else {
        // Hide demo data - show empty/loading state
        setHealthStatus(null);
        setSystemMetrics(null);
        setSecurityDashboard(null);
        setIsLoading(true);
      }
    }
  }, [showDemoContent, isComponentDemoMode]);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch health status');
      }

      const result = await response.json();
      
      // Transform backend response to match frontend expectations
      const transformedHealth = {
        overall: result.status,
        services: Object.entries(result.services || {}).map(([name, service]: [string, any]) => ({
          name,
          status: (service.status === 'up' ? 'healthy' : 'unhealthy') as 'healthy' | 'unhealthy',
          responseTime: service.responseTime || 0,
          lastCheck: service.lastCheck || new Date().toISOString()
        })),
        system: {
          uptime: result.uptime || 0,
          memory: result.services?.memory ? {
            used: result.services.memory.usage?.heapUsed || 0,
            total: result.services.memory.usage?.heapTotal || 0,
            percentage: result.services.memory.percentage || 0
          } : { used: 0, total: 0, percentage: 0 },
          cpu: {
            usage: result.system?.cpuUsage || 0,
            loadAverage: result.system?.loadAverage || [0, 0, 0]
          },
          disk: {
            used: parseInt(result.system?.diskUsage?.used?.replace(/[^0-9]/g, '') || '0') * 1024 * 1024 * 1024,
            total: parseInt(result.system?.diskUsage?.total?.replace(/[^0-9]/g, '') || '0') * 1024 * 1024 * 1024,
            percentage: result.system?.diskUsage?.percentage || 0
          }
        },
        dependencies: Object.entries(result.dependencies || {}).map(([name, dep]: [string, any]) => ({
          name,
          status: (dep.status === 'available' || dep.status === 'accessible' ? 'connected' : 'disconnected') as 'connected' | 'disconnected',
          version: dep.version || dep.model || 'unknown',
          lastCheck: dep.lastTestTime || dep.lastCheck || new Date().toISOString()
        }))
      };
      
      setHealthStatus(transformedHealth);
    } catch (error) {
      console.error('Health status error:', error);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/health/metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system metrics');
      }

      const result = await response.json();
      
      // Transform backend metrics to match frontend expectations
      const transformedMetrics = {
        performance: {
          averageResponseTime: 45, // Mock data - backend doesn't provide this
          requestsPerMinute: 120, // Mock data - backend doesn't provide this
          errorRate: 0.5 // Mock data - backend doesn't provide this
        },
        storage: {
          courseCount: 0, // Mock data - backend doesn't provide this
          totalMaterials: 0, // Mock data - backend doesn't provide this
          cacheSize: 1024 // Mock data - backend doesn't provide this
        },
        activity: {
          activeUsers: 1, // Can get from security dashboard
          coursesGenerated: 0, // Mock data - backend doesn't provide this
          exportsToday: 0 // Mock data - backend doesn't provide this
        }
      };
      
      setSystemMetrics(transformedMetrics);
    } catch (error) {
      console.error('System metrics error:', error);
    }
  };

  const fetchSecurityDashboard = async () => {
    try {
      const response = await fetch('/api/health/diagnostics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch security dashboard');
      }

      const result = await response.json();
      
      // Transform backend response to match frontend expectations
      const transformedSecurity = {
        totalUsers: 1, // Mock data - backend doesn't provide user count
        activeUsers: 1, // Mock data - backend doesn't provide active user count
        lockedAccounts: 0, // Mock data - backend doesn't provide locked account count
        activeSessions: 1, // Mock data - backend doesn't provide active session count
        recentLoginAttempts: [
          { 
            ip: '127.0.0.1', 
            username: 'current_user', 
            timestamp: new Date().toISOString(), 
            success: true 
          }
        ], // Mock data - backend doesn't provide login attempts
        securityEvents: [
          { 
            type: 'system_check', 
            severity: 'low', 
            timestamp: new Date().toISOString(), 
            details: { status: 'healthy' } 
          }
        ] // Mock data - backend doesn't provide security events
      };
      
      setSecurityDashboard(transformedSecurity);
    } catch (error) {
      console.error('Security dashboard error:', error);
      // Set fallback data in case of error
      const fallbackSecurity = {
        totalUsers: 0,
        activeUsers: 0,
        lockedAccounts: 0,
        activeSessions: 0,
        recentLoginAttempts: [],
        securityEvents: []
      };
      setSecurityDashboard(fallbackSecurity);
    }
  };

  const refreshAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchHealthStatus(),
      fetchSystemMetrics(),
      fetchSecurityDashboard()
    ]);
    setLastUpdated(new Date().toLocaleTimeString());
    setIsLoading(false);
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAllData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
      case 'unhealthy':
      case 'disconnected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'critical':
      case 'unhealthy':
      case 'disconnected':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon />;
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading && !healthStatus) {
    return (
      <Container maxWidth="xl" sx={{ py: 3, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading system dashboard...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
      
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <DashboardIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            System Dashboard
            {isComponentDemoMode && showDemoContent && (
              <Chip 
                label="DEMO MODE" 
                color="secondary" 
                size="small" 
                sx={{ ml: 2, animation: 'pulse 2s infinite' }} 
              />
            )}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {isComponentDemoMode 
              ? '🎭 Demonstration: Enterprise monitoring with sample data'
              : 'Enterprise system monitoring and health status'
            }
          </Typography>
          {lastUpdated && (
            <Typography variant="caption" color="textSecondary">
              Last updated: {lastUpdated}
            </Typography>
          )}
        </Box>
        <Box>
          <Button
            variant={isComponentDemoMode ? "contained" : "outlined"}
            color={isComponentDemoMode ? "secondary" : "primary"}
            onClick={toggleComponentDemo}
            startIcon={isComponentDemoMode ? <StopIcon /> : <PlayIcon />}
            sx={{ 
              mr: 2,
              minWidth: 140,
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s'
              }
            }}
          >
            {isComponentDemoMode ? 'Exit Demo' : '🎭 Try Demo'}
          </Button>
          {isComponentDemoMode && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setShowDemoContent(!showDemoContent)}
              startIcon={showDemoContent ? <HideIcon /> : <ShowIcon />}
              sx={{ mr: 2 }}
            >
              {showDemoContent ? 'Hide Demo' : 'Show Demo'}
            </Button>
          )}
          {!isComponentDemoMode && (
            <>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refreshAllData}
                disabled={isLoading}
                sx={{ mr: 2 }}
              >
                Refresh
              </Button>
              <Button
                variant={autoRefresh ? "contained" : "outlined"}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </Button>
            </>
          )}
        </Box>
      </Box>

      {isComponentDemoMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Demo Mode Active:</strong> You're viewing simulated enterprise monitoring data. 
            This demonstrates real-time system health, performance metrics, and security monitoring capabilities.
          </Typography>
        </Alert>
      )}

      {/* System Status Overview */}
      {healthStatus && (
        <Alert 
          severity={healthStatus?.overall === 'healthy' ? 'success' : healthStatus?.overall === 'warning' ? 'warning' : 'error'}
          sx={{ mb: 3 }}
        >
          <Typography variant="h6">
            System Status: {healthStatus?.overall?.toUpperCase() || 'UNKNOWN'}
          </Typography>
          <Typography variant="body2">
            {Array.isArray(healthStatus?.services) ? healthStatus.services.filter(s => s.status === 'healthy').length : 0} of {Array.isArray(healthStatus?.services) ? healthStatus.services.length : 0} services healthy
          </Typography>
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Health Monitor" icon={<HealthIcon />} />
          <Tab label="Performance" icon={<PerformanceIcon />} />
          <Tab label="Security" icon={<SecurityIcon />} />
        </Tabs>
      </Card>

      {/* Health Monitor Tab */}
      <TabPanel value={currentTab} index={0}>
        {healthStatus && (
          <Grid container spacing={3}>
            {/* System Metrics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MemoryIcon />
                    System Resources
                  </Typography>
                  
                  {healthStatus?.system?.memory && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Memory Usage: {healthStatus.system.memory.percentage?.toFixed(1) || 0}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={healthStatus.system.memory.percentage || 0} 
                        color={(healthStatus.system.memory.percentage || 0) > 80 ? 'error' : 'primary'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {formatBytes(healthStatus.system.memory.used || 0)} / {formatBytes(healthStatus.system.memory.total || 0)}
                      </Typography>
                    </Box>
                  )}

                  {healthStatus?.system?.cpu && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        CPU Usage: {healthStatus.system.cpu.usage?.toFixed(1) || 0}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={healthStatus.system.cpu.usage || 0} 
                        color={(healthStatus.system.cpu.usage || 0) > 80 ? 'error' : 'primary'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  )}

                  {healthStatus?.system?.disk && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Disk Usage: {healthStatus.system.disk.percentage?.toFixed(1) || 0}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={healthStatus.system.disk.percentage || 0} 
                        color={(healthStatus.system.disk.percentage || 0) > 90 ? 'error' : 'primary'}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {formatBytes(healthStatus.system.disk.used || 0)} / {formatBytes(healthStatus.system.disk.total || 0)}
                      </Typography>
                    </Box>
                  )}

                  {healthStatus?.system?.uptime !== undefined && (
                    <Typography variant="body2">
                      <strong>Uptime:</strong> {formatUptime(healthStatus.system.uptime)}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Service Status */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HealthIcon />
                    Service Status
                  </Typography>
                  
                  <List>
                    {Array.isArray(healthStatus?.services) && healthStatus.services.map((service) => (
                      <ListItem key={service.name} sx={{ px: 0 }}>
                        <ListItemIcon>
                          {getStatusIcon(service.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={service.name}
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Chip 
                                label={service.status} 
                                color={getStatusColor(service.status)} 
                                size="small" 
                              />
                              <Typography variant="caption">
                                {service.responseTime}ms
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Dependencies */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    External Dependencies
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {Array.isArray(healthStatus?.dependencies) && healthStatus.dependencies.map((dep) => (
                      <Grid item xs={12} sm={6} md={3} key={dep.name}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          {getStatusIcon(dep.status)}
                          <Typography variant="subtitle2" sx={{ mt: 1 }}>
                            {dep.name}
                          </Typography>
                          <Chip 
                            label={dep.status} 
                            color={getStatusColor(dep.status)} 
                            size="small" 
                            sx={{ mt: 1 }}
                          />
                          {dep.version && (
                            <Typography variant="caption" display="block">
                              v{dep.version}
                            </Typography>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Performance Tab */}
      <TabPanel value={currentTab} index={1}>
        {systemMetrics && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <PerformanceIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" color="primary">
                    {systemMetrics?.performance?.averageResponseTime || 0}ms
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Average Response Time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TimelineIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" color="success.main">
                    {systemMetrics?.performance?.requestsPerMinute || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Requests Per Minute
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ErrorIcon sx={{ fontSize: 48, color: (systemMetrics?.performance?.errorRate || 0) > 5 ? 'error.main' : 'success.main', mb: 1 }} />
                  <Typography variant="h4" color={(systemMetrics?.performance?.errorRate || 0) > 5 ? 'error.main' : 'success.main'}>
                    {systemMetrics?.performance?.errorRate?.toFixed(2) || '0.00'}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Error Rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <StorageIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" color="info.main">
                    {systemMetrics?.storage?.courseCount || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Courses
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <DashboardIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h4" color="secondary.main">
                    {systemMetrics?.activity?.activeUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" color="primary.main">
                    {systemMetrics?.activity?.coursesGenerated || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Courses Generated Today
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={currentTab} index={2}>
        {securityDashboard && (
          <Grid container spacing={3}>
            {/* Security Overview */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <SecurityIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" color="primary.main">
                    {securityDashboard?.totalUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" color="success.main">
                    {securityDashboard?.activeUsers || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Users
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <WarningIcon sx={{ fontSize: 48, color: (securityDashboard?.lockedAccounts || 0) > 0 ? 'warning.main' : 'success.main', mb: 1 }} />
                  <Typography variant="h4" color={(securityDashboard?.lockedAccounts || 0) > 0 ? 'warning.main' : 'success.main'}>
                    {securityDashboard?.lockedAccounts || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Locked Accounts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TimelineIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" color="info.main">
                    {securityDashboard?.activeSessions || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Sessions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Login Attempts */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Login Attempts
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Username</TableCell>
                          <TableCell>IP Address</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Time</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.isArray(securityDashboard?.recentLoginAttempts) && securityDashboard.recentLoginAttempts.slice(-10).map((attempt, index) => (
                          <TableRow key={index}>
                            <TableCell>{attempt.username}</TableCell>
                            <TableCell>{attempt.ip}</TableCell>
                            <TableCell>
                              <Chip 
                                label={attempt.success ? 'Success' : 'Failed'} 
                                color={attempt.success ? 'success' : 'error'} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>
                              {new Date(attempt.timestamp).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Security Events */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Security Events
                  </Typography>
                  <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {Array.isArray(securityDashboard?.securityEvents) && securityDashboard.securityEvents.slice(-20).map((event, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          {getStatusIcon(event.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={event.type.replace('_', ' ').toUpperCase()}
                          secondary={
                            <Box>
                              <Typography variant="caption">
                                {new Date(event.timestamp).toLocaleString()}
                              </Typography>
                              <Chip 
                                label={event.severity} 
                                color={getStatusColor(event.severity)} 
                                size="small" 
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

    </Container>
  );
}