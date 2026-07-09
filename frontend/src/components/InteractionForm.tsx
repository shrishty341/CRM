import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Chip,
  Autocomplete,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  FormHelperText,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { toast } from 'react-toastify';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { saveInteraction, clearSaveSuccess } from '@/redux/interactionSlice';
import { setExtractedData } from '@/redux/chatSlice';
import {
  InteractionFormData,
  InteractionMode,
  OUTCOME_OPTIONS,
  INTERACTION_TYPE_OPTIONS,
  SPECIALIZATION_OPTIONS,
  PRODUCT_OPTIONS,
} from '@/types';

interface Props {
  mode: InteractionMode;
}

const defaultFormValues: InteractionFormData = {
  doctor_name: '',
  hospital: '',
  specialization: '',
  meeting_date: new Date().toISOString().split('T')[0],
  interaction_type: 'in_person',
  products_discussed: '',
  samples_given: 0,
  outcome: '',
  follow_up_date: '',
  notes: '',
};

const InteractionForm: React.FC<Props> = ({ mode }) => {
  const dispatch = useAppDispatch();
  const { extractedData } = useAppSelector((state) => state.chat);
  const { isLoading, saveSuccess, error } = useAppSelector(
    (state) => state.interaction
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<InteractionFormData>({
    defaultValues: defaultFormValues,
  });

  const productsValue = watch('products_discussed');

  // Populate form from AI extracted data
  useEffect(() => {
    if (extractedData && mode === 'chat') {
      const updates: Partial<InteractionFormData> = {};

      if (extractedData.doctor_name) {
        updates.doctor_name = extractedData.doctor_name;
      }
      if (extractedData.hospital) {
        updates.hospital = extractedData.hospital;
      }
      if (extractedData.specialization) {
        updates.specialization = extractedData.specialization;
      }
      if (extractedData.meeting_date) {
        updates.meeting_date = extractedData.meeting_date;
      }
      if (extractedData.products_discussed && extractedData.products_discussed.length > 0) {
        updates.products_discussed = extractedData.products_discussed.join(', ');
      }
      if (extractedData.samples_given !== null && extractedData.samples_given !== undefined) {
        updates.samples_given = extractedData.samples_given;
      }
      if (extractedData.outcome) {
        updates.outcome = extractedData.outcome;
      }
      if (extractedData.follow_up_date) {
        updates.follow_up_date = extractedData.follow_up_date;
      }
      if (extractedData.summary) {
        updates.notes = extractedData.summary;
      }

      reset({ ...defaultFormValues, ...updates });
    }
  }, [extractedData, mode, reset]);

  // Handle save success
  useEffect(() => {
    if (saveSuccess) {
      toast.success('Interaction saved successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      reset(defaultFormValues);
      dispatch(setExtractedData(null));
      dispatch(clearSaveSuccess());
    }
  }, [saveSuccess, dispatch, reset]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  }, [error]);

  const onSubmit = (data: InteractionFormData) => {
    const productsArray = data.products_discussed
      ? data.products_discussed
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      : [];

    dispatch(
      saveInteraction({
        doctor_name: data.doctor_name,
        hospital: data.hospital,
        specialization: data.specialization || null,
        meeting_date: data.meeting_date
          ? new Date(data.meeting_date).toISOString()
          : null,
        interaction_type: data.interaction_type,
        products_discussed: productsArray,
        samples_given: data.samples_given || 0,
        outcome: data.outcome || null,
        follow_up_date: data.follow_up_date
          ? new Date(data.follow_up_date).toISOString()
          : null,
        notes: data.notes || null,
        ai_summary: extractedData?.summary || null,
      })
    );
  };

  const handleReset = () => {
    reset(defaultFormValues);
    dispatch(setExtractedData(null));
    toast.info('Form has been reset');
  };

  const handleProductSelect = (_: any, value: string | null) => {
    if (value) {
      const current = productsValue ? productsValue.split(',').map((p) => p.trim()) : [];
      if (!current.includes(value)) {
        current.push(value);
        setValue('products_discussed', current.join(', '), { shouldDirty: true });
      }
    }
  };

  return (
    <Card sx={{ height: '100%', overflow: 'auto' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Form Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Interaction Details
            </Typography>
            {extractedData && mode === 'chat' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <AutoAwesomeIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                <Typography variant="caption" color="secondary.main">
                  AI-populated fields - review and edit before saving
                </Typography>
              </Box>
            )}
          </Box>
          {extractedData && extractedData.confidence_score && (
            <Chip
              label={`AI Confidence: ${(extractedData.confidence_score * 100).toFixed(0)}%`}
              size="small"
              color={
                extractedData.confidence_score > 0.8 ? 'success' : 'warning'
              }
              variant="outlined"
            />
          )}
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            {/* Doctor Name */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="doctor_name"
                control={control}
                rules={{
                  required: 'Doctor name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Doctor Name *"
                    placeholder="e.g., Dr. Rajesh Sharma"
                    fullWidth
                    size="small"
                    error={!!errors.doctor_name}
                    helperText={errors.doctor_name?.message}
                    InputProps={{
                      sx: {
                        bgcolor: extractedData?.doctor_name ? 'success.light' : 'transparent',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: extractedData?.doctor_name ? 'success.main' : undefined,
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Hospital */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="hospital"
                control={control}
                rules={{
                  required: 'Hospital name is required',
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Hospital *"
                    placeholder="e.g., Apollo Hospital"
                    fullWidth
                    size="small"
                    error={!!errors.hospital}
                    helperText={errors.hospital?.message}
                    InputProps={{
                      sx: {
                        bgcolor: extractedData?.hospital ? 'success.light' : 'transparent',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: extractedData?.hospital ? 'success.main' : undefined,
                        },
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Specialization */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="specialization"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Specialization"
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        bgcolor: extractedData?.specialization ? 'success.light' : 'transparent',
                      },
                    }}
                  >
                    <MenuItem value="">Select Specialization</MenuItem>
                    {SPECIALIZATION_OPTIONS.map((spec) => (
                      <MenuItem key={spec} value={spec}>
                        {spec}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Meeting Date */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="meeting_date"
                control={control}
                rules={{ required: 'Meeting date is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Meeting Date *"
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.meeting_date}
                    helperText={errors.meeting_date?.message}
                  />
                )}
              />
            </Grid>

            {/* Interaction Type */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="interaction_type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Interaction Type"
                    fullWidth
                    size="small"
                  >
                    {INTERACTION_TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Samples Given */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="samples_given"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Samples Given"
                    type="number"
                    fullWidth
                    size="small"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value, 10) : 0
                      )
                    }
                    InputProps={{
                      inputProps: { min: 0, max: 1000 },
                      sx: {
                        bgcolor:
                          extractedData?.samples_given !== null &&
                          extractedData?.samples_given !== undefined
                            ? 'success.light'
                            : 'transparent',
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Products Discussed */}
            <Grid item xs={12}>
              <Controller
                name="products_discussed"
                control={control}
                render={({ field }) => (
                  <Box>
                    <TextField
                      {...field}
                      label="Products Discussed"
                      placeholder="e.g., CardioPlus, NeuroMax (comma separated)"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      InputProps={{
                        sx: {
                          bgcolor:
                            extractedData?.products_discussed &&
                            extractedData.products_discussed.length > 0
                              ? 'success.light'
                              : 'transparent',
                        },
                      }}
                    />
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {PRODUCT_OPTIONS.map((product) => {
                        const isSelected = field.value
                          ?.split(',')
                          .map((p) => p.trim())
                          .includes(product);
                        return (
                          <Chip
                            key={product}
                            label={product}
                            size="small"
                            variant={isSelected ? 'filled' : 'outlined'}
                            color={isSelected ? 'primary' : 'default'}
                            onClick={() => handleProductSelect(null, product)}
                            sx={{ cursor: 'pointer' }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                )}
              />
            </Grid>

            {/* Outcome */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="outcome"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Meeting Outcome"
                    fullWidth
                    size="small"
                    InputProps={{
                      sx: {
                        bgcolor: extractedData?.outcome ? 'success.light' : 'transparent',
                      },
                    }}
                  >
                    <MenuItem value="">Select Outcome</MenuItem>
                    {OUTCOME_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Follow-up Date */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="follow_up_date"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Follow-up Date"
                    type="date"
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      sx: {
                        bgcolor: extractedData?.follow_up_date
                          ? 'success.light'
                          : 'transparent',
                      },
                    }}
                  />
                )}
              />
            </Grid>

            {/* Notes / AI Summary */}
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes / Summary"
                    placeholder="Additional notes about the interaction..."
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RestartAltIcon />}
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={
                isLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
              disabled={isLoading}
              sx={{ minWidth: 140 }}
            >
              {isLoading ? 'Saving...' : 'Save Interaction'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default InteractionForm;