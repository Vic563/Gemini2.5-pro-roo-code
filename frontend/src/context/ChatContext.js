import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Initial state
const initialState = {
  messages: [],
  conversationId: null,
  isLoading: false,
  isTyping: false,
  error: null,
  attachments: [],
  uploadingFiles: false,
  fileUploadProgress: {},
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_TYPING: 'SET_TYPING',
  SET_ERROR: 'SET_ERROR',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_MESSAGES: 'SET_MESSAGES',
  SET_CONVERSATION_ID: 'SET_CONVERSATION_ID',
  CLEAR_CONVERSATION: 'CLEAR_CONVERSATION',
  ADD_ATTACHMENT: 'ADD_ATTACHMENT',
  REMOVE_ATTACHMENT: 'REMOVE_ATTACHMENT',
  CLEAR_ATTACHMENTS: 'CLEAR_ATTACHMENTS',
  SET_UPLOADING_FILES: 'SET_UPLOADING_FILES',
  SET_FILE_UPLOAD_PROGRESS: 'SET_FILE_UPLOAD_PROGRESS',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
};

// Reducer function
function chatReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ActionTypes.SET_TYPING:
      return { ...state, isTyping: action.payload };
    
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    
    case ActionTypes.ADD_MESSAGE:
      return { 
        ...state, 
        messages: [...state.messages, action.payload],
        error: null 
      };
    
    case ActionTypes.SET_MESSAGES:
      return { ...state, messages: action.payload };
    
    case ActionTypes.SET_CONVERSATION_ID:
      return { ...state, conversationId: action.payload };
    
    case ActionTypes.CLEAR_CONVERSATION:
      return { 
        ...state, 
        messages: [], 
        conversationId: null, 
        error: null,
        attachments: []
      };
    
    case ActionTypes.ADD_ATTACHMENT:
      return { 
        ...state, 
        attachments: [...state.attachments, action.payload] 
      };
    
    case ActionTypes.REMOVE_ATTACHMENT:
      return { 
        ...state, 
        attachments: state.attachments.filter(att => att.id !== action.payload) 
      };
    
    case ActionTypes.CLEAR_ATTACHMENTS:
      return { ...state, attachments: [] };
    
    case ActionTypes.SET_UPLOADING_FILES:
      return { ...state, uploadingFiles: action.payload };
    
    case ActionTypes.SET_FILE_UPLOAD_PROGRESS:
      return { 
        ...state, 
        fileUploadProgress: { 
          ...state.fileUploadProgress, 
          [action.payload.fileId]: action.payload.progress 
        } 
      };
    
    case ActionTypes.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id 
            ? { ...msg, ...action.payload.updates }
            : msg
        )
      };
    
    default:
      return state;
  }
}

// Create context
const ChatContext = createContext();

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Chat provider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Action creators
  const setLoading = useCallback((loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  }, []);

  const setTyping = useCallback((typing) => {
    dispatch({ type: ActionTypes.SET_TYPING, payload: typing });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: ActionTypes.SET_ERROR, payload: error });
  }, []);

  const addMessage = useCallback((message) => {
    dispatch({ type: ActionTypes.ADD_MESSAGE, payload: message });
  }, []);

  const setMessages = useCallback((messages) => {
    dispatch({ type: ActionTypes.SET_MESSAGES, payload: messages });
  }, []);

  const setConversationId = useCallback((id) => {
    dispatch({ type: ActionTypes.SET_CONVERSATION_ID, payload: id });
  }, []);

  const clearConversation = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_CONVERSATION });
  }, []);

  const addAttachment = useCallback((attachment) => {
    dispatch({ type: ActionTypes.ADD_ATTACHMENT, payload: attachment });
  }, []);

  const removeAttachment = useCallback((attachmentId) => {
    dispatch({ type: ActionTypes.REMOVE_ATTACHMENT, payload: attachmentId });
  }, []);

  const clearAttachments = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ATTACHMENTS });
  }, []);

  const setUploadingFiles = useCallback((uploading) => {
    dispatch({ type: ActionTypes.SET_UPLOADING_FILES, payload: uploading });
  }, []);

  const setFileUploadProgress = useCallback((fileId, progress) => {
    dispatch({ 
      type: ActionTypes.SET_FILE_UPLOAD_PROGRESS, 
      payload: { fileId, progress } 
    });
  }, []);

  const updateMessage = useCallback((messageId, updates) => {
    dispatch({ 
      type: ActionTypes.UPDATE_MESSAGE, 
      payload: { id: messageId, updates } 
    });
  }, []);

  // API functions
  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() && state.attachments.length === 0) {
      return;
    }

    setError(null);
    setLoading(true);
    setTyping(true);

    // Create user message
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: messageText.trim(),
      attachments: state.attachments,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText.trim(),
          conversationId: state.conversationId,
          attachments: state.attachments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Set conversation ID if new conversation
      if (data.conversationId && !state.conversationId) {
        setConversationId(data.conversationId);
      }

      // Add AI response
      if (data.assistantMessage) {
        addMessage(data.assistantMessage);
      }

      // Clear attachments after successful send
      clearAttachments();

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  }, [state.attachments, state.conversationId, addMessage, setLoading, setTyping, setError, setConversationId, clearAttachments]);

  const uploadFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    setError(null);

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files');
      }

      // Add uploaded files as attachments
      if (data.files && data.files.length > 0) {
        data.files.forEach(file => {
          addAttachment({
            id: file.id,
            filename: file.originalName,
            fileType: file.fileType,
            size: file.size,
            formattedSize: file.formattedSize,
            content: file.content,
            wordCount: file.wordCount,
          });
        });
      }

      // Handle any errors
      if (data.errors && data.errors.length > 0) {
        const errorMessages = data.errors.map(err => `${err.filename}: ${err.error || err.errors?.join(', ')}`);
        setError(`Some files could not be processed: ${errorMessages.join('; ')}`);
      }

    } catch (error) {
      console.error('Error uploading files:', error);
      setError(error.message);
    } finally {
      setUploadingFiles(false);
    }
  }, [addAttachment, setUploadingFiles, setError]);

  const loadConversation = useCallback(async (conversationId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/chat/conversation/${conversationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load conversation');
      }

      if (data.conversation) {
        setMessages(data.conversation.messages);
        setConversationId(data.conversation.id);
      }

    } catch (error) {
      console.error('Error loading conversation:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setMessages, setConversationId]);

  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    setLoading,
    setTyping,
    setError,
    addMessage,
    setMessages,
    setConversationId,
    clearConversation,
    addAttachment,
    removeAttachment,
    clearAttachments,
    setUploadingFiles,
    setFileUploadProgress,
    updateMessage,
    
    // API functions
    sendMessage,
    uploadFiles,
    loadConversation,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;