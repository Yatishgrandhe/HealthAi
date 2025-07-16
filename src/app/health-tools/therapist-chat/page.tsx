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
  Avatar
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
  Add
} from "@mui/icons-material";
import { motion } from "framer-motion";
import Link from "next/link";
import aiService from "@/utils/aiService";

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

  const generateResponse = useEffect(async (userMessage: string) => {
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
  }, [currentChat]);

  const handleVoiceMessage = useEffect((message: string) => {
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

    // Force immediate save to localStorage for voice messages
    try {
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
    } catch (error) {
      console.error('Failed to save voice message:', error);
    }

    // Generate AI response
    generateResponse(message);
  }, [currentChat, generateResponse, chatSessions]);

  // Load chats from localStorage on component mount and create new chat
  useEffect(() => {
    const savedChats = localStorage.getItem('therapist-chats');
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
    }
    
    // Always create a new chat when entering the page
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setChatSessions(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    
    // Focus on input after creating new chat
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Save chats to localStorage whenever they change - with error handling
  useEffect(() => {
    try {
      if (chatSessions.length > 0) {
        localStorage.setItem('therapist-chats', JSON.stringify(chatSessions));
        console.log('Chats saved to localStorage:', chatSessions.length, 'sessions');
      }
    } catch (error) {
      console.error('Failed to save chats to localStorage:', error);
    }
  }, [chatSessions]);

  // Scroll to bottom when new messages are added (but not during typing)
  useEffect(() => {
    if (currentChat?.messages.length && !isTyping) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentChat?.messages, isTyping]);

  // Ensure user messages are always visible - fallback mechanism
  const ensureUserMessageVisible = useEffect((message: string) => {
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
  }, [currentChat]);

  const createNewChat = () => {
    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
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
    setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(chatSessions.find(chat => chat.id !== chatId) || null);
    }
    setDeleteDialogOpen(false);
    setChatToDelete(null);
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
    
    // Force immediate save to localStorage
    try {
      const updatedSessions = chatSessions.map(chat => 
        chat.id === updatedChat.id ? updatedChat : chat
      );
      localStorage.setItem('therapist-chats', JSON.stringify(updatedSessions));
      setLastSavedMessage(messageText);
      console.log('User message saved immediately:', messageText);
      
      // Clear the saved message indicator after 3 seconds
      setTimeout(() => {
        setLastSavedMessage("");
      }, 3000);
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
        console.log('Saved chats in localStorage:', parsed);
        console.log('Current chat sessions:', chatSessions);
        console.log('Current chat:', currentChat);
      } else {
        console.log('No saved chats found in localStorage');
      }
    } catch (error) {
      console.error('Error reading saved messages:', error);
    }
  };



  return (
    <Box sx={{ 
      height: "100vh", 
      display: "flex", 
      background: "#f7f7f8",
      position: "relative"
    }}>
      {/* Top Bar */}
      <Box sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "48px",
        background: "linear-gradient(135deg, #E573B7, #7B61FF)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 3,
        zIndex: 1100
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Psychology sx={{ fontSize: 20, color: "white" }} />
          <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
            Therapist Chat
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Link href="/health-tools" passHref>
            <IconButton
              sx={{
                color: "white",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <ArrowBack />
            </IconButton>
          </Link>
          <Button
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
              textTransform: "none",
              fontWeight: 500
            }}
          >
            New Chat
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outlined"
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
          )}
        </Box>
      </Box>

      {/* Sidebar - Always visible like ChatGPT */}
      <Box
        sx={{
          position: "fixed",
          left: 0,
          top: "48px",
          height: "calc(100vh - 48px)",
          width: "260px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.2)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1000
        }}
      >
        {/* New Chat Button */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Add />}
            onClick={createNewChat}
            sx={{
              borderColor: "rgba(123, 97, 255, 0.3)",
              color: "#7B61FF",
              "&:hover": {
                borderColor: "#7B61FF",
                background: "rgba(123, 97, 255, 0.1)",
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
        
        <Divider sx={{ borderColor: "rgba(123, 97, 255, 0.2)", mx: 2 }} />
        
        {/* Chat History */}
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: "#7B61FF", 
              fontSize: "12px", 
              fontWeight: 600, 
              mb: 2, 
              px: 1 
            }}
          >
            CHATS
          </Typography>
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
        ml: "260px",
        mt: "48px"
      }}>
        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: "auto", 
          background: "#ffffff",
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
          ) : (
            <>
              {/* AnimatePresence is removed as per new_code, but motion.div is kept */}
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
                        background: message.sender === "user" ? "#f7f7f8" : "#ffffff",
                        borderBottom: "1px solid #e5e5e5"
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          background: message.sender === "user" ? "#7B61FF" : "#10a37f",
                          color: "white",
                          fontSize: "14px",
                          flexShrink: 0
                        }}
                      >
                        {message.sender === "user" ? "U" : "T"}
                      </Avatar>
                      <Box sx={{ flex: 1, maxWidth: "800px", mx: "auto" }}>
                        <Typography
                          variant="body1"
                          sx={{
                            lineHeight: 1.6,
                            color: "#374151",
                            whiteSpace: "pre-wrap",
                            fontSize: "16px"
                          }}
                        >
                          {message.text}
                        </Typography>
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
                        width: 30,
                        height: 30,
                        background: "#7B61FF",
                        color: "white",
                        fontSize: "14px",
                        flexShrink: 0
                      }}
                    >
                      T
                    </Avatar>
                    <Box sx={{ flex: 1, maxWidth: "800px", mx: "auto" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CircularProgress size={16} sx={{ color: "#7B61FF" }} />
                        <Typography variant="body2" sx={{ color: "#666" }}>
                          Typing...
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              )}
              
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
                  placeholder={isListening ? "Listening..." : "Message Therapist Chat..."}
                  variant="outlined"
                  disabled={loading || isListening}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      background: isListening ? "#fff3e0" : "#ffffff",
                      border: isListening ? "1px solid #ff9800" : "1px solid #e5e5e5",
                      "&:hover": {
                        borderColor: "#7B61FF",
                      },
                      "&.Mui-focused": {
                        borderColor: "#7B61FF",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#7B61FF",
                        },
                      },
                      "& .MuiInputBase-input": {
                        color: "#333",
                        "&::placeholder": {
                          color: isListening ? "#ff9800" : "#666",
                          opacity: 1
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