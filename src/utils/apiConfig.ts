// API Configuration for Health AI
// Environment variables should be set in .env.local

export const API_CONFIG = {
  // Gemini API for AI chat and nutrition
  GEMINI: {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    DEFAULT_MODEL: 'models/gemini-1.5-flash',
    AVAILABLE_MODELS: [
      'models/gemini-1.5-flash',
      'models/gemini-1.5-pro',
      'models/gemini-pro'
    ]
  },

  // Google Cloud Vision API for fitness analysis
  CLOUD_VISION: {
    BASE_URL: 'https://vision.googleapis.com/v1',
    API_KEY: process.env.NEXT_PUBLIC_CLOUD_VISION_API_KEY || process.env.CLOUD_VISION_API_KEY || 'AIzaSyB6Vkyj8S0b1Yflmm-bI-L3aDmxgOSmg_M',
    ENDPOINTS: {
      ANNOTATE: '/images:annotate',
      FACE_DETECTION: '/images:annotate?key=',
      OBJECT_DETECTION: '/images:annotate?key='
    }
  },

  // Health AI specific configurations
  HEALTH_AI: {
    THERAPIST_CHAT: {
      SYSTEM_PROMPT: `You are an empathetic AI therapist specializing in mental health support. 
      Your role is to provide compassionate, evidence-based guidance while maintaining professional boundaries.
      
      Guidelines:
      - Always prioritize user safety and well-being
      - Provide supportive, non-judgmental responses
      - Suggest professional help for serious mental health concerns
      - Use evidence-based therapeutic techniques
      - Maintain confidentiality and trust
      - Never give medical advice or diagnose conditions
      
      Focus on: stress management, emotional support, cognitive behavioral techniques, mindfulness, and general wellness.`,
      
      MAX_TOKENS: 1000,
      TEMPERATURE: 0.7
    },

    NUTRITION: {
      SYSTEM_PROMPT: `You are a certified nutritionist and fitness expert specializing in personalized meal planning and nutrition advice.
      
      Your expertise includes:
      - Macronutrient balance and meal timing
      - Dietary restrictions and preferences
      - Fitness goal alignment
      - Healthy recipe suggestions
      - Supplement recommendations (when appropriate)
      - Progress tracking and adjustments
      
      Always consider the user's fitness goals, dietary preferences, and health conditions when providing advice.`,
      
      MAX_TOKENS: 1500,
      TEMPERATURE: 0.6
    },

    FITNESS_ANALYSIS: {
      SYSTEM_PROMPT: `You are a fitness expert analyzing workout form and providing personalized recommendations.
      
      Analyze the provided fitness images/videos for:
      - Exercise form and technique
      - Muscle engagement and activation
      - Potential injury risks
      - Form corrections and improvements
      - Exercise modifications if needed
      
      Provide clear, actionable feedback with specific recommendations.`,
      
      MAX_TOKENS: 800,
      TEMPERATURE: 0.5
    }
  }
};

// API Response types
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface CloudVisionResponse {
  responses: Array<{
    faceAnnotations?: any[];
    landmarkAnnotations?: any[];
    logoAnnotations?: any[];
    labelAnnotations?: any[];
    textAnnotations?: any[];
    localizedObjectAnnotations?: any[];
    safeSearchAnnotation?: any;
    imagePropertiesAnnotation?: any;
    cropHintsAnnotation?: any;
    webDetection?: any;
    productSearchResults?: any;
    context?: any;
  }>;
}

// Error handling
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Utility functions
export const validateAPIKey = (apiKey: string, service: string): boolean => {
  if (!apiKey || apiKey.trim() === '') {
    console.error(`${service} API key is not configured`);
    return false;
  }
  return true;
};

export const formatError = (error: any, endpoint: string): APIError => {
  if (error instanceof APIError) {
    return error;
  }
  
  const message = error.message || 'An unexpected error occurred';
  const statusCode = error.status || 500;
  
  return new APIError(message, statusCode, endpoint);
}; 