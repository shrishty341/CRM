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
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
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
    formState: { errors },
  } = useForm<InteractionFormData>({
    defaultValues: defaultFormValues,
  });

  const productsValue = watch('products_discussed');
  const [sentiment, setSentiment] = React.useState('positive');
  const [materials, setMaterials] = React.useState<string[]>([]);
  const [samples, setSamples] = React.useState<{ name: string; quantity: number }[]>([]);

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
      setSentiment('positive');
      setMaterials([]);
      setSamples([]);
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
    setSentiment('positive');
    setMaterials([]);
    setSamples([]);
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

  const handleAddMaterial = () => {
    const newMaterial = prompt('Enter material name:');
    if (newMaterial && !materials.includes(newMaterial)) {
      setMaterials([...materials, newMaterial]);
    }
  };

  const handleAddSample = () => {
    const sampleName = prompt('Enter sample name:');
    const quantity = prompt('Enter quantity:');
    if (sampleName && quantity) {
      setSamples([...samples, { name: sampleName, quantity: parseInt(quantity) || 0 }]);
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
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Log Interaction
          </Typography>
          {extractedData && extractedData.confidence_score && (
            <Chip
              icon={<AutoAwesomeIcon />}
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
          <Grid container spacing={3}>
            {/* Topics Discussed */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Topics Discussed
              </Typography>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="Product X efficiency..."
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'grey.50',
                      },
                    }}
                  />
                )}
              />
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                >
                  📝 Summarize from Voice Note (Requires Consent)
                </Typography>
              </Box>
            </Grid>

            {/* Materials Shared / Samples Distributed */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Materials Shared / Samples Distributed
              </Typography>

              {/* Materials Shared */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Materials Shared
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    placeholder="Brochures"
                    size="small"
                    sx={{ flex: 1 }}
                    value={materials.join(', ')}
                    onChange={(e) => setMaterials(e.target.value.split(',').map(m => m.trim()).filter(Boolean))}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SearchIcon />}
                    onClick={handleAddMaterial}
                  >
                    Search/Add
                  </Button>
                </Box>
              </Box>

              {/* Samples Distributed */}
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Samples Distributed
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    placeholder="No samples added"
                    size="small"
                    sx={{ flex: 1 }}
                    value={samples.map(s => `${s.name} (${s.quantity})`).join(', ') || ''}
                    onChange={(e) => {
                      const text = e.target.value;
                      if (!text) setSamples([]);
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddSample}
                  >
                    Add Sample
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Observed/Inferred HCP Sentiment */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Observed/Inferred HCP Sentiment
              </Typography>
              <FormControl>
                <RadioGroup
                  row
                  value={sentiment}
                  onChange={(e) => setSentiment(e.target.value)}
                >
                  <FormControlLabel
                    value="positive"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        😊 Positive
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="neutral"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        😐 Neutral
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="negative"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        😟 Negative
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Outcomes */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Outcomes
              </Typography>
              <Controller
                name="outcome"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    placeholder="Key outcomes or agreements..."
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    select
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

            {/* Follow-up Actions */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Follow-up Actions
              </Typography>
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
                  />
                )}
              />
            </Grid>

            {/* Doctor and Hospital Info */}
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
                    label="HCP Name"
                    placeholder="e.g., Dr. Rajesh Sharma"
                    fullWidth
                    size="small"
                    error={!!errors.doctor_name}
                    helperText={errors.doctor_name?.message}
                  />
                )}
              />
            </Grid>

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
                    label="Hospital"
                    placeholder="e.g., Apollo Hospital"
                    fullWidth
                    size="small"
                    error={!!errors.hospital}
                    helperText={errors.hospital?.message}
                  />
                )}
              />
            </Grid>

            {/* Meeting Date and Type */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="meeting_date"
                control={control}
                rules={{ required: 'Meeting date is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Date of Interaction"
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

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
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
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default InteractionForm;