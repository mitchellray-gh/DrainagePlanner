/**
 * Chat Route — Conversational LLM for landscaping/drainage assistance
 * 
 * Priority order:
 * 1. OpenAI-compatible API (if OPENAI_API_KEY is set)
 * 2. Local SmolLM2 model (loaded automatically, no API key needed)
 * 3. Knowledge-base response (immediate, while model loads)
 */
const express = require('express');
const router = express.Router();
const localLLM = require('../engine/localLLM');

const SYSTEM_PROMPT = [
  'You are a friendly and knowledgeable outdoor assistant specializing in:',
  '- Yard drainage solutions (French drains, catch basins, channel drains, dry wells)',
  '- Landscaping and landscape design',
  '- Rain gardens and bioswales',
  '- Native plant recommendations',
  '- Soil types and soil improvement',
  '- Erosion control techniques',
  '- Grading and slope management',
  '- Hardscaping (patios, retaining walls, permeable pavers)',
  '- Irrigation and water management',
  '- Lawn care and yard maintenance',
  '- Tree and shrub selection',
  '- Outdoor living spaces',
  '',
  'Keep responses helpful, concise, and practical. If someone asks about something unrelated to outdoor/landscaping/drainage topics, politely redirect them back to your area of expertise. You can provide general advice but always recommend consulting local professionals for major projects.'
].join('\n');

// Optionally load the local SmolLM2 model in the background. Off by default: the first
// run downloads ~100MB of weights from HuggingFace, which fails on locked-down networks
// and re-downloads on every serverless cold start. Set ENABLE_LOCAL_LLM=true to enable it;
// otherwise chat uses the OpenAI path (if OPENAI_API_KEY is set) or the knowledge base.
if (process.env.ENABLE_LOCAL_LLM === 'true') {
  localLLM.initModel();
}

router.post('/', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = process.env.CHAT_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.CHAT_MODEL || 'gpt-3.5-turbo';

  // If an external API key is configured, prefer it
  if (apiKey) {
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(history || []).slice(-10).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message }
      ];

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({ model, messages, max_tokens: 500, temperature: 0.7 })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
        return res.json({ success: true, reply });
      }

      const errText = await response.text();
      console.error('Chat API error:', response.status, errText);
      // Fall through to local model
    } catch (err) {
      console.error('Chat API error:', err.message);
      // Fall through to local model
    }
  }

  // Use local SmolLM2 model + knowledge base
  try {
    const reply = await localLLM.generateResponse(message, history);
    res.json({ success: true, reply });
  } catch (err) {
    console.error('Local LLM error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to generate response' });
  }
});

// GET /api/chat/status - Check model status
router.get('/status', (req, res) => {
  const status = localLLM.getStatus();
  const hasKey = !!process.env.OPENAI_API_KEY;
  res.json({
    success: true,
    ...status,
    hasApiKey: hasKey,
  });
});

module.exports = router;
