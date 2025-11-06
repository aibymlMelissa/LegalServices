import React from 'react';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  ExitToApp as ExitIcon,
  Help as HelpIcon,
  School as SchoolIcon,
  Gavel as GavelIcon,
  AutoAwesome as AIIcon,
  Description as DocsIcon
} from '@mui/icons-material';
import { useDemo } from '../hooks/useDemo';

export function DemoIndicator() {
  const { 
    isDemoMode, 
    exitDemoMode, 
    startTour, 
    availableTours,
    currentTour 
  } = useDemo();
  
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  if (!isDemoMode) return null;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleStartTour = (tourId: string) => {
    startTour(tourId);
    handleClose();
  };

  const getTourIcon = (tourId: string) => {
    switch (tourId) {
      case 'platform-overview':
        return <DocsIcon fontSize="small" />;
      case 'case-workflow':
        return <GavelIcon fontSize="small" />;
      case 'course-creation':
        return <SchoolIcon fontSize="small" />;
      case 'ai-features':
        return <AIIcon fontSize="small" />;
      default:
        return <PlayIcon fontSize="small" />;
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <Tooltip title="Demo Options - Click for tours">
        <Chip
          label="🎭 DEMO"
          color="secondary"
          variant="filled"
          size="small"
          clickable
          onClick={handleClick}
          sx={{
            fontWeight: 'bold',
            fontSize: '0.75rem',
            height: 24,
            animation: currentTour ? 'none' : 'pulse 3s infinite',
            cursor: 'pointer',
            '@keyframes pulse': {
              '0%': {
                opacity: 0.8,
              },
              '50%': {
                opacity: 1,
              },
              '100%': {
                opacity: 0.8,
              },
            },
          }}
        />
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" color="textSecondary">
            🎭 Demo Tours
          </Typography>
        </MenuItem>
        
        {availableTours.map((tour) => (
          <MenuItem
            key={tour.id}
            onClick={() => handleStartTour(tour.id)}
            disabled={currentTour === tour.id}
          >
            <ListItemIcon>
              {getTourIcon(tour.id)}
            </ListItemIcon>
            <ListItemText
              primary={tour.name}
              secondary={`${tour.steps.length} steps`}
            />
          </MenuItem>
        ))}
        
        <Divider />
        
        <MenuItem onClick={exitDemoMode}>
          <ListItemIcon>
            <ExitIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Exit Demo Mode" />
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default DemoIndicator;