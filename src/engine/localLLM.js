/**
 * LocalLLM — Local language model engine using SmolLM2
 * 
 * Loads HuggingFace SmolLM2-135M-Instruct model for local inference
 * Uses the project's knowledge base for context-augmented generation
 */

const KnowledgeBase = require('./knowledgeBase');

let pipeline = null;
let generator = null;
let modelLoading = false;
let modelReady = false;
let loadError = null;
let lastLoadAttemptAt = 0;

// Model configuration
const MODEL_ID = 'HuggingFaceTB/SmolLM2-135M-Instruct';
const RETRY_COOLDOWN_MS = 30 * 1000;

/**
 * Initialize the model (async, called on first use or startup)
 */
async function initModel() {
  if (modelReady || modelLoading) return;
  modelLoading = true;
  lastLoadAttemptAt = Date.now();
  loadError = null;

  try {
    console.log(`[LocalLLM] Loading model: ${MODEL_ID}...`);
    console.log('[LocalLLM] This may take a moment on first run (downloading model weights)...');

    const { pipeline: pipelineFn } = await import('@huggingface/transformers');
    pipeline = pipelineFn;

    generator = await pipeline('text-generation', MODEL_ID, {
      dtype: 'q4',  // Use quantized model for faster inference and lower memory
      device: 'cpu',
    });

    modelReady = true;
    modelLoading = false;
    console.log('[LocalLLM] Model loaded successfully! Ready for inference.');
  } catch (err) {
    modelLoading = false;
    loadError = err.message;
    console.error('[LocalLLM] Failed to load model:', err.message);
    console.error('[LocalLLM] Falling back to knowledge-base-only responses.');
  }
}

/**
 * Generate a response using the local model + knowledge base
 */
async function generateResponse(userMessage, history = []) {
  if (!modelReady && !modelLoading && Date.now() - lastLoadAttemptAt >= RETRY_COOLDOWN_MS) {
    initModel().catch(err => {
      console.error('[LocalLLM] Retry init failed:', err && err.message ? err.message : err);
    });
  }

  // Find relevant knowledge for context
  const relevantKnowledge = KnowledgeBase.findRelevantKnowledge(userMessage, 2);
  const systemContext = KnowledgeBase.getSystemContext();

  // If model is ready, use it for generation
  if (modelReady && generator) {
    return await generateWithModel(userMessage, history, systemContext, relevantKnowledge);
  }

  // If model is still loading, use knowledge-base response
  if (modelLoading) {
    return generateKnowledgeResponse(userMessage, relevantKnowledge, '(Model is loading, providing knowledge-base response)');
  }

  // If model failed to load, use knowledge-base response
  return generateKnowledgeResponse(userMessage, relevantKnowledge);
}

/**
 * Generate response using the loaded SmolLM2 model
 */
async function generateWithModel(userMessage, history, systemContext, knowledge) {
  try {
    // Build context with knowledge
    let contextBlock = '';
    if (knowledge.length > 0) {
      contextBlock = '\n\nRelevant reference information:\n' + knowledge.join('\n\n---\n\n');
    }

    // Build messages array for chat
    const messages = [
      { role: 'system', content: systemContext + contextBlock },
    ];

    // Add recent history (last 4 exchanges)
    if (history && history.length > 0) {
      const recentHistory = history.slice(-8);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: userMessage });

    const output = await generator(messages, {
      max_new_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
      do_sample: true,
    });

    // Extract generated text from output
    const generated = output[0]?.generated_text;
    if (Array.isArray(generated)) {
      // Chat format: array of messages
      const assistantMsg = generated.find(m => m.role === 'assistant');
      if (assistantMsg) {
        return assistantMsg.content;
      }
      // Last message might be the response
      const lastMsg = generated[generated.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        return lastMsg.content;
      }
    }

    if (typeof generated === 'string') {
      // Extract the assistant's response from the generated text
      const parts = generated.split('[/INST]');
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
      // Try to find content after the last user message
      const userIdx = generated.lastIndexOf(userMessage);
      if (userIdx >= 0) {
        return generated.substring(userIdx + userMessage.length).trim();
      }
      return generated.trim();
    }

    // Fallback to knowledge response if generation fails
    return generateKnowledgeResponse(userMessage, knowledge);
  } catch (err) {
    console.error('[LocalLLM] Generation error:', err.message);
    return generateKnowledgeResponse(userMessage, knowledge);
  }
}

/**
 * Generate a response purely from knowledge base (fallback when model unavailable)
 * This provides a much better experience than the static keyword responses
 */
function generateKnowledgeResponse(userMessage, knowledge, prefix = '') {
  if (knowledge.length === 0) {
    // No specific knowledge found — provide general help
    const generalTopics = KnowledgeBase.KNOWLEDGE_CHUNKS.map(c => c.topic.replace(/_/g, ' ')).slice(0, 8);
    return `${prefix ? prefix + '\n\n' : ''}I'd be happy to help with your outdoor project! I have detailed knowledge about:

• **French drains** — design, sizing, installation, materials
• **Catch basins** — surface water collection at low points
• **Rain gardens** — bioretention with native plants
• **Grading & slopes** — proper drainage grades and re-grading
• **Soil types** — infiltration rates, amendments, compaction fixes
• **Retaining walls** — design, drainage behind walls, materials
• **Erosion control** — vegetation, structural solutions, slope stabilization
• **Permeable pavers** — types, installation, maintenance
• **Cost estimation** — budgeting for drainage and landscaping projects
• **Seasonal maintenance** — year-round care schedules

What specific area can I help you with? The more details you provide about your situation (soil type, yard size, specific problem), the better advice I can give!`;
  }

  // Format knowledge into a helpful response
  let response = prefix ? prefix + '\n\n' : '';

  // Use the most relevant knowledge chunk as the primary response
  const primaryKnowledge = knowledge[0];

  // Trim to a reasonable length and format nicely
  const lines = primaryKnowledge.split('\n').filter(l => l.trim());
  const relevantLines = lines.slice(0, 30); // First 30 lines of most relevant content

  response += relevantLines.join('\n');

  if (knowledge.length > 1) {
    response += '\n\n---\n\nI can also provide more details on related topics. Just ask!';
  }

  return response;
}

/**
 * Get model status
 */
function getStatus() {
  return {
    model: MODEL_ID,
    ready: modelReady,
    loading: modelLoading,
    error: loadError,
  };
}

module.exports = {
  initModel,
  generateResponse,
  getStatus,
};
