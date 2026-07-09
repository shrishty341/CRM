import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Button,
  Tooltip,
  Collapse,
  Paper,
  Skeleton,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { fetchInteractionHistory } from '@/redux/interactionSlice';
import type { Interaction } from '@/types';

const History: React.FC = () => {
  const dispatch = useAppDispatch();
  const { interactions, isLoading, total, page, pageSize } = useAppSelector(
    (state) => state.interaction
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [pageNum, setPageNum] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    dispatch(
      fetchInteractionHistory({
        page: pageNum + 1,
        pageSize: rowsPerPage,
        doctorName: searchTerm || undefined,
      })
    );
  }, [dispatch, pageNum, rowsPerPage, searchTerm]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPageNum(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageNum(0);
  };

  const handleSearch = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchTerm(event.target.value);
    setPageNum(0);
  };

  const handleRefresh = () => {
    dispatch(
      fetchInteractionHistory({
        page: pageNum + 1,
        pageSize: rowsPerPage,
        doctorName: searchTerm || undefined,
      })
    );
    toast.info('Refreshed!');
  };

  const handleCopySummary = (interaction: Interaction) => {
    const summary = [
      `Doctor: ${interaction.doctor_name || 'N/A'}`,
      `Hospital: ${interaction.hospital || 'N/A'}`,
      `Date: ${interaction.meeting_date ? new Date(interaction.meeting_date).toLocaleDateString() : 'N/A'}`,
      `Products: ${(interaction.products_discussed || []).join(', ') || 'None'}`,
      `Samples: ${interaction.samples_given || 0}`,
      `Outcome: ${interaction.outcome || 'N/A'}`,
      `Follow-up: ${interaction.follow_up_date ? new Date(interaction.follow_up_date).toLocaleDateString() : 'Not set'}`,
      interaction.notes ? `\nNotes: ${interaction.notes}` : '',
    ].join('\n');

    navigator.clipboard.writeText(summary);
    toast.success('Summary copied to clipboard!');
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(interactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interactions_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported successfully!');
  };

  const getOutcomeColor = (outcome: string | null) => {
    switch (outcome) {
      case 'positive':
        return 'success';
      case 'neutral':
        return 'default';
      case 'follow_up_required':
        return 'warning';
      case 'sample_requested':
        return 'info';
      case 'prescription_commitment':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Interaction History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse and manage all logged interactions with Healthcare Professionals.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleExportJSON}
            size="small"
          >
            Export JSON
          </Button>
          <IconButton onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by doctor name..."
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={40} />
                <TableCell>Doctor</TableCell>
                <TableCell>Hospital</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Samples</TableCell>
                <TableCell>Outcome</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from(new Array(5)).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton
                        variant="rectangular"
                        height={40}
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : interactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <EventNoteIcon
                      sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }}
                    />
                    <Typography color="text.secondary">
                      {searchTerm
                        ? `No interactions found for "${searchTerm}"`
                        : 'No interactions logged yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                interactions.map((interaction) => (
                  <React.Fragment key={interaction.id}>
                    <TableRow
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() =>
                        setExpandedRow(
                          expandedRow === interaction.id ? null : interaction.id
                        )
                      }
                    >
                      <TableCell>
                        <IconButton size="small">
                          {expandedRow === interaction.id ? (
                            <KeyboardArrowUpIcon />
                          ) : (
                            <KeyboardArrowDownIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: 'secondary.light',
                              fontSize: 14,
                            }}
                          >
                            {interaction.doctor_name?.charAt(0) || '?'}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {interaction.doctor_name || 'Unknown'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {interaction.hospital || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {interaction.meeting_date
                            ? new Date(
                                interaction.meeting_date
                              ).toLocaleDateString()
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.5,
                          }}
                        >
                          {(interaction.products_discussed || [])
                            .slice(0, 2)
                            .map((product) => (
                              <Chip
                                key={product}
                                label={product}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: 11 }}
                              />
                            ))}
                          {(interaction.products_discussed || []).length > 2 && (
                            <Chip
                              label={`+${interaction.products_discussed!.length - 2}`}
                              size="small"
                              sx={{ height: 20, fontSize: 11 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {interaction.samples_given || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={interaction.outcome || 'pending'}
                          size="small"
                          color={getOutcomeColor(interaction.outcome)}
                          sx={{ height: 22, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Copy summary">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySummary(interaction);
                            }}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details */}
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        sx={{ py: 0, borderBottom: expandedRow === interaction.id ? undefined : 'none' }}
                      >
                        <Collapse
                          in={expandedRow === interaction.id}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ py: 2, px: 4 }}>
                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                              Interaction Details
                            </Typography>
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 2,
                              }}
                            >
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Specialization
                                </Typography>
                                <Typography variant="body2">
                                  {interaction.specialization || 'N/A'}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Interaction Type
                                </Typography>
                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                  {interaction.interaction_type?.replace('_', ' ') || 'N/A'}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Follow-up Date
                                </Typography>
                                <Typography variant="body2">
                                  {interaction.follow_up_date
                                    ? new Date(
                                        interaction.follow_up_date
                                      ).toLocaleDateString()
                                    : 'Not scheduled'}
                                </Typography>
                              </Box>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Logged At
                                </Typography>
                                <Typography variant="body2">
                                  {interaction.created_at
                                    ? new Date(
                                        interaction.created_at
                                      ).toLocaleString()
                                    : 'N/A'}
                                </Typography>
                              </Box>
                              {interaction.ai_summary && (
                                <Box sx={{ gridColumn: 'span 2' }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    AI Summary
                                  </Typography>
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {interaction.ai_summary}
                                  </Typography>
                                </Box>
                              )}
                              {interaction.notes && (
                                <Box sx={{ gridColumn: 'span 2' }}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Notes
                                  </Typography>
                                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {interaction.notes}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={pageNum}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Card>
    </Box>
  );
};

export default History;