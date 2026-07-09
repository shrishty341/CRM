/**
 * Redux slice for HCP (Healthcare Professional) state management.
 * Handles listing, searching, and managing doctors.
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HCPState, HCP } from '@/types';
import apiService from '@/services/api';

const initialState: HCPState = {
  hcps: [],
  recentHcps: [],
  isLoading: false,
  error: null,
  total: 0,
};

/**
 * Async thunk to fetch HCPs with search.
 */
export const fetchHCPs = createAsyncThunk(
  'hcp/fetchAll',
  async (
    {
      query,
      specialization,
      limit = 10,
      offset = 0,
    }: {
      query?: string;
      specialization?: string;
      limit?: number;
      offset?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.listHCPs(
        query,
        specialization,
        limit,
        offset
      );
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail ||
        error.message ||
        'Failed to fetch HCPs'
      );
    }
  }
);

/**
 * Async thunk to fetch recent HCPs.
 */
export const fetchRecentHCPs = createAsyncThunk(
  'hcp/fetchRecent',
  async (limit: number = 5, { rejectWithValue }) => {
    try {
      const response = await apiService.getRecentHCPs(limit);
      return response.hcps;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail ||
        error.message ||
        'Failed to fetch recent HCPs'
      );
    }
  }
);

const hcpSlice = createSlice({
  name: 'hcp',
  initialState,
  reducers: {
    // Clear errors
    clearError: (state) => {
      state.error = null;
    },
    // Reset state
    resetHCP: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch all HCPs
      .addCase(fetchHCPs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHCPs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hcps = action.payload.hcps;
        state.total = action.payload.total;
      })
      .addCase(fetchHCPs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch recent HCPs
      .addCase(fetchRecentHCPs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentHCPs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentHcps = action.payload;
      })
      .addCase(fetchRecentHCPs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetHCP } = hcpSlice.actions;
export default hcpSlice.reducer;