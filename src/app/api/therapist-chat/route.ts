import { NextRequest, NextResponse } from 'next/server';

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Prepare conversation context (last 5 messages for continuity)
    const recentMessages = conversationHistory.slice(-5);
    
    // Build messages array with conversation history
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a caring, supportive friend who\'s here to listen and chat. You\'re warm, friendly, and genuinely want to help people feel better. Keep responses short and sweet (1-2 sentences max). Use casual, everyday language - no fancy talk, just being a good friend. Be encouraging and positive, especially when they\'re having a tough time. Help them see the good things and possibilities.'
      },
      ...recentMessages.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    const enhancedPrompt = `You are a caring, supportive AI therapist. Your responses must be EXACTLY 2 sentences - no more, no less. Be warm, empathetic, and helpful.

RESEARCH REQUIREMENT: Before responding, research the topic mentioned by the user to provide informed, evidence-based support. Use current mental health research and best practices.

RESPONSE FORMAT: 
- First sentence: Show empathy and understanding
- Second sentence: Provide one specific, actionable piece of advice or support

User message: "${message}"

Remember: Keep responses to exactly 2 sentences, be supportive, and base your advice on current mental health research.`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: enhancedPrompt }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 200, // Shorter for 2-sentence responses
          temperature: 0.7,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const data = await geminiResponse.json();
    let aiResponse = data.candidates[0]?.content?.parts[0]?.text || '';

    // Ensure response is exactly 2 sentences
    const sentences = aiResponse.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
    if (sentences.length > 2) {
      aiResponse = sentences.slice(0, 2).join('. ') + '.';
    } else if (sentences.length < 2) {
      aiResponse = aiResponse + " I'm here to support you through this.";
    }

    // Fallback response if API fails
    if (!aiResponse) {
      return NextResponse.json({
        response: `Hey, I totally get how you're feeling right now. It's totally okay to feel this way, and I'm here to listen and chat with you.

You know what? Sometimes just talking to someone who cares can make a huge difference. Maybe try reaching out to a friend or family member who you trust, or do something that makes you smile - like watching a funny video or going for a walk.

Remember, tough times don't last forever, and you're stronger than you think! What's been on your mind lately? I'm here to chat whenever you need a friend.`
      });
    }

    return NextResponse.json({
      response: aiResponse
    });

  } catch (error) {
    console.error('Therapist chat API error:', error);
    
    // Fallback response for any errors
    return NextResponse.json({
      response: `Oops! I'm having a little trouble connecting right now, but don't worry - I'm still here for you!

You know what always helps me feel better? Talking to someone who cares, doing something fun, or just taking a few deep breaths. Maybe try calling a friend or doing something that makes you smile?

I'll be back to chat soon! Remember, you're awesome and you've got this. Brighter days are definitely ahead! 🌟`
    });
  }
} 