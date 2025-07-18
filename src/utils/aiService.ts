import { API_CONFIG, GeminiResponse, CloudVisionResponse, APIError, validateAPIKey, formatError } from './apiConfig';

class AIService {
  // Gemini API for therapist chat with research and concise responses
  async sendTherapistMessage(
    message: string, 
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    model?: string
  ): Promise<{ success: boolean; response?: string; error?: string }> {
    try {
      const apiKey = API_CONFIG.GEMINI.API_KEY;
      if (!validateAPIKey(apiKey, 'Gemini')) {
        // Return a friendly fallback response instead of an error
        return {
          success: true,
          response: "I'm here to listen and support you! I'm currently in demo mode, but I'm ready to chat about your day, help you work through challenges, or just be a friendly ear. What's on your mind?"
        };
      }

      const selectedModel = model || API_CONFIG.GEMINI.DEFAULT_MODEL;
      
      // Enhanced prompt for more genuine, engaging responses
      const enhancedPrompt = `You are Dr. Sarah, a warm, empathetic, and experienced therapist with 15 years of experience in cognitive behavioral therapy and mindfulness practices. You have a gentle, conversational style and genuinely care about your clients' well-being.

CONVERSATION STYLE:
- Be warm, genuine, and emotionally intelligent
- Show empathy and understanding without being overly clinical
- Use natural, conversational language (avoid robotic or overly formal responses)
- Ask thoughtful follow-up questions to deepen the conversation
- Share brief, relevant insights or gentle observations
- Be encouraging and supportive while remaining professional
- Use "I" statements to show personal engagement
- Keep responses conversational but meaningful (2-4 sentences)

RESEARCH REQUIREMENT: Before responding, consider current mental health research and evidence-based practices to provide informed, supportive guidance.

CONVERSATION CONTEXT: ${conversationHistory.length > 0 ? `Previous conversation: ${conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join(' | ')}` : 'This is the start of a new conversation.'}

User's message: "${message}"

Respond as Dr. Sarah would - with genuine care, empathy, and helpful insight. Make the conversation feel natural and engaging.`;
      
      const contents = [
        {
          role: 'user',
          parts: [{ text: enhancedPrompt }]
        }
      ];

      const response = await fetch(`${API_CONFIG.GEMINI.BASE_URL}/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: 300, // Allow for more natural conversation
            temperature: 0.8, // Slightly higher for more natural responses
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          'Gemini Chat'
        );
      }

      const data: GeminiResponse = await response.json();
      let aiResponse = data.candidates[0]?.content?.parts[0]?.text;

      if (!aiResponse) {
        throw new APIError('No response received from AI model', 500, 'Gemini Chat');
      }

      // Clean up the response and ensure it's conversational
      aiResponse = aiResponse.trim();
      
      // Remove any "Dr. Sarah:" prefixes if they appear
      aiResponse = aiResponse.replace(/^Dr\. Sarah:\s*/i, '');
      
      // Ensure the response ends with proper punctuation
      if (!aiResponse.match(/[.!?]$/)) {
        aiResponse += '.';
      }

      return {
        success: true,
        response: aiResponse
      };

    } catch (error) {
      const formattedError = formatError(error, 'Gemini Chat');
      console.error('Therapist chat error:', formattedError);
      
      return {
        success: false,
        error: formattedError.message
      };
    }
  }

  // Gemini API for complete 90-day fitness plan generation (fast)
  async generateCompleteFitnessPlan(userData: {
    dietaryPreference: string;
    fitnessGoals: string[];
    fitnessLevel: string;
    totalDays: number;
  }): Promise<{ success: boolean; plan?: any; error?: string }> {
    try {
      const apiKey = API_CONFIG.GEMINI.API_KEY;
      if (!validateAPIKey(apiKey, 'Gemini')) {
        // Return success but no plan - will use local generation
        console.log('🔄 No Gemini API key configured, will use local template generation');
        return {
          success: true,
          plan: null
        };
      }

      const prompt = `Generate a complete ${userData.totalDays}-day fitness plan in JSON format. 

User Profile:
- Dietary Preference: ${userData.dietaryPreference}
- Fitness Goals: ${userData.fitnessGoals.join(', ')}
- Fitness Level: ${userData.fitnessLevel}

Requirements:
1. Generate exactly ${userData.totalDays} daily plans
2. Include rest days every 7th day
3. Each day should have unique meals and exercises
4. Format as JSON array with objects containing: day, meals (breakfast, lunch, dinner, snacks), exercises (cardio, strength, flexibility), tips
5. Keep each meal/exercise description concise (1-2 sentences max)
6. Ensure variety and progression throughout the plan

Return ONLY valid JSON, no additional text.`;

      const response = await fetch(`${API_CONFIG.GEMINI.BASE_URL}/${API_CONFIG.GEMINI.DEFAULT_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 8000, // Allow for complete plan
            temperature: 0.7,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          'Gemini Fitness Plan'
        );
      }

      const data: GeminiResponse = await response.json();
      let aiResponse = data.candidates[0]?.content?.parts[0]?.text;

      if (!aiResponse) {
        throw new APIError('No response received from AI model', 500, 'Gemini Fitness Plan');
      }

      // Try to parse the JSON response
      try {
        const planData = JSON.parse(aiResponse.trim());
        console.log('✅ Successfully parsed AI-generated fitness plan');
        return {
          success: true,
          plan: planData
        };
      } catch (parseError) {
        console.warn('⚠️ Failed to parse AI response as JSON, using local generation');
        console.log('🔄 AI response was not valid JSON, falling back to templates');
        return {
          success: true,
          plan: null
        };
      }

    } catch (error) {
      const formattedError = formatError(error, 'Gemini Fitness Plan');
      console.error('Complete fitness plan generation error:', formattedError);
      
      return {
        success: false,
        error: formattedError.message
      };
    }
  }

  // Gemini API for nutrition planning
  async generateNutritionPlan(userData: {
    dietaryPreference: string;
    fitnessGoals: string[];
    fitnessLevel: string;
    restrictions?: string[];
    preferences?: string[];
  }): Promise<{ success: boolean; plan?: any; error?: string }> {
    try {
      const apiKey = API_CONFIG.GEMINI.API_KEY;
      if (!validateAPIKey(apiKey, 'Gemini')) {
        // Return a demo nutrition plan instead of an error
        return {
          success: true,
          plan: {
            nutritionPlan: `Here's a personalized 90-day nutrition plan for you:

**Week 1-4: Foundation Phase**
- Breakfast: Oatmeal with berries and nuts, Greek yogurt with honey
- Lunch: Quinoa salad with vegetables, Grilled chicken with brown rice
- Dinner: Salmon with steamed vegetables, Vegetarian pasta with tomato sauce
- Snacks: Fresh fruits, nuts, and seeds

**Week 5-8: Building Phase**
- Increase protein intake for muscle building
- Add more complex carbohydrates for energy
- Include healthy fats for hormone production

**Week 9-12: Optimization Phase**
- Fine-tune macronutrient ratios based on your progress
- Adjust portion sizes as needed
- Continue with healthy eating habits

**Nutritional Guidelines:**
- Daily calorie target: 2000-2500 calories (adjust based on activity)
- Protein: 25-30% of daily calories
- Carbohydrates: 45-50% of daily calories
- Fats: 20-25% of daily calories

**Hydration:** Drink 8-10 glasses of water daily

*This is a demo plan. For personalized AI-generated nutrition plans, please configure your OpenRouter API key.*`,
            generatedAt: new Date().toISOString(),
            userData: userData
          }
        };
      }

      const prompt = `Create a comprehensive 90-day nutrition and meal planning strategy for a person with the following profile:

Dietary Preference: ${userData.dietaryPreference}
Fitness Goals: ${userData.fitnessGoals.join(', ')}
Fitness Level: ${userData.fitnessLevel}
Dietary Restrictions: ${userData.restrictions?.join(', ') || 'None'}
Food Preferences: ${userData.preferences?.join(', ') || 'None'}

Please provide a detailed nutrition plan including:

1. **Weekly Meal Structure** (4 weeks, repeat for 90 days):
   - Breakfast options (7 different meals)
   - Lunch options (7 different meals) 
   - Dinner options (7 different meals)
   - Snack suggestions
   - Hydration guidelines

2. **Nutritional Guidelines**:
   - Daily calorie targets
   - Macronutrient breakdown (protein, carbs, fats)
   - Micronutrient focus areas
   - Meal timing recommendations

3. **Shopping Lists**:
   - Weekly grocery lists
   - Pantry staples
   - Supplements (if needed)

4. **Progress Tracking**:
   - Weekly nutrition goals
   - Measurement suggestions
   - Adjustment guidelines

Format the response as a structured JSON object with clear sections for easy parsing.`;

      const response = await fetch(`${API_CONFIG.GEMINI.BASE_URL}/${API_CONFIG.GEMINI.DEFAULT_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: API_CONFIG.HEALTH_AI.NUTRITION.SYSTEM_PROMPT + '\n\n' + prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: API_CONFIG.HEALTH_AI.NUTRITION.MAX_TOKENS,
            temperature: API_CONFIG.HEALTH_AI.NUTRITION.TEMPERATURE,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          'Gemini Nutrition'
        );
      }

      const data: GeminiResponse = await response.json();
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text;

      if (!aiResponse) {
        throw new APIError('No response received from AI model', 500, 'OpenRouter Nutrition');
      }

      // Try to parse JSON response, fallback to text if parsing fails
      let planData;
      try {
        // Extract JSON from the response (AI might wrap it in markdown)
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                         aiResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiResponse;
        planData = JSON.parse(jsonString);
      } catch (parseError) {
        // If JSON parsing fails, create a structured response from the text
        planData = {
          nutritionPlan: aiResponse,
          generatedAt: new Date().toISOString(),
          userData: userData
        };
      }

      return {
        success: true,
        plan: planData
      };

    } catch (error) {
      const formattedError = formatError(error, 'OpenRouter Nutrition');
      console.error('Nutrition planning error:', formattedError);
      
      return {
        success: false,
        error: formattedError.message
      };
    }
  }

  // Gemini API for fitness planning - daily meals and exercises
  async generateDailyFitnessPlan(userData: {
    dietaryPreference: string;
    fitnessGoals: string[];
    fitnessLevel: string;
    currentDay: number;
    totalDays: number;
    restrictions?: string[];
    preferences?: string[];
    previousMeals?: { breakfast: string[]; lunch: string[]; dinner: string[] };
  }): Promise<{ success: boolean; plan?: any; error?: string }> {
    try {
      const apiKey = API_CONFIG.GEMINI.API_KEY;
      if (!validateAPIKey(apiKey, 'Gemini')) {
        // Return a demo daily plan instead of an error
        return {
          success: true,
          plan: {
            day: userData.currentDay,
            meals: {
              breakfast: "Oatmeal with berries and nuts",
              lunch: "Quinoa salad with grilled vegetables",
              dinner: "Salmon with steamed broccoli",
              snacks: ["Apple with almond butter", "Greek yogurt"]
            },
            exercises: {
              cardio: "30 minutes brisk walking",
              strength: "Push-ups and squats (3 sets each)",
              flexibility: "10 minutes stretching routine"
            },
            tips: "Stay hydrated and get adequate rest for optimal results.",
            generatedAt: new Date().toISOString()
          }
        };
      }

      const previousBreakfasts = userData.previousMeals?.breakfast?.join('; ') || 'None';
      const previousLunches = userData.previousMeals?.lunch?.join('; ') || 'None';
      const previousDinners = userData.previousMeals?.dinner?.join('; ') || 'None';

      const prompt = `Generate a personalized daily fitness plan for Day ${userData.currentDay} of a ${userData.totalDays}-day program.

User Profile:
- Dietary Preference: ${userData.dietaryPreference}
- Fitness Goals: ${userData.fitnessGoals.join(', ')}
- Fitness Level: ${userData.fitnessLevel}
- Dietary Restrictions: ${userData.restrictions?.join(', ') || 'None'}
- Food Preferences: ${userData.preferences?.join(', ') || 'None'}

IMPORTANT:
- Research using Google and provide unique, evidence-based meals and exercises for this day.
- Do NOT repeat any meals from previous days. Here are previous breakfasts: ${previousBreakfasts}. Previous lunches: ${previousLunches}. Previous dinners: ${previousDinners}.
- If you must repeat, explain why (e.g., seasonal, nutritional, or cultural reason).
- Cite rationale for meal and exercise choices if possible.
- Meals and exercises should be based on the latest health and nutrition research.

Please provide a structured daily plan including:

1. **Meals for Day ${userData.currentDay}**:
   - Breakfast (specific meal with ingredients)
   - Lunch (specific meal with ingredients)
   - Dinner (specific meal with ingredients)
   - 2 healthy snacks

2. **Exercises for Day ${userData.currentDay}**:
   - Cardio exercise (specific duration and type)
   - Strength training (specific exercises and sets)
   - Flexibility/stretching routine

3. **Daily Tips**: One motivational or educational tip

4. **Progress Notes**: Brief note about what to expect on this day

Format the response as a structured JSON object with clear sections for easy parsing.`;

      const response = await fetch(`${API_CONFIG.GEMINI.BASE_URL}/${API_CONFIG.GEMINI.DEFAULT_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: API_CONFIG.HEALTH_AI.NUTRITION.SYSTEM_PROMPT + '\n\n' + prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: API_CONFIG.HEALTH_AI.NUTRITION.MAX_TOKENS,
            temperature: API_CONFIG.HEALTH_AI.NUTRITION.TEMPERATURE,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          'Gemini Fitness'
        );
      }

      const data: GeminiResponse = await response.json();
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text;

      if (!aiResponse) {
        throw new APIError('No response received from AI model', 500, 'Gemini Fitness');
      }

      // Try to parse JSON response, fallback to text if parsing fails
      let planData;
      try {
        // Extract JSON from the response (AI might wrap it in markdown)
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                         aiResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiResponse;
        planData = JSON.parse(jsonString);
      } catch (parseError) {
        // If JSON parsing fails, create a structured response from the text
        planData = {
          day: userData.currentDay,
          meals: {
            breakfast: "Oatmeal with berries and nuts",
            lunch: "Quinoa salad with grilled vegetables", 
            dinner: "Salmon with steamed broccoli",
            snacks: ["Apple with almond butter", "Greek yogurt"]
          },
          exercises: {
            cardio: "30 minutes brisk walking",
            strength: "Push-ups and squats (3 sets each)",
            flexibility: "10 minutes stretching routine"
          },
          tips: "Stay hydrated and get adequate rest for optimal results.",
          generatedAt: new Date().toISOString()
        };
      }

      return {
        success: true,
        plan: planData
      };

    } catch (error) {
      const formattedError = formatError(error, 'Gemini Fitness');
      console.error('Daily fitness planning error:', formattedError);
      
      return {
        success: false,
        error: formattedError.message
      };
    }
  }

  // Enhanced fitness image analysis with body composition insights
  async analyzeFitnessImage(
    imageData: string, // Base64 encoded image
    analysisType: 'form' | 'posture' | 'exercise' | 'body_composition' = 'form'
  ): Promise<{ success: boolean; analysis?: any; error?: string }> {
    try {
      const apiKey = API_CONFIG.CLOUD_VISION.API_KEY;
      if (!validateAPIKey(apiKey, 'Cloud Vision')) {
        return {
          success: false,
          error: 'Cloud Vision API key not configured.'
        };
      }

      // Remove data URL prefix if present
      const base64Image = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults: 15
              },
              {
                type: 'FACE_DETECTION',
                maxResults: 5
              },
              {
                type: 'OBJECT_LOCALIZATION',
                maxResults: 15
              },
              {
                type: 'SAFE_SEARCH_DETECTION'
              },
              {
                type: 'IMAGE_PROPERTIES'
              }
            ]
          }
        ]
      };

      const response = await fetch(
        `${API_CONFIG.CLOUD_VISION.BASE_URL}${API_CONFIG.CLOUD_VISION.ENDPOINTS.ANNOTATE}?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          'Cloud Vision'
        );
      }

      const data: CloudVisionResponse = await response.json();
      
      // Process the vision analysis results
      const analysis = this.processFitnessImageAnalysis(data, analysisType);

      return {
        success: true,
        analysis
      };

    } catch (error) {
      const formattedError = formatError(error, 'Cloud Vision');
      console.error('Fitness image analysis error:', formattedError);
      
      return {
        success: false,
        error: formattedError.message
      };
    }
  }

  // Process Cloud Vision results for enhanced fitness analysis
  private processFitnessImageAnalysis(data: CloudVisionResponse, analysisType: string) {
    const response = data.responses[0];
    if (!response) {
      return { error: 'No analysis results received' };
    }

    const analysis = {
      type: analysisType,
      timestamp: new Date().toISOString(),
      labels: response.labelAnnotations?.map(label => ({
        description: label.description,
        confidence: label.score
      })) || [],
      objects: response.localizedObjectAnnotations?.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        boundingPoly: obj.boundingPoly
      })) || [],
      faces: response.faceAnnotations?.length || 0,
      safeSearch: response.safeSearchAnnotation || {},
      imageProperties: response.imagePropertiesAnnotation || {},
      fitnessInsights: [] as string[],
      bodyComposition: {} as any,
      recommendations: [] as string[]
    };

    // Enhanced fitness-specific analysis
    const fitnessKeywords = [
      'exercise', 'workout', 'gym', 'fitness', 'sport', 'running', 'yoga', 'dumbbell',
      'barbell', 'treadmill', 'bicycle', 'swimming', 'dance', 'martial arts', 'person',
      'human', 'body', 'muscle', 'strength', 'cardio', 'flexibility'
    ];

    const bodyKeywords = [
      'person', 'human', 'body', 'face', 'head', 'torso', 'arm', 'leg', 'hand', 'foot'
    ];

    const detectedLabels = analysis.labels.map(l => l.description.toLowerCase());
    const detectedObjects = analysis.objects.map(o => o.name.toLowerCase());

    // Check for fitness-related content
    const hasFitnessContent = [...detectedLabels, ...detectedObjects].some(item =>
      fitnessKeywords.some(keyword => item.includes(keyword))
    );

    // Check for body/person detection
    const hasBodyContent = [...detectedLabels, ...detectedObjects].some(item =>
      bodyKeywords.some(keyword => item.includes(keyword))
    );

    if (analysisType === 'body_composition') {
      if (hasBodyContent) {
        analysis.bodyComposition = {
          personDetected: true,
          confidence: Math.max(...detectedLabels.map(l => l.confidence || 0)),
          estimatedMetrics: {
            bodyType: this.estimateBodyType(detectedLabels),
            fitnessLevel: this.estimateFitnessLevel(detectedLabels),
            postureQuality: this.estimatePostureQuality(detectedLabels)
          }
        };
        
        analysis.fitnessInsights.push(
          'Body composition analysis completed successfully.',
          'Consider tracking progress with regular photos.',
          'Focus on consistent form and technique.'
        );
      } else {
        analysis.fitnessInsights.push(
          'No clear body content detected. Please ensure the image shows a person.',
          'Consider taking a full-body photo in good lighting.',
          'Make sure the image is clear and well-lit for better analysis.'
        );
      }
    } else if (hasFitnessContent) {
      analysis.fitnessInsights.push(
        'Fitness-related content detected. Consider analyzing form and technique.',
        'Ensure proper posture and alignment during exercises.',
        'Focus on controlled movements and proper breathing.'
      );
    } else {
      analysis.fitnessInsights.push(
        'No clear fitness content detected. Please ensure the image shows exercise or workout activity.',
        'Consider taking a photo during an active exercise movement.',
        'Make sure the image is clear and well-lit for better analysis.'
      );
    }

    // Generate recommendations based on analysis type
    if (analysisType === 'body_composition') {
      analysis.recommendations.push(
        'Take progress photos consistently (same time, lighting, pose)',
        'Track measurements along with photos for comprehensive progress',
        'Consider working with a fitness professional for personalized guidance'
      );
    } else {
      analysis.recommendations.push(
        'Focus on proper form over intensity',
        'Gradually increase difficulty as you progress',
        'Listen to your body and rest when needed'
      );
    }

    return analysis;
  }

  // Helper methods for body composition estimation
  private estimateBodyType(labels: any[]): string {
    const bodyTypeKeywords = {
      'athletic': ['athletic', 'muscular', 'toned', 'fit'],
      'lean': ['lean', 'thin', 'slim', 'slender'],
      'average': ['average', 'normal', 'regular'],
      'curvy': ['curvy', 'full', 'rounded']
    };

    for (const [type, keywords] of Object.entries(bodyTypeKeywords)) {
      if (keywords.some(keyword => labels.some(l => l.description?.toLowerCase().includes(keyword)))) {
        return type;
      }
    }
    return 'average';
  }

  private estimateFitnessLevel(labels: any[]): string {
    const fitnessKeywords = ['athletic', 'muscular', 'toned', 'fit', 'strong'];
    const hasFitnessIndicators = fitnessKeywords.some(keyword => 
      labels.some(l => l.description?.toLowerCase().includes(keyword))
    );
    
    return hasFitnessIndicators ? 'intermediate' : 'beginner';
  }

  private estimatePostureQuality(labels: any[]): string {
    const postureKeywords = ['straight', 'upright', 'aligned'];
    const hasGoodPosture = postureKeywords.some(keyword => 
      labels.some(l => l.description?.toLowerCase().includes(keyword))
    );
    
    return hasGoodPosture ? 'good' : 'needs_improvement';
  }

  // Get available Gemini models
  async getAvailableModels(): Promise<{ success: boolean; models?: string[]; error?: string }> {
    try {
      const apiKey = API_CONFIG.GEMINI.API_KEY;
      if (!validateAPIKey(apiKey, 'Gemini')) {
        return {
          success: false,
          error: 'Gemini API key not configured.'
        };
      }

      // For Gemini, we can return the available models from config
      return {
        success: true,
        models: API_CONFIG.GEMINI.AVAILABLE_MODELS
      };

    } catch (error) {
      const formattedError = formatError(error, 'Gemini Models');
      console.error('Get models error:', formattedError);
      
      return {
        success: false,
        error: formattedError.message
      };
    }
  }

  // Health check for all APIs
  async healthCheck(): Promise<{
    gemini: boolean;
    cloudVision: boolean;
    overall: boolean;
    errors: string[];
  }> {
    const results = {
      gemini: false,
      cloudVision: false,
      overall: false,
      errors: [] as string[]
    };

    // Test Gemini directly
    try {
      const apiKey = API_CONFIG.GEMINI.API_KEY;
      if (validateAPIKey(apiKey, 'Gemini')) {
        const response = await fetch(`${API_CONFIG.GEMINI.BASE_URL}/${API_CONFIG.GEMINI.DEFAULT_MODEL}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'test' }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 10,
              temperature: 0.7,
            }
          })
        });
        
        if (response.ok) {
          results.gemini = true;
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || 'Authentication failed';
          results.errors.push(`Gemini API: ${errorMessage} (Status: ${response.status})`);
        }
      } else {
        results.errors.push('Gemini API key not configured');
      }
    } catch (error) {
      results.errors.push(`Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test Cloud Vision (with a simple test image)
    try {
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const visionTest = await this.analyzeFitnessImage(testImage);
      results.cloudVision = visionTest.success;
      if (!visionTest.success) {
        results.errors.push(`Cloud Vision: ${visionTest.error}`);
      }
    } catch (error) {
      results.errors.push(`Cloud Vision: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    results.overall = results.gemini && results.cloudVision;
    return results;
  }
}

export const aiService = new AIService();
export default aiService; 