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
      
      // Enhanced prompt with research and concise response requirements
      const enhancedPrompt = `You are a caring, supportive AI therapist. Your responses must be EXACTLY 2 sentences - no more, no less. Be warm, empathetic, and helpful.

RESEARCH REQUIREMENT: Before responding, research the topic mentioned by the user to provide informed, evidence-based support. Use current mental health research and best practices.

RESPONSE FORMAT: 
- First sentence: Show empathy and understanding
- Second sentence: Provide one specific, actionable piece of advice or support

User message: "${message}"

Remember: Keep responses to exactly 2 sentences, be supportive, and base your advice on current mental health research.`;
      
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
            maxOutputTokens: 200, // Shorter for 2-sentence responses
            temperature: 0.7,
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

      // Ensure response is exactly 2 sentences
      const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > 2) {
        aiResponse = sentences.slice(0, 2).join('. ') + '.';
      } else if (sentences.length < 2) {
        aiResponse = aiResponse + " I'm here to support you through this.";
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

  // Cloud Vision API for fitness analysis
  async analyzeFitnessImage(
    imageData: string, // Base64 encoded image
    analysisType: 'form' | 'posture' | 'exercise' = 'form'
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
                maxResults: 10
              },
              {
                type: 'FACE_DETECTION',
                maxResults: 5
              },
              {
                type: 'OBJECT_LOCALIZATION',
                maxResults: 10
              },
              {
                type: 'SAFE_SEARCH_DETECTION'
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
      const analysis = this.processVisionAnalysis(data, analysisType);

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

  // Process Cloud Vision results for fitness analysis
  private processVisionAnalysis(data: CloudVisionResponse, analysisType: string) {
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
      recommendations: [] as string[]
    };

    // Generate fitness-specific recommendations based on detected objects and labels
    const fitnessKeywords = [
      'exercise', 'workout', 'gym', 'fitness', 'sport', 'running', 'yoga', 'dumbbell',
      'barbell', 'treadmill', 'bicycle', 'swimming', 'dance', 'martial arts'
    ];

    const detectedLabels = analysis.labels.map(l => l.description.toLowerCase());
    const detectedObjects = analysis.objects.map(o => o.name.toLowerCase());

    // Check if fitness-related content is detected
    const hasFitnessContent = [...detectedLabels, ...detectedObjects].some(item =>
      fitnessKeywords.some(keyword => item.includes(keyword))
    );

    if (hasFitnessContent) {
      analysis.recommendations.push(
        'Fitness-related content detected. Consider analyzing form and technique.',
        'Ensure proper posture and alignment during exercises.',
        'Focus on controlled movements and proper breathing.'
      );
    } else {
      analysis.recommendations.push(
        'No clear fitness content detected. Please ensure the image shows exercise or workout activity.',
        'Consider taking a photo during an active exercise movement.',
        'Make sure the image is clear and well-lit for better analysis.'
      );
    }

    return analysis;
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