"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  TextField,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Avatar,
  Fade,
  Slide,
  Zoom,
  Tooltip,
  Badge,
  Stack,
  LinearProgress
} from "@mui/material";
import { 
  Psychology, 
  Send, 
  Save, 
  Delete, 
  Edit, 
  PlayArrow, 
  Stop, 
  Timer,
  TrendingUp,
  FitnessCenter,
  CameraAlt,
  CheckCircle,
  Warning,
  Info,
  Person,
  SmartToy,
  ArrowBack,
  Add,
  Chat,
  Mic,
  GraphicEq,
  MoreVert,
  AttachFile,
  EmojiEmotions,
  Lightbulb,
  Favorite,
  Share,
  Archive,
  Refresh
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import aiService from "@/utils/aiService";
import HealthDataService from "@/utils/healthDataService";
import { useUser } from "@/utils/supabaseClient";
import BackButton from "@/components/BackButton";

// Type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export default function TherapistChatPage() {
  // Add CSS animation for typing indicator
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes typing {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.4;
        }
        30% {
          transform: translateY(-10px);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceChat, setIsVoiceChat] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastSavedMessage, setLastSavedMessage] = useState<string>("");
  const [lastUserState, setLastUserState] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const healthDataService = new HealthDataService();
  const { user, loading: userLoading } = useUser();

  // Debug user state changes
  useEffect(() => {
    console.log('👤 User state changed:', {
      user: user ? `logged-in-${user.id}` : 'not-logged-in',
      userLoading,
      chatSessionsCount: chatSessions.length,
      currentChatId: currentChat?.id
    });
  }, [user, userLoading, chatSessions.length, currentChat?.id]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new window.webkitSpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [isVoiceChat]);

  async function generateResponse(userMessage: string) {
    if (!currentChat) return;

    setLoading(true);
    setIsTyping(true);

    try {
      // Ensure user message is in the chat before generating response
      const userMessageExists = currentChat.messages.some(msg => 
        msg.text === userMessage && msg.sender === 'user'
      );

      let chatWithUserMessage = currentChat;
      if (!userMessageExists) {
        const userMessageObj: Message = {
          id: Date.now().toString(),
          text: userMessage,
          sender: "user",
          timestamp: new Date()
        };

        chatWithUserMessage = {
          ...currentChat,
          messages: [...currentChat.messages, userMessageObj],
          title: currentChat.messages.length === 0 ? userMessage.slice(0, 30) + "..." : currentChat.title,
          updatedAt: new Date()
        };

        setCurrentChat(chatWithUserMessage);
        setChatSessions(prev => 
          prev.map(chat => 
            chat.id === chatWithUserMessage.id ? chatWithUserMessage : chat
          )
        );
      }

      // Prepare conversation history for AI context
      const conversationHistory = chatWithUserMessage.messages.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      // Use AI service to generate response
      const result = await aiService.sendTherapistMessage(userMessage, conversationHistory);

      if (!result.success) {
        throw new Error(result.error || 'Failed to get AI response');
      }

      // Create AI message
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: result.response || "I'm here to listen and support you. How are you feeling today?",
        sender: "ai",
        timestamp: new Date()
      };

      // Update chat with AI message
      const updatedChat = {
        ...chatWithUserMessage,
        messages: [...chatWithUserMessage.messages, aiMessage],
        updatedAt: new Date()
      };

      setCurrentChat(updatedChat);
      setChatSessions(prev => 
        prev.map(chat => 
          chat.id === updatedChat.id ? updatedChat : chat
        )
      );

    } catch (error) {
      console.error('Error generating response:', error);
      
      // Ensure user message is visible even if AI fails
      const userMessageExists = currentChat.messages.some(msg => 
        msg.text === userMessage && msg.sender === 'user'
      );

      let finalChat = currentChat;
      if (!userMessageExists) {
        const userMessageObj: Message = {
          id: Date.now().toString(),
          text: userMessage,
          sender: "user",
          timestamp: new Date()
        };

        finalChat = {
          ...currentChat,
          messages: [...currentChat.messages, userMessageObj],
          title: currentChat.messages.length === 0 ? userMessage.slice(0, 30) + "..." : currentChat.title,
          updatedAt: new Date()
        };

        setCurrentChat(finalChat);
        setChatSessions(prev => 
          prev.map(chat => 
            chat.id === finalChat.id ? finalChat : chat
          )
        );
      }
      
      // Fallback message
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        text: "I'm having trouble connecting right now, but I'm still here for you. Please make sure your OpenRouter API key is configured, or try again in a moment.",
        sender: "ai",
        timestamp: new Date()
      };
      const updatedChat = {
        ...finalChat,
        messages: [...finalChat.messages, fallbackMessage],
        updatedAt: new Date()
      };

      setCurrentChat(updatedChat);
      setChatSessions(prev => 
        prev.map(chat => 
          chat.id === updatedChat.id ? updatedChat : chat
        )
      );
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  }

  // Removed problematic useEffect that was causing auto-sending messages

  function handleVoiceMessage(message: string) {
    if (!currentChat) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date()
    };

    // Update chat with user message
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage],
      title: currentChat.messages.length === 0 ? message.slice(0, 30) + "..." : currentChat.title,
      updatedAt: new Date()
    };

    // Always save and display user message immediately
    setCurrentChat(updatedChat);
    setChatSessions(prev => 
      prev.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      )
    );

    // Force immediate save to localStorage for voice messages (only for logged-in users)
    try {
      if (user && !userLoading) {
        console.log('Saving voice message to localStorage for logged-in user...');
        const updatedSessions = chatSessions.map(chat => 
          chat.id === updatedChat.id ? updatedChat : chat
        );
        localStorage.setItem('therapist-chats', JSON.stringify(updatedSessions));
        setLastSavedMessage(message);
        console.log('Voice message saved immediately:', message);
        
        // Clear the saved message indicator after 3 seconds
        setTimeout(() => {
          setLastSavedMessage("");
        }, 3000);
      } else {
        // Guest users or loading - no saving, just display the message
        console.log('Guest user or loading - voice message not saved to any storage');
      }
    } catch (error) {
      console.error('Failed to save voice message:', error);
    }

    // Generate AI response
    generateResponse(message);
  }

  // Load chats from localStorage on component mount and create new chat
  useEffect(() => {
    console.log('Load useEffect triggered - User loading state:', userLoading, 'User:', user ? 'logged in' : 'not logged in');
    
    // Don't initialize if still loading user
    if (userLoading) {
      console.log('Still loading user, skipping initialization');
      return;
    }
    
    // Create a unique key for the current user state
    const currentUserState = user ? `logged-in-${user.id}` : 'guest';
    
    // Only re-initialize if user state has changed
    if (currentUserState === lastUserState && chatSessions.length > 0) {
      console.log('User state unchanged and chats already loaded, skipping initialization');
      return;
    }
    
    console.log('User state changed or no chats loaded, initializing...');
    setLastUserState(currentUserState);
    
    // Only load saved chats for logged-in users
    if (user) {
      try {
        console.log('Loading therapist chats for logged-in user...');
        const savedChats = localStorage.getItem('therapist-chats');
        console.log('Raw localStorage data:', savedChats ? 'exists' : 'null');
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats).map((chat: ChatSession) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            updatedAt: new Date(chat.updatedAt),
            messages: chat.messages.map((msg: Message) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          setChatSessions(parsedChats);
          console.log('✅ Loaded', parsedChats.length, 'chat sessions from localStorage for logged-in user');
          console.log('📝 Chat titles:', parsedChats.map((chat: ChatSession) => chat.title));
          
          // Log the first few messages of each chat for debugging
          parsedChats.forEach((chat: ChatSession, index: number) => {
            console.log(`Chat ${index + 1} (${chat.title}):`, chat.messages.length, 'messages');
            if (chat.messages.length > 0) {
              console.log('  First message:', chat.messages[0].text.substring(0, 50) + '...');
              console.log('  Last message:', chat.messages[chat.messages.length - 1].text.substring(0, 50) + '...');
            }
          });
          
          // Clean up empty chats after loading
          setTimeout(() => {
            const emptyChats = parsedChats.filter((chat: ChatSession) =>
              chat.messages.length === 0 || 
              (chat.messages.length === 1 && chat.messages[0].sender === 'ai')
            );
            
            emptyChats.forEach((chat: ChatSession) => {
              deleteChat(chat.id);
            });
          }, 1000);
          
          // Create a new chat for logged-in users after loading existing chats
          const newChat: ChatSession = {
            id: Date.now().toString(),
            title: "New Chat",
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Add new chat to the beginning of the list and set as current
          const updatedChatSessions = [newChat, ...parsedChats];
          setChatSessions(updatedChatSessions);
          setCurrentChat(newChat);
          
          // Verify localStorage usage after loading
          setTimeout(() => {
            verifyLocalStorageUsage();
          }, 500);
        } else {
          // Create a new chat if no saved chats exist
          const newChat: ChatSession = {
            id: Date.now().toString(),
            title: "New Chat",
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          setChatSessions([newChat]);
          setCurrentChat(newChat);
        }
      } catch (error) {
        console.error('Error loading therapist chats from localStorage:', error);
        // Create a new chat if loading fails
        const newChat: ChatSession = {
          id: Date.now().toString(),
          title: "New Chat",
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setChatSessions([newChat]);
        setCurrentChat(newChat);
      }
    } else {
      // For guest users, create a new temporary chat that won't be saved
      console.log('Creating temporary chat for guest user');
      const newChat: ChatSession = {
        id: Date.now().toString(),
        title: "Temporary Chat (Not Saved)",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setChatSessions([newChat]);
      setCurrentChat(newChat);
    }
    
    // Focus on input after initialization
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [user, userLoading, lastUserState, chatSessions.length]);

  // Save chats to localStorage whenever they change - with error handling
  useEffect(() => {
    console.log('Save useEffect triggered - User:', user ? 'logged in' : 'not logged in', 'Chat sessions:', chatSessions.length);
    
    // Only save chats for logged-in users
    if (user && !userLoading && chatSessions.length > 0) {
      try {
        console.log('💾 Saving therapist chats to localStorage for logged-in user...');
        localStorage.setItem('therapist-chats', JSON.stringify(chatSessions));
        console.log('✅ Successfully saved', chatSessions.length, 'chat sessions to localStorage');
        console.log('📝 Saved chat titles:', chatSessions.map((chat: ChatSession) => chat.title));
      } catch (error) {
        console.error('Failed to save chats to localStorage:', error);
      }
    } else if (user && !userLoading && chatSessions.length === 0) {
      // Clear localStorage if user is logged in but has no chats
      try {
        localStorage.removeItem('therapist-chats');
        console.log('Cleared therapist chats from localStorage for logged-in user');
      } catch (error) {
        console.error('Failed to clear chats from localStorage:', error);
      }
    } else if (!user || userLoading) {
      // Guest users or still loading - no saving allowed
      console.log('Guest user or loading - chat sessions not saved to localStorage');
    }
  }, [chatSessions, user, userLoading]);

  // Scroll to bottom when new messages are added (but not during typing)
  useEffect(() => {
    if (currentChat?.messages.length && !isTyping) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentChat?.messages, isTyping]);

  function ensureUserMessageVisible(message: string) {
    if (!currentChat) return;
    
    // Check if the message is already in the chat
    const messageExists = currentChat.messages.some(msg => 
      msg.text === message && msg.sender === 'user'
    );
    
    if (!messageExists) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: message,
        sender: "user",
        timestamp: new Date()
      };

      const updatedChat = {
        ...currentChat,
        messages: [...currentChat.messages, userMessage],
        updatedAt: new Date()
      };

      setCurrentChat(updatedChat);
      setChatSessions(prev => 
        prev.map(chat => 
          chat.id === updatedChat.id ? updatedChat : chat
        )
      );
      
      console.log('User message ensured visible:', message);
    }
  }

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: user ? "New Chat" : "Temporary Chat (Not Saved)",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChatSessions(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    setInputText("");
    
    // Focus on input after creating new chat
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const selectChat = (chat: ChatSession) => {
    setCurrentChat(chat);
    setInputText("");
  };

  const deleteChat = (chatId: string) => {
    // Remove from state
    setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(chatSessions.find(chat => chat.id !== chatId) || null);
    }
    
    // Remove from localStorage (only for logged-in users)
    if (user && !userLoading) {
      try {
        console.log('Deleting chat from localStorage for logged-in user...');
        const savedChats = localStorage.getItem('therapist-chats');
        if (savedChats) {
          const parsedChats = JSON.parse(savedChats);
          const filteredChats = parsedChats.filter((chat: ChatSession) => chat.id !== chatId);
          localStorage.setItem('therapist-chats', JSON.stringify(filteredChats));
          console.log('Successfully deleted chat from localStorage');
        }
      } catch (error) {
        console.error('Failed to delete chat from localStorage:', error);
      }
    } else {
      console.log('Guest user or loading - chat deletion not saved to localStorage');
    }
    
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  };

  // Function to automatically delete empty chats
  const cleanupEmptyChats = () => {
    const emptyChats = chatSessions.filter(chat => 
      chat.messages.length === 0 || 
      (chat.messages.length === 1 && chat.messages[0].sender === 'ai')
    );
    
    emptyChats.forEach(chat => {
      deleteChat(chat.id);
    });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentChat || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
      timestamp: new Date()
    };

    // Immediately update chat with user message (always display user input)
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, userMessage],
      title: currentChat.messages.length === 0 ? inputText.slice(0, 30) + "..." : currentChat.title,
      updatedAt: new Date()
    };

    // Always save and display user message immediately
    setCurrentChat(updatedChat);
    setChatSessions(prev => 
      prev.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      )
    );

    // Clear input immediately after sending
    const messageText = inputText.trim();
    setInputText("");
    
    // Force immediate save to localStorage for logged-in users
    try {
      if (user && !userLoading) {
        // Save to localStorage immediately for logged-in users
        const updatedSessions = chatSessions.map(chat => 
          chat.id === updatedChat.id ? updatedChat : chat
        );
        localStorage.setItem('therapist-chats', JSON.stringify(updatedSessions));
        console.log('User message saved to localStorage immediately:', messageText);
        
        // Also try to save to database (but don't block on it)
        try {
          await healthDataService.saveTherapistChatSession({
            session_title: updatedChat.title,
            messages: updatedChat.messages,
            ai_model_used: 'openrouter',
            session_duration: 0,
            mood_score: undefined,
            tags: []
          });
          console.log('User message also saved to database');
        } catch (dbError) {
          console.warn('Database save failed, but localStorage save succeeded:', dbError);
        }
        
        setLastSavedMessage(messageText);
        // Clear the saved message indicator after 3 seconds
        setTimeout(() => {
          setLastSavedMessage("");
        }, 3000);
      } else {
        // Guest users or loading - no saving, just display the message
        console.log('Guest user or loading - message not saved to any storage');
      }
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Generate AI response
    await generateResponse(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript("");
    }
  };

  const toggleVoiceChat = () => {
    setIsVoiceChat(!isVoiceChat);
    if (isVoiceChat && isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
  };

  // Debug function to check saved messages
  const debugSavedMessages = () => {
    try {
      const saved = localStorage.getItem('therapist-chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🔍 DEBUG: Saved chats in localStorage:', parsed);
        console.log('🔍 DEBUG: Current chat sessions:', chatSessions);
        console.log('🔍 DEBUG: Current chat:', currentChat);
        console.log('🔍 DEBUG: User status:', user ? 'logged in' : 'not logged in');
        console.log('🔍 DEBUG: User loading:', userLoading);
        
        // Verify data integrity
        if (parsed.length !== chatSessions.length) {
          console.warn('⚠️ WARNING: localStorage and state have different numbers of chats!');
        }
        
        // Check if current chat is in localStorage
        if (currentChat) {
          const foundInStorage = parsed.find((chat: any) => chat.id === currentChat.id);
          if (!foundInStorage) {
            console.warn('⚠️ WARNING: Current chat not found in localStorage!');
          } else {
            console.log('✅ Current chat found in localStorage');
          }
        }
      } else {
        console.log('🔍 DEBUG: No saved chats found in localStorage');
      }
    } catch (error) {
      console.error('Error reading saved messages:', error);
    }
  };

  const clearAllChats = () => {
    if (user && !userLoading && confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
      try {
        console.log('🗑️ Clearing all therapist chats for logged-in user...');
        localStorage.removeItem('therapist-chats');
        setChatSessions([]);
        setCurrentChat(null);
        console.log('✅ All therapist chats cleared from localStorage');
      } catch (error) {
        console.error('Error clearing therapist chats:', error);
      }
    } else if (!user || userLoading) {
      console.log('Guest user or loading - cannot clear chat data');
    }
  };

  // Function to verify localStorage is being used correctly
  const verifyLocalStorageUsage = () => {
    if (!user || userLoading) {
      console.log('🔍 Verification skipped - user not logged in or still loading');
      return;
    }

    try {
      const saved = localStorage.getItem('therapist-chats');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('🔍 VERIFICATION: localStorage contains', parsed.length, 'chats');
        console.log('🔍 VERIFICATION: State contains', chatSessions.length, 'chats');
        
        if (parsed.length === chatSessions.length) {
          console.log('✅ VERIFICATION: localStorage and state are in sync');
        } else {
          console.warn('⚠️ VERIFICATION: localStorage and state are out of sync!');
        }
      } else {
        console.log('🔍 VERIFICATION: No data in localStorage');
      }
    } catch (error) {
      console.error('Error during verification:', error);
    }
  };

  // Function to manually load from localStorage
  const manualLoadFromLocalStorage = () => {
    if (!user || userLoading) {
      console.log('Manual load skipped - user not logged in or still loading');
      return;
    }

    try {
      console.log('🔄 MANUAL LOAD: Attempting to load from localStorage...');
      const savedChats = localStorage.getItem('therapist-chats');
      console.log('🔄 MANUAL LOAD: Raw localStorage data:', savedChats ? 'exists' : 'null');
      
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats).map((chat: ChatSession) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        
        setChatSessions(parsedChats);
        setCurrentChat(parsedChats[0]);
        console.log('✅ MANUAL LOAD: Successfully loaded', parsedChats.length, 'chats from localStorage');
      } else {
        console.log('🔄 MANUAL LOAD: No data found in localStorage');
      }
    } catch (error) {
      console.error('Error during manual load:', error);
    }
  };



  return (
    <Box sx={{ 
      height: user ? "calc(100vh - 120px)" : "100vh", 
      display: "flex", 
      background: "#f7f7f8",
      position: "relative",
      mt: user ? 2 : 0
    }}>
      {/* Back Button for logged-out users */}
      {!user && (
        <Box sx={{ position: "absolute", top: -60, left: 0, zIndex: 10 }}>
          <BackButton href="/health-tools" label="Back to Health Tools" />
        </Box>
      )}
      
      {/* Notice for logged-out users */}
      {!user && (
        <Box sx={{ position: "absolute", top: -30, left: 0, right: 0, zIndex: 10, px: 2 }}>
          <Alert severity="warning" sx={{ fontSize: '12px', py: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '12px' }}>
              <strong>⚠️ Guest User Notice:</strong> Chat sessions are NOT saved and will be lost when you leave this page. 
              You can use the therapist chat feature to test it, but your conversations will not be preserved.
              <Link href="/register" style={{ color: '#1976d2', textDecoration: 'none', marginLeft: '4px' }}>
                Sign up to save your conversations permanently!
              </Link>
            </Typography>
          </Alert>
        </Box>
      )}
      {/* Sidebar - Chat History */}
      <Box
        sx={{
          width: "280px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(123, 97, 255, 0.2)",
          display: "flex",
          flexDirection: "column",
          borderRadius: "12px 0 0 12px",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          background: "linear-gradient(135deg, #E573B7, #7B61FF)",
          color: "white"
        }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Psychology sx={{ fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Therapist Chat
              </Typography>
            </Box>
            {process.env.NODE_ENV === 'development' && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={debugSavedMessages}
                  sx={{
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "white",
                    "&:hover": {
                      borderColor: "white",
                      background: "rgba(255, 255, 255, 0.1)",
                    },
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "12px"
                  }}
                >
                  Debug
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={verifyLocalStorageUsage}
                  sx={{
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "white",
                    "&:hover": {
                      borderColor: "white",
                      background: "rgba(255, 255, 255, 0.1)",
                    },
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "12px"
                  }}
                >
                  Verify
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={manualLoadFromLocalStorage}
                  sx={{
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    color: "white",
                    "&:hover": {
                      borderColor: "white",
                      background: "rgba(255, 255, 255, 0.1)",
                    },
                    textTransform: "none",
                    fontWeight: 500,
                    fontSize: "12px"
                  }}
                >
                  Load
                </Button>
              </Box>
            )}
          </Box>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Add />}
            onClick={createNewChat}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.3)",
              color: "white",
              "&:hover": {
                borderColor: "white",
                background: "rgba(255, 255, 255, 0.1)",
              },
              py: 1.5,
              borderRadius: 1,
              textTransform: "none",
              fontWeight: 500,
              justifyContent: "flex-start"
            }}
          >
            New chat
          </Button>
        </Box>
        
        <Divider sx={{ borderColor: "rgba(123, 97, 255, 0.2)" }} />
        
        {/* Chat History */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, px: 1 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: "#7B61FF", 
                fontSize: "12px", 
                fontWeight: 600
              }}
            >
              CHATS
            </Typography>
            {user && !userLoading && (
              <Chip
                label="Local Storage"
                size="small"
                color="success"
                sx={{
                  fontSize: '10px',
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '10px'
                  }
                }}
              />
            )}
          </Box>
          {chatSessions.map((chat) => (
            <Box
              key={chat.id}
              onClick={() => selectChat(chat)}
              sx={{
                p: 1.5,
                borderRadius: 1,
                mb: 1,
                cursor: "pointer",
                background: currentChat?.id === chat.id ? "rgba(123, 97, 255, 0.1)" : "transparent",
                "&:hover": {
                  background: "rgba(123, 97, 255, 0.1)",
                },
                display: "flex",
                alignItems: "center",
                gap: 1
              }}
            >
              <Chat sx={{ fontSize: 16, color: "#7B61FF" }} />
              <Typography
                variant="body2"
                sx={{
                  color: "#333",
                  fontWeight: currentChat?.id === chat.id ? 600 : 400,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: "14px"
                }}
              >
                {chat.title}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setChatToDelete(chat.id);
                  setDeleteDialogOpen(true);
                }}
                sx={{
                  color: "transparent",
                  p: 0.5,
                  "&:hover": {
                    color: "#f44336",
                    background: "rgba(244, 67, 54, 0.1)",
                  },
                }}
              >
                <Delete sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Main Chat Area */}
      <Box sx={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        background: "#ffffff",
        borderRadius: "0 12px 12px 0"
      }}>
        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: "auto", 
          display: "flex",
          flexDirection: "column"
        }}>
          {!currentChat ? (
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              height: "100%",
              textAlign: "center",
              p: 4
            }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 600, 
                  mb: 2, 
                  color: "#333",
                  fontSize: "32px"
                }}
              >
                What are you working on?
              </Typography>
            </Box>
                      ) : currentChat.messages.length === 0 ? (
            <Box sx={{ 
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center", 
              height: "100%",
              textAlign: "center",
              p: 4
            }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: "linear-gradient(135deg, #10a37f, #7B61FF)",
                    color: "white",
                    fontSize: "32px",
                    mb: 3,
                    boxShadow: "0 8px 32px rgba(16, 163, 127, 0.3)"
                  }}
                >
                  <Psychology />
                </Avatar>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 2, 
                    color: "#333",
                    fontSize: "32px"
                  }}
                >
                  Welcome to Therapy Chat
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: "#666", 
                    mb: 4, 
                    maxWidth: "500px",
                    lineHeight: 1.6
                  }}
                >
                  I'm Dr. Sarah, your AI therapist. I'm here to listen, support, and help you work through whatever's on your mind. 
                  Let's start a conversation about what you'd like to explore today.
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                  <Chip
                    label="Feeling anxious?"
                    onClick={() => setInputText("I've been feeling anxious lately...")}
                    sx={{
                      background: "rgba(123, 97, 255, 0.1)",
                      color: "#7B61FF",
                      border: "1px solid rgba(123, 97, 255, 0.3)",
                      cursor: "pointer",
                      "&:hover": {
                        background: "rgba(123, 97, 255, 0.2)",
                      }
                    }}
                  />
                  <Chip
                    label="Work stress?"
                    onClick={() => setInputText("I'm dealing with a lot of stress at work...")}
                    sx={{
                      background: "rgba(123, 97, 255, 0.1)",
                      color: "#7B61FF",
                      border: "1px solid rgba(123, 97, 255, 0.3)",
                      cursor: "pointer",
                      "&:hover": {
                        background: "rgba(123, 97, 255, 0.2)",
                      }
                    }}
                  />
                  <Chip
                    label="Relationship issues?"
                    onClick={() => setInputText("I'm having some relationship difficulties...")}
                    sx={{
                      background: "rgba(123, 97, 255, 0.1)",
                      color: "#7B61FF",
                      border: "1px solid rgba(123, 97, 255, 0.3)",
                      cursor: "pointer",
                      "&:hover": {
                        background: "rgba(123, 97, 255, 0.2)",
                      }
                    }}
                  />
                  <Chip
                    label="Just need to talk"
                    onClick={() => setInputText("I just need someone to talk to...")}
                    sx={{
                      background: "rgba(123, 97, 255, 0.1)",
                      color: "#7B61FF",
                      border: "1px solid rgba(123, 97, 255, 0.3)",
                      cursor: "pointer",
                      "&:hover": {
                        background: "rgba(123, 97, 255, 0.2)",
                      }
                    }}
                  />
                </Box>
              </motion.div>
            </Box>
          ) : (
            <>
              <AnimatePresence>
                {currentChat.messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 3,
                        p: 4,
                        background: message.sender === "user" ? "#f8f9ff" : "#ffffff",
                        borderBottom: "1px solid #e5e5e5",
                        position: "relative",
                        "&:hover": {
                          background: message.sender === "user" ? "#f0f2ff" : "#fafafa"
                        }
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          background: message.sender === "user" ? "#7B61FF" : "#10a37f",
                          color: "white",
                          fontSize: "16px",
                          flexShrink: 0,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}
                      >
                        {message.sender === "user" ? <Person /> : <Psychology />}
                      </Avatar>
                      <Box sx={{ flex: 1, maxWidth: "800px", mx: "auto" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: message.sender === "user" ? "#7B61FF" : "#10a37f",
                              fontSize: "14px"
                            }}
                          >
                            {message.sender === "user" ? "You" : "Dr. Sarah"}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#666",
                              fontSize: "12px"
                            }}
                          >
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            background: message.sender === "user" ? "#7B61FF" : "#f8f9fa",
                            color: message.sender === "user" ? "white" : "#374151",
                            borderRadius: 2,
                            border: message.sender === "user" ? "none" : "1px solid #e5e5e5",
                            maxWidth: "100%",
                            wordWrap: "break-word"
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                              fontSize: "15px",
                              fontWeight: message.sender === "user" ? 500 : 400
                            }}
                          >
                            {message.text}
                          </Typography>
                        </Paper>
                        {message.sender === "ai" && (
                          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                            <Tooltip title="Helpful">
                              <IconButton size="small" sx={{ color: "#666", p: 0.5 }}>
                                <Lightbulb sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Like">
                              <IconButton size="small" sx={{ color: "#666", p: 0.5 }}>
                                <Favorite sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Share">
                              <IconButton size="small" sx={{ color: "#666", p: 0.5 }}>
                                <Share sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </motion.div>
                ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 3,
                      p: 4,
                      background: "#ffffff",
                      borderBottom: "1px solid #e5e5e5"
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        background: "#10a37f",
                        color: "white",
                        fontSize: "16px",
                        flexShrink: 0,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                    >
                      <Psychology />
                    </Avatar>
                    <Box sx={{ flex: 1, maxWidth: "800px", mx: "auto" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: "#10a37f",
                            fontSize: "14px"
                          }}
                        >
                          Dr. Sarah
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#666",
                            fontSize: "12px"
                          }}
                        >
                          is typing...
                        </Typography>
                      </Box>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          background: "#f8f9fa",
                          borderRadius: 2,
                          border: "1px solid #e5e5e5",
                          maxWidth: "100px"
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "#10a37f",
                              animation: "typing 1.4s infinite ease-in-out"
                            }}
                          />
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "#10a37f",
                              animation: "typing 1.4s infinite ease-in-out",
                              animationDelay: "0.2s"
                            }}
                          />
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "#10a37f",
                              animation: "typing 1.4s infinite ease-in-out",
                              animationDelay: "0.4s"
                            }}
                          />
                        </Box>
                      </Paper>
                    </Box>
                  </Box>
                </motion.div>
              )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </>
          )}
        </Box>

        {/* Input Area */}
        {currentChat && (
          <Box
            sx={{
              p: 4,
              background: "#ffffff",
              borderTop: "1px solid #e5e5e5"
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "flex-end",
                maxWidth: "800px",
                mx: "auto",
                position: "relative"
              }}
            >
              {lastSavedMessage && (
                <Box
                  sx={{
                    position: "absolute",
                    top: -30,
                    left: 0,
                    fontSize: "12px",
                    color: "#4caf50",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5
                  }}
                >
                  <CheckCircle sx={{ fontSize: 14 }} />
                  Message saved
                </Box>
              )}

                <TextField
                  ref={inputRef}
                  fullWidth
                  multiline
                  maxRows={4}
                  value={isListening ? transcript : inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? "Listening..." : "Share what's on your mind with Dr. Sarah..."}
                  variant="outlined"
                  disabled={loading || isListening}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      background: isListening ? "#fff3e0" : "#ffffff",
                      border: isListening ? "2px solid #ff9800" : "2px solid #e5e5e5",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        borderColor: "#7B61FF",
                        boxShadow: "0 2px 8px rgba(123, 97, 255, 0.1)",
                      },
                      "&.Mui-focused": {
                        borderColor: "#7B61FF",
                        boxShadow: "0 4px 12px rgba(123, 97, 255, 0.2)",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#7B61FF",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "#333",
                        fontSize: "16px",
                        padding: "16px",
                        "&::placeholder": {
                          color: isListening ? "#ff9800" : "#666",
                          opacity: 1,
                          fontSize: "16px"
                        }
                      }
                    },
                  }}
                />
              <Box sx={{
                position: "absolute",
                right: 12,
                top: 12,
                display: "flex",
                alignItems: "center",
                gap: 1
              }}>
                <IconButton
                  onClick={toggleVoiceInput}
                  size="small"
                  sx={{
                    color: isListening ? "#f44336" : "#666",
                    p: 0.5,
                    "&:hover": {
                      color: isListening ? "#f44336" : "#7B61FF",
                    },
                  }}
                >
                  <Mic sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  onClick={toggleVoiceChat}
                  size="small"
                  sx={{
                    color: isVoiceChat ? "#7B61FF" : "#666",
                    p: 0.5,
                    "&:hover": {
                      color: "#7B61FF",
                    },
                  }}
                >
                  <GraphicEq sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton
                  onClick={isListening ? () => {
                    if (transcript.trim()) {
                      handleVoiceMessage(transcript);
                      setTranscript("");
                      recognitionRef.current?.stop();
                      setIsListening(false);
                    }
                  } : handleSendMessage}
                  disabled={(!inputText.trim() && !transcript.trim()) || loading}
                  size="small"
                  sx={{
                    background: (inputText.trim() || transcript.trim()) ? "#7B61FF" : "#e5e5e5",
                    color: (inputText.trim() || transcript.trim()) ? "white" : "#999",
                    p: 1,
                    "&:hover": {
                      background: (inputText.trim() || transcript.trim()) ? "#6B51EF" : "#e5e5e5",
                    },
                    "&:disabled": {
                      background: "#e5e5e5",
                      color: "#ccc",
                    },
                  }}
                >
                  <Send sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Chat</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this chat? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => chatToDelete && deleteChat(chatToDelete)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 