# Health AI API Setup Guide

This guide will help you set up the required API keys to enable all AI features in Health AI.

## Required API Keys

### 1. OpenRouter API Key (Required for AI Chat and Nutrition)

**What it's used for:**
- Therapist Chat: AI-powered mental health conversations
- Nutrition Planning: Personalized meal plans and dietary advice

**How to get it:**
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to "Keys" section
4. Create a new API key
5. Copy the API key

**Setup:**
1. Create a `.env.local` file in your project root
2. Add your API key:
   ```
   NEXT_PUBLIC_OPENROUTER_API_KEY=your_actual_api_key_here
   ```
3. Restart your development server

### 2. Google Cloud Vision API Key (Already Configured)

**What it's used for:**
- Fitness Image Analysis: Analyzing workout form and posture
- Body Analysis: Processing uploaded fitness images

**Status:** ✅ Already configured in the application
- API Key: `AIzaSyB6Vkyj8S0b1Yflmm-bI-L3aDmxgOSmg_M`
- No additional setup required

## Environment Variables Template

Create a `.env.local` file in your project root with the following content:

```env
# Health AI Environment Variables

# OpenRouter API Key (Required for AI Chat and Nutrition Planning)
NEXT_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Supabase Configuration (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Testing Your Setup

1. **API Status Checker**: The health tools page includes an API status checker that will show you if your APIs are working correctly.

2. **Test Features**:
   - **Therapist Chat**: Try sending a message to test OpenRouter API
   - **Fitness Planner**: Upload an image to test Cloud Vision API
   - **Nutrition Planning**: Generate a meal plan to test OpenRouter API

## Troubleshooting

### OpenRouter API Issues
- **Error**: "OpenRouter API key not configured"
  - **Solution**: Make sure you've added the API key to `.env.local` and restarted the server
- **Error**: "Invalid API key"
  - **Solution**: Check that you've copied the API key correctly from OpenRouter
- **Error**: "Rate limit exceeded"
  - **Solution**: OpenRouter has usage limits. Check your usage in the OpenRouter dashboard

### Cloud Vision API Issues
- **Error**: "Cloud Vision API key not configured"
  - **Solution**: The API key is hardcoded. If you're seeing this error, contact support
- **Error**: "Image analysis failed"
  - **Solution**: Make sure the uploaded image is clear and shows fitness-related content

### General Issues
- **Environment variables not loading**: Make sure you've restarted your development server after adding `.env.local`
- **CORS errors**: These should be handled automatically, but if you see CORS errors, check your browser console for details

## Security Notes

- Never commit your `.env.local` file to version control
- The `.env.local` file is already in `.gitignore`
- API keys are prefixed with `NEXT_PUBLIC_` because they're used in the browser
- In production, consider using server-side API calls for better security

## Support

If you're having trouble setting up the APIs:
1. Check the API Status Checker on the health tools page
2. Verify your API keys are correct
3. Check the browser console for error messages
4. Ensure your development server is running

## Cost Information

- **OpenRouter**: Free tier available with usage limits. Check [OpenRouter pricing](https://openrouter.ai/pricing) for details
- **Cloud Vision**: The provided API key has usage limits. For production use, you should set up your own Google Cloud project

## Next Steps

Once your APIs are configured:
1. Test the therapist chat feature
2. Try the fitness planner with image upload
3. Generate personalized nutrition plans
4. Explore all the AI-powered features

Happy coding! 🚀 