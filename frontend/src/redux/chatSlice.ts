/**
 * Redux slice for AI Chat state management.
 * Handles chat messages, AI processing, and extracted data.
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  ChatState,
  ChatMessage,
  ChatRequest,
  AIExtractedData,
} from '@/types';
import apiService from '@/services/api';

const initialState: ChatState = {
  messages: [],
  currentConversationId: null,
  isProcessing: false,
  error: null,
  extractedData: null,
  showForm: false,
};

/**
 * Async thunk to send a chat message and process via AI.
 */
export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { message, conversationId }: { message: string; conversationId?: string },
    { rejectWithValue }
  ) => {
    try {
      const request: ChatRequest = {
        message,
        conversation_id: conversationId,
      };
      const response = await apiService.sendChatMessage(request);
      return { response, conversationId };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Failed to process chat message';
      return rejectWithValue(errorMessage);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Add a user message to the chat
    addUserMessage: {
      reducer: (state, action: PayloadAction<ChatMessage>) => {
        state.messages.push(action.payload);
      },
      prepare: (content: string) => ({
        payload: {
          id: uuidv4(),
          content,
          sender: 'user' as const,
          timestamp: new Date().toISOString(),
        },
      }),
    },

    // Add an AI response message
    addAIMessage: {
      reducer: (state, action: PayloadAction<ChatMessage>) => {
        state.messages.push(action.payload);
      },
      prepare: (
        content: string,
        extractedData?: AIExtractedData | null
      ) => ({
        payload: {
          id: uuidv4(),
          content,
          sender: 'ai' as const,
          timestamp: new Date().toISOString(),
          extracted_data: extractedData,
        },
      }),
    },

    // Set the extracted data from AI
    setExtractedData: (state, action: PayloadAction<AIExtractedData | null>) => {
      state.extractedData = action.payload;
      state.showForm = action.payload !== null;
    },

    // Show the populated form
    showFormPanel: (state) => {
      state.showForm = true;
    },

    // Hide the form panel
    hideFormPanel: (state) => {
      state.showForm = false;
    },

    // Clear chat history
    clearChat: (state) => {
      state.messages = [];
      state.extractedData = null;
      state.showForm = false;
      state.error = null;
      state.currentConversationId = null;
    },

    // Clear any errors
    clearError: (state) => {
      state.error = null;
    },

    // Reset to initial state
    resetChat: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Send message pending
      .addCase(sendChatMessage.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      // Send message fulfilled
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.isProcessing = false;
        const { response, conversationId } = action.payload;

        // Store conversation ID for context
        if (response.conversation_id) {
          state.currentConversationId = response.conversation_id;
        }

        if (response.success && response.extracted_data) {
          state.extractedData = response.extracted_data;
          state.showForm = true;

          // Add AI response message with extracted data
          const aiMsg: ChatMessage = {
            id: uuidv4(),
            content: response.message || 'I\'ve extracted the information from your message. Please review and edit the form.',
            sender: 'ai',
            timestamp: new Date().toISOString(),
            extracted_data: response.extracted_data,
          };
          state.messages.push(aiMsg);
        } else {
          // Add error message from AI
          const errorMsg: ChatMessage = {
            id: uuidv4(),
            content: response.message || 'I couldn\'t extract structured information from your message. Please try again with more details.',
            sender: 'ai',
            timestamp: new Date().toISOString(),
          };
          state.messages.push(errorMsg);
        }
      })
      // Send message rejected
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;

        const errorMsg: ChatMessage = {
          id: uuidv4(),
          content: `Error: ${action.payload || 'Failed to process your message. Please try again.'}`,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        };
        state.messages.push(errorMsg);
      });
  },
});

export const {
  addUserMessage,
  addAIMessage,
  setExtractedData,
  showFormPanel,
  hideFormPanel,
  clearChat,
  clearError,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;