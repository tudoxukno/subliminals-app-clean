# Subliminals Backend API

A Node.js/Express backend with ChatGPT integration for generating personalized subliminal messages through different archetypes.

## Features

- **4 Unique Archetypes**: Mirror, Therapist, Realist, and Poet
- **ChatGPT Integration**: Uses OpenAI's GPT-4 for personalized responses
- **Fallback System**: Graceful degradation when API is unavailable
- **TypeScript**: Full type safety and modern development experience
- **CORS Enabled**: Ready for React Native frontend integration

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   NODE_ENV=development
   ```

3. **Development**
   ```bash
   npm run dev
   ```

4. **Production**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Health Check
```
GET /health
```

### Get Archetypes
```
GET /archetypes
```

### Generate Subliminal
```
POST /generate
Content-Type: application/json

{
  "userInput": "I feel overwhelmed",
  "archetype": "Mirror"
}
```

## Archetypes

- **Mirror** 🪞 - Reflects your inner truth with gentle honesty
- **Therapist** 🧠 - Provides professional, empathetic guidance  
- **Realist** ⚖️ - Offers practical, grounded perspective
- **Poet** 🌙 - Speaks in beautiful, metaphorical language

## Response Format

```json
{
  "success": true,
  "data": {
    "icon": "🪞",
    "response": "Short supportive message...",
    "fullMessage": "Longer detailed guidance...",
    "quote": "Inspiring quote...",
    "tags": ["self-awareness", "growth", "healing"]
  }
}
``` 