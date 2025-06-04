import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  generateSubliminalResponse, 
  generateSubliminalResponseFast, 
  regenerateBackground, 
  generateCustomBackground, 
  getStyleName, 
  preGeneratePopularBackgrounds 
} from './openai';
import { generateSubliminalResponseWithGemini } from './gemini';
import { GenerateRequest, GenerateResponse, RegenerateBackgroundRequest, RegenerateBackgroundResponse } from './types';
import { archetypes } from './archetypes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Cache status endpoint
app.get('/cache-status', (req: Request, res: Response) => {
  // Note: We can't directly access the cache Maps from here since they're in openai.ts
  // This is a placeholder for cache statistics
  res.json({ 
    status: 'Cache monitoring available',
    timestamp: new Date().toISOString(),
    message: 'Background caching is active'
  });
});

// Get all archetypes
app.get('/archetypes', (req: Request, res: Response) => {
  const archetypeEntries = Object.values(archetypes);
  const archetypeList = archetypeEntries.map((archetype) => ({
    name: archetype.name,
    icon: archetype.icon,
    description: archetype.description
  }));
  
  res.json({ success: true, data: archetypeList });
});

// Fast generation endpoint (text only, no background)
app.post('/generate-fast', async (req: Request, res: Response) => {
  try {
    const { userInput, archetype } = req.body as GenerateRequest;
    
    if (!userInput || !archetype) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userInput and archetype' 
      });
    }

    // Try OpenAI first, fallback to Gemini if it fails
    let response;
    try {
      response = await generateSubliminalResponseFast(userInput, archetype);
    } catch (openaiError) {
      console.log('🔄 OpenAI fast failed, trying Gemini fallback...');
      response = await generateSubliminalResponseWithGemini(userInput, archetype);
    }
    
    res.json({ success: true, data: response });
  } catch (error: any) {
    console.error('Error in /generate-fast:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gemini generation endpoint (alternative to OpenAI)
app.post('/generate-gemini', async (req: Request, res: Response) => {
  try {
    const { userInput, archetype } = req.body as GenerateRequest;
    
    if (!userInput || !archetype) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userInput and archetype' 
      });
    }

    const response = await generateSubliminalResponseWithGemini(userInput, archetype);
    
    res.json({ success: true, data: response });
  } catch (error: any) {
    console.error('Error in /generate-gemini:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Main generation endpoint (full response with background)
app.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userInput, archetype } = req.body as GenerateRequest;
    
    if (!userInput || !archetype) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userInput and archetype' 
      });
    }

    // Try OpenAI first, fallback to Gemini if it fails
    let response;
    try {
      response = await generateSubliminalResponse(userInput, archetype);
    } catch (openaiError) {
      console.log('🔄 OpenAI failed, trying Gemini fallback...');
      response = await generateSubliminalResponseWithGemini(userInput, archetype);
    }
    
    res.json({ success: true, data: response });
  } catch (error: any) {
    console.error('Error in /generate:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate background image endpoint
app.post('/generate-background', async (req: Request, res: Response) => {
  try {
    const { archetype, userInput, response, quote, styleIndex } = req.body;
    
    if (!archetype || !userInput || !response || !quote) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: archetype, userInput, response, quote' 
      });
    }

    const backgroundImage = await generateCustomBackground(
      archetype, 
      userInput, 
      response, 
      quote, 
      styleIndex
    );
    
    const styleName = getStyleName(archetype, styleIndex || 0);
    
    res.json({ 
      success: true, 
      data: { 
        backgroundImage, 
        styleIndex: styleIndex || 0,
        styleName: styleName
      } 
    });
  } catch (error: any) {
    console.error('Error in /generate-background:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Regenerate background with different style
app.post('/regenerate-background', async (req: Request, res: Response) => {
  try {
    const { archetype, userInput, response, quote, currentStyleIndex } = req.body as RegenerateBackgroundRequest;
    
    if (!archetype || !userInput || !response || !quote) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: archetype, userInput, response, quote' 
      });
    }

    const result = await regenerateBackground(
      archetype, 
      userInput, 
      response, 
      quote, 
      currentStyleIndex
    );
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error in /regenerate-background:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server and pre-generate backgrounds
const startServer = async () => {
  try {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Subliminals API server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🎭 Archetypes: http://localhost:${PORT}/archetypes`);
      console.log(`💬 Generate: POST http://localhost:${PORT}/generate`);
    });

    // DISABLED: Pre-generate popular backgrounds - DALL-E is exhausted
    // console.log('🚀 Starting background pre-generation for popular prompts...');
    // await preGeneratePopularBackgrounds();
    console.log('🎨 DALL-E pre-generation disabled (quota exhausted)');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app; 