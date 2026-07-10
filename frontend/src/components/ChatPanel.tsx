import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Collapse,
  Card,
  CardContent,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  sendChatMessage,
  addUserMessage,
  clearChat,
} from '@/redux/chatSlice';
import { SUGGESTED_PROMPTS } from '@/types';

const ChatPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { messages, isProcessing, currentConversationId } = useAppSelector(
    (state) => state.chat
  );
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isProcessing) return;

    setInput('');
    setShowSuggestions(false);

    // Add user message to chat
    dispatch(addUserMessage(message));

    // Send to AI
    dispatch(
      sendChatMessage({
        message,
        conversationId: currentConversationId || undefined,
      })
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    dispatch(clearChat());
    setShowSuggestions(true);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main', width: 32, height: 32 }}>
            <SmartToyIcon sx={{ fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
              AI Assistant
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
              Log interaction details here via chat
            </Typography>
          </Box>
        </Box>
        {messages.length > 0 && (
          <Tooltip title="Clear chat">
            <IconButton
              size="small"
              sx={{ color: 'white' }}
              onClick={handleClearChat}
            >
              <DeleteSweepIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Welcome Message */}
        {messages.length === 0 && (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              px: 2,
            }}
          >
            <SmartToyIcon
              sx={{ fontSize: 64, color: 'primary.light', mb: 2 }}
            />
            <Typography variant="h6" sx={{ mb: 1 }}>
              How can I help you?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Describe your interaction with a doctor naturally, and I'll
              extract the details to populate the form.
            </Typography>
            <Chip
              icon={<AutoAwesomeIcon />}
              label="Powered by LangGraph + Groq LLM"
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        )}

        {/* Message List */}
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              gap: 1,
            }}
          >
            {msg.sender === 'ai' && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  mt: 0.5,
                }}
              >
                <SmartToyIcon sx={{ fontSize: 18 }} />
              </Avatar>
            )}
            <Box
              sx={{
                maxWidth: '80%',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor:
                    msg.sender === 'user' ? 'primary.main' : 'white',
                  color:
                    msg.sender === 'user' ? 'white' : 'text.primary',
                  border:
                    msg.sender === 'ai'
                      ? '1px solid'
                      : 'none',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
                {msg.extracted_data && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}
                    >
                      <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                      Extracted Data Available
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {msg.extracted_data.doctor_name && (
                        <Chip
                          label={`Dr: ${msg.extracted_data.doctor_name}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ height: 22, fontSize: 11 }}
                        />
                      )}
                      {msg.extracted_data.hospital && (
                        <Chip
                          label={`Hosp: ${msg.extracted_data.hospital}`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                          sx={{ height: 22, fontSize: 11 }}
                        />
                      )}
                      {msg.extracted_data.confidence_score && (
                        <Chip
                          label={`Confidence: ${(msg.extracted_data.confidence_score * 100).toFixed(0)}%`}
                          size="small"
                          variant="outlined"
                          color={
                            msg.extracted_data.confidence_score > 0.8
                              ? 'success'
                              : 'warning'
                          }
                          sx={{ height: 22, fontSize: 11 }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </Paper>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', mt: 0.5, px: 1 }}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Box>
            {msg.sender === 'user' && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  mt: 0.5,
                }}
              >
                <PersonIcon sx={{ fontSize: 18 }} />
              </Avatar>
            )}
          </Box>
        ))}

        {/* Typing Indicator */}
        {isProcessing && (
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
                bgcolor: 'primary.main',
              }}
            >
              <SmartToyIcon sx={{ fontSize: 18 }} />
            </Avatar>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'white',
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={16} color="primary" />
              <Typography variant="body2" color="text.secondary">
                Analyzing your message...
              </Typography>
            </Paper>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Suggested Prompts */}
      <Collapse in={showSuggestions && messages.length === 0}>
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 1,
            }}
          >
            <TipsAndUpdatesIcon sx={{ fontSize: 16, color: 'warning.main' }} />
            <Typography variant="caption" color="text.secondary">
              Try these examples:
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {SUGGESTED_PROMPTS.map((prompt) => (
              <Chip
                key={prompt.label}
                label={prompt.label}
                size="small"
                variant="outlined"
                onClick={() => handleSuggestedPrompt(prompt.text)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'primary.light',
                    color: 'white',
                    borderColor: 'primary.light',
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Collapse>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            inputRef={inputRef}
            placeholder="Log interaction details here (e.g., 'Met Dr. Smith, discussed Product X efficiency, positive sentiment, shared brochure') or ask for help."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={3}
            size="small"
            disabled={isProcessing}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'grey.50',
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            sx={{
              alignSelf: 'flex-end',
              bgcolor: input.trim() ? 'primary.main' : 'grey.300',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&.Mui-disabled': {
                bgcolor: 'grey.300',
                color: 'grey.500',
              },
            }}
          >
            {isProcessing ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};

export default ChatPanel;