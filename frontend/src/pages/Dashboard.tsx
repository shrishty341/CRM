import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Chip,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Skeleton,
  Alert,
  Paper,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HistoryIcon from '@mui/icons-material/History';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { fetchRecentHCPs } from '@/redux/hcpSlice';
import { fetchInteractionHistory } from '@/redux/interactionSlice';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { recentHcps, isLoading: hcpLoading } = useAppSelector((state) => state.hcp);
  const { interactions, isLoading: interactionLoading, total } = useAppSelector(
    (state) => state.interaction
  );

  useEffect(() => {
    dispatch(fetchRecentHCPs(5));
    dispatch(fetchInteractionHistory({ page: 1, pageSize: 5 }));
  }, [dispatch]);

  const quickActions = [
    {
      title: 'Manual Form',
      description: 'Fill in the interaction details manually',
      icon: <EventNoteIcon sx={{ fontSize: 40 }} />,
      path: '/log-interaction?mode=form',
      color: 'primary.main',
    },
    {
      title: 'AI Chat Assistant',
      description: 'Describe the interaction naturally, AI fills the form',
      icon: <SmartToyIcon sx={{ fontSize: 40 }} />,
      path: '/log-interaction?mode=chat',
      color: 'secondary.main',
    },
    {
      title: 'View History',
      description: 'Browse past interactions and exports',
      icon: <HistoryIcon sx={{ fontSize: 40 }} />,
      path: '/history',
      color: 'success.main',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the Pharma CRM HCP Interaction Module. Log and manage your
          interactions with Healthcare Professionals.
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action) => (
          <Grid item xs={12} sm={6} md={4} key={action.title}>
            <Card
              sx={{
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                },
              }}
            >
              <CardActionArea
                onClick={() => navigate(action.path)}
                sx={{ p: 2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: action.color,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {action.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {action.description}
                    </Typography>
                  </Box>
                  <ArrowForwardIcon
                    sx={{ color: 'text.secondary', mt: 1, fontSize: 20 }}
                  />
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Interactions */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Recent Interactions</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate('/history')}
                >
                  View All ({total})
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {interactionLoading ? (
                <Box sx={{ py: 2 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      variant="rectangular"
                      height={60}
                      sx={{ mb: 1, borderRadius: 1 }}
                    />
                  ))}
                </Box>
              ) : interactions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <EventNoteIcon
                    sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
                  />
                  <Typography color="text.secondary">
                    No interactions logged yet
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/log-interaction?mode=form')}
                  >
                    Log Your First Interaction
                  </Button>
                </Box>
              ) : (
                <List disablePadding>
                  {interactions.slice(0, 5).map((interaction) => (
                    <React.Fragment key={interaction.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{
                          px: 0,
                          py: 1.5,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover', borderRadius: 1 },
                        }}
                        onClick={() => navigate('/history')}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.light' }}>
                            <LocalHospitalIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Typography variant="subtitle2">
                                {interaction.doctor_name || 'Unknown Doctor'}
                              </Typography>
                              <Chip
                                label={interaction.outcome || 'pending'}
                                size="small"
                                color={
                                  interaction.outcome === 'positive'
                                    ? 'success'
                                    : interaction.outcome === 'neutral'
                                    ? 'default'
                                    : 'warning'
                                }
                                sx={{ height: 20, '& .MuiChip-label': { fontSize: 11 } }}
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                component="span"
                              >
                                {interaction.hospital} •{' '}
                                {interaction.meeting_date
                                  ? new Date(
                                      interaction.meeting_date
                                    ).toLocaleDateString()
                                  : 'Date not set'}
                              </Typography>
                              {interaction.products_discussed &&
                                interaction.products_discussed.length > 0 && (
                                  <Box sx={{ mt: 0.5 }}>
                                    {interaction.products_discussed.map(
                                      (product: string) => (
                                        <Chip
                                          key={product}
                                          label={product}
                                          size="small"
                                          variant="outlined"
                                          sx={{
                                            mr: 0.5,
                                            mb: 0.5,
                                            height: 20,
                                            fontSize: 11,
                                          }}
                                        />
                                      )
                                    )}
                                  </Box>
                                )}
                            </>
                          }
                        />
                      </ListItem>
                      {interaction.id !==
                        interactions[interactions.length - 1]?.id && (
                        <Divider component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Doctors */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Recent Doctors</Typography>
                <IconButton size="small" onClick={() => dispatch(fetchRecentHCPs(5))}>
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {hcpLoading ? (
                <Box sx={{ py: 2 }}>
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      variant="rectangular"
                      height={50}
                      sx={{ mb: 1, borderRadius: 1 }}
                    />
                  ))}
                </Box>
              ) : recentHcps.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LocalHospitalIcon
                    sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
                  />
                  <Typography color="text.secondary">
                    No doctors added yet
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {recentHcps.map((hcp) => (
                    <React.Fragment key={hcp.id}>
                      <ListItem sx={{ px: 0, py: 1 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'secondary.light' }}>
                            {hcp.doctor_name.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={hcp.doctor_name}
                          secondary={
                            <>
                              {hcp.hospital}
                              {hcp.specialization && (
                                <Chip
                                  label={hcp.specialization}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    ml: 1,
                                    height: 18,
                                    fontSize: 10,
                                  }}
                                />
                              )}
                            </>
                          }
                        />
                        <Chip
                          label={`${hcp.interaction_count} visits`}
                          size="small"
                          color="default"
                          variant="outlined"
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}
                  >
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700 }}>
                      {total}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Interactions
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}
                  >
                    <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 700 }}>
                      {recentHcps.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Active Doctors
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;