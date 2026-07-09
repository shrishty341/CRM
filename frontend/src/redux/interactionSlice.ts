/**
 * Redux slice for Interaction state management.
 * Handles CRUD operations for HCP interactions.
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  InteractionState,
  Interaction,
  InteractionCreatePayload,
} from '@/types';
import apiService from '@/services/api';

const initialState: InteractionState = {
  currentInteraction: null,
  interactions: [],
  isLoading: false,
  error: null,
  saveSuccess: false,
  total: 0,
  page: 1,
  pageSize: 20,
};

/**
 * Async thunk to save a new interaction.
 */
export const saveInteraction = createAsyncThunk(
  'interaction/save',
  async (payload: InteractionCreatePayload, { rejectWithValue }) => {
    try {
      const response = await apiService.createInteraction(payload);
      if (!response.success) {
        return rejectWithValue(response.message || 'Failed to save interaction');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail ||
        error.message ||
        'Failed to save interaction'
      );
    }
  }
);

/**
 * Async thunk to fetch interaction history.
 */
export const fetchInteractionHistory = createAsyncThunk(
  'interaction/fetchHistory',
  async (
    {
      page = 1,
      pageSize = 20,
      doctorName,
    }: { page?: number; pageSize?: number; doctorName?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.getInteractionHistory(
        page,
        pageSize,
        doctorName
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail ||
        error.message ||
        'Failed to fetch interaction history'
      );
    }
  }
);

/**
 * Async thunk to fetch a single interaction by ID.
 */
export const fetchInteractionById = createAsyncThunk(
  'interaction/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiService.getInteraction(id);
      if (!response.success) {
        return rejectWithValue(response.message || 'Interaction not found');
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail ||
        error.message ||
        'Failed to fetch interaction'
      );
    }
  }
);

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    // Set current interaction
    setCurrentInteraction: (
      state,
      action: PayloadAction<Interaction | null>
    ) => {
      state.currentInteraction = action.payload;
    },

    // Clear save success flag
    clearSaveSuccess: (state) => {
      state.saveSuccess = false;
    },

    // Clear errors
    clearError: (state) => {
      state.error = null;
    },

    // Reset state
    resetInteraction: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Save interaction
      .addCase(saveInteraction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.saveSuccess = false;
      })
      .addCase(saveInteraction.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentInteraction = action.payload as Interaction;
        state.saveSuccess = true;
        // Add to beginning of list if exists
        if (action.payload) {
          state.interactions.unshift(action.payload as Interaction);
          state.total += 1;
        }
      })
      .addCase(saveInteraction.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.saveSuccess = false;
      })

      // Fetch history
      .addCase(fetchInteractionHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInteractionHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.interactions = action.payload.interactions;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.page_size;
      })
      .addCase(fetchInteractionHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch by ID
      .addCase(fetchInteractionById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInteractionById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentInteraction = action.payload as Interaction;
      })
      .addCase(fetchInteractionById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentInteraction,
  clearSaveSuccess,
  clearError,
  resetInteraction,
} = interactionSlice.actions;

export default interactionSlice.reducer;