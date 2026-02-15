import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// ============================================
// Validation schemas
// ============================================

const chatRequestSchema = z.object({
  systemInstruction: z.string(),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })),
  userMessage: z.string().min(1).max(2000),
});

// ============================================
// Gemini client
// ============================================

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenerativeAI(apiKey);
}

// ============================================
// Routes
// ============================================

/** Health check */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    service: 'LELE AI',
    status: 'running',
    gemini: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

/** Chat endpoint — appel Gemini */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    }

    const { systemInstruction, history, userMessage } = parsed.data;

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();

    return res.json({ response });
  } catch (error) {
    console.error('[LELE AI] Chat error:', error);
    return res.status(500).json({
      error: 'AI processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
