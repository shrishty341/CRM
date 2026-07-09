/**
 * Redux store configuration for Pharma CRM.
 * Configures the store with chat, interaction, and HCP slices.
 */
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import interactionReducer from './interactionSlice';
import hcpReducer from './hcpSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    interaction: interactionReducer,
    hcp: hcpReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in specific paths
        ignoredActions: ['chat/setExtractedData'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;