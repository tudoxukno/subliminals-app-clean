# Gemini Setup Guide

## Why Use Gemini?

OpenAI's DALL-E has become extremely restrictive with content policy violations, even rejecting simple prompts like "gradient background, soft colors". Google Gemini provides:

- **More permissive content policies** for image generation
- **Free tier**: 15 requests/minute, 1500 requests/day
- **High quality responses** that match your archetype personalities
- **Automatic fallback** when OpenAI fails
- **Vertex AI Imagen 3** for AI-generated backgrounds when DALL-E fails

## Setup Steps

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Set Up Google Cloud for Image Generation (Optional but Recommended)

For AI-generated backgrounds using Vertex AI Imagen 3:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Vertex AI API
4. Set up authentication:
   - **Option A (Recommended)**: Use Application Default Credentials
     ```bash
     gcloud auth application-default login
     ```
   - **Option B**: Create a service account and download JSON key file

### 3. Add to Environment Variables

Add to your `backend/.env` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_PROJECT=your-google-cloud-project-id
PORT=3000
```

**Note**: If you don't set up Google Cloud, the system will still work but will fall back to contextual color backgrounds when DALL-E fails.

### 4. Available Endpoints

Your server now supports multiple generation methods:

- **`POST /generate`** - Main endpoint (tries OpenAI first, falls back to Gemini)
- **`POST /generate-gemini`** - Use Gemini directly
- **`POST /generate-fast`** - Fast text-only generation with OpenAI
- **`POST /generate-background`** - Generate/regenerate backgrounds (now includes Vertex AI Imagen 3 fallback)

### 5. Test the Integration

After setting your `GEMINI_API_KEY`, restart your server:

```bash
cd backend && npm run dev
```

You should see:
```
✅ Gemini client initialized successfully
🎨 Vertex AI Imagen 3 integration available (if Google Cloud configured)
```

## Image Generation Fallback Chain

When generating backgrounds, the system now uses this fallback order:

1. **DALL-E 3** (if credits available)
2. **Vertex AI Imagen 3** (if Google Cloud configured)  
3. **Contextual Color Gradients** (always available)

## Cost Comparison

| Provider | Free Tier | Cost After Free |
|----------|-----------|-----------------|
| **Gemini 1.5 Flash** | 1500 requests/day | $0.075 per 1M tokens |
| **Vertex AI Imagen 3** | Free trial credits | $0.020 per image |
| **OpenAI GPT-4o** | $5 credit | $5.00 per 1M tokens |
| **DALL-E 3** | No free tier | $0.040 per image |

## Quality Comparison

Gemini has been tuned to match your archetype personalities:

- **Mirror**: Emotional validation and inner truth
- **Therapist**: Clinical language with therapeutic concepts  
- **Realist**: Direct, tough-love approach
- **Poet**: Lyrical, metaphorical language
- **Best Friend**: Contemporary, supportive language with Instagram-worthy quotes

## Troubleshooting

### If Gemini initialization fails:
1. Check your API key is correct
2. Ensure you have internet connection
3. Verify the key has proper permissions

### If responses seem generic:
- The system will use fallback responses if the API fails
- Check the console for "Using cached Gemini response" or "Gemini API call successful"

### Rate limiting:
- Free tier: 15 requests/minute
- Consider upgrading to paid tier if needed

## Recommended Strategy

1. **Development**: Use Gemini (free tier)
2. **Production**: Mix of both with Gemini as fallback
3. **Image Generation**: Disable DALL-E, use solid color backgrounds for now
4. **Future**: Consider Stability AI for image generation 