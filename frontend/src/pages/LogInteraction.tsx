import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  Alert,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChatPanel from '@/components/ChatPanel';
import InteractionForm from '@/components/InteractionForm';
import { useAppSelector } from '@/hooks/useAppDispatch';
import type { InteractionMode } from '@/types';

const LogInteraction: React.FC = () => {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode') as InteractionMode | null;
  const [mode, setMode] = useState<InteractionMode>(modeParam || 'chat');
  const { extractedData, showForm } = useAppSelector((state) => state.chat);

  useEffect(() => {
    if (modeParam) {
      setMode(modeParam);
    }
  }, [modeParam]);

  const handleModeChange = (
    _: React.MouseEvent<HTMLElement>,
    newMode: InteractionMode | null
  ) => {
    if (newMode) {
      setMode(newMode);
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Log Interaction
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Choose your preferred method to log an interaction with a Healthcare Professional.
        </Typography>

        {/* Mode Toggle */}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          aria-label="interaction mode"
          sx={{
            '& .MuiToggleButton-root': {
              px: 3,
              py: 1,
              borderRadius: '8px !important',
              border: '1px solid',
              borderColor: 'divider',
              mx: 0.5,
              '&.Mui-selected': {
                bgcolor: mode === 'chat' ? 'secondary.main' : 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: mode === 'chat' ? 'secondary.dark' : 'primary.dark',
                },
              },
            },
          }}
        >
          <ToggleButton value="chat" aria-label="ai chat mode">
            <SmartToyIcon sx={{ mr: 1 }} />
            AI Chat Assistant
          </ToggleButton>
          <ToggleButton value="form" aria-label="manual form mode">
            <EditNoteIcon sx={{ mr: 1 }} />
            Manual Form
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Two-Panel Layout */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Left Panel - Chat (only in chat mode) */}
          {mode === 'chat' && (
            <Grid
              item
              xs={12}
              md={showForm ? 6 : 12}
              sx={{ height: '100%', overflow: 'hidden' }}
            >
              <ChatPanel />
            </Grid>
          )}

          {/* Right Panel - Form */}
          <Grid
            item
            xs={12}
            md={
              mode === 'chat'
                ? showForm
                  ? 6
                  : 12
                : 12
            }
            sx={{ height: '100%', overflow: 'auto' }}
          >
            <InteractionForm mode={mode} />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LogInteraction;