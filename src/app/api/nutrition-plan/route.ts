import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { dietaryPreference, fitnessGoals, fitnessLevel, restrictions = [], preferences = [] } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const prompt = `Create a comprehensive 90-day nutrition plan for someone with the following profile:

Dietary Preference: ${dietaryPreference}
Fitness Goals: ${fitnessGoals.join(', ')}
Fitness Level: ${fitnessLevel}
Dietary Restrictions: ${restrictions.length > 0 ? restrictions.join(', ') : 'None'}
Food Preferences: ${preferences.length > 0 ? preferences.join(', ') : 'None'}

Please provide:
1. A detailed 90-day meal plan with breakfast, lunch, dinner, and snacks
2. Weekly grocery shopping lists
3. Nutritional guidelines and tips
4. Progress tracking recommendations
5. Recipe suggestions for key meals

Format the response as a structured JSON object with the following structure:
{
  "nutritionPlan": {
    "overview": "Brief overview of the plan",
    "dailyMeals": {
      "breakfast": "Meal description",
      "lunch": "Meal description", 
      "dinner": "Meal description",
      "snacks": ["Snack 1", "Snack 2"]
    },
    "weeklyGroceryList": ["Item 1", "Item 2", ...],
    "nutritionalGuidelines": ["Guideline 1", "Guideline 2", ...],
    "tips": ["Tip 1", "Tip 2", ...],
    "recipes": [
      {
        "name": "Recipe Name",
        "ingredients": ["Ingredient 1", "Ingredient 2"],
        "instructions": "Step-by-step instructions"
      }
    ]
  }
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
          maxOutputTokens: 1000,
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0]?.content?.parts[0]?.text || '';

    // Try to parse the response as JSON, fallback to text if it fails
    let nutritionPlan;
    try {
      nutritionPlan = JSON.parse(aiResponse);
    } catch (error) {
      // If JSON parsing fails, return the raw response
      nutritionPlan = {
        nutritionPlan: {
          overview: "AI-generated nutrition plan",
          content: aiResponse
        }
      };
    }

    return NextResponse.json({
      success: true,
      plan: nutritionPlan
    });

  } catch (error) {
    console.error('Nutrition plan API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      plan: {
        nutritionPlan: {
          overview: "Demo nutrition plan",
          dailyMeals: {
            breakfast: "Oatmeal with berries and nuts",
            lunch: "Grilled chicken salad with vegetables",
            dinner: "Salmon with quinoa and steamed broccoli",
            snacks: ["Apple with almond butter", "Greek yogurt with honey"]
          },
          weeklyGroceryList: [
            "Oatmeal", "Berries", "Nuts", "Chicken breast", "Mixed greens",
            "Vegetables", "Salmon", "Quinoa", "Broccoli", "Apples",
            "Almond butter", "Greek yogurt", "Honey"
          ],
          nutritionalGuidelines: [
            "Aim for 3 balanced meals per day",
            "Include protein with every meal",
            "Eat plenty of colorful vegetables",
            "Stay hydrated with water",
            "Limit processed foods"
          ],
          tips: [
            "Meal prep on Sundays for the week",
            "Keep healthy snacks readily available",
            "Listen to your body's hunger cues",
            "Don't skip meals",
            "Enjoy your food mindfully"
          ]
        }
      }
    });
  }
} 