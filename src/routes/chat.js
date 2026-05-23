/**
 * Chat Route — Conversational LLM for landscaping/drainage assistance
 * Uses OpenAI-compatible API (configurable via OPENAI_API_KEY / CHAT_API_URL)
 */
const express = require('express');
const router = express.Router();

const SYSTEM_PROMPT = `You are a friendly and knowledgeable outdoor assistant specializing in:
- Yard drainage solutions (French drains, catch basins, channel drains, dry wells)
- Landscaping and landscape design
- Rain gardens and bioswales
- Native plant recommendations
- Soil types and soil improvement
- Erosion control techniques
- Grading and slope management
- Hardscaping (patios, retaining walls, permeable pavers)
- Irrigation and water management
- Lawn care and yard maintenance
- Tree and shrub selection
- Outdoor living spaces

Keep responses helpful, concise, and practical. If someone asks about something unrelated to outdoor/landscaping/drainage topics, politely redirect them back to your area of expertise. You can provide general advice but always recommend consulting local professionals for major projects.`;

router.post('/', async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const apiUrl = process.env.CHAT_API_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.CHAT_MODEL || 'gpt-3.5-turbo';

  if (!apiKey) {
    // Provide a helpful fallback response without an API key
    return res.json({
      success: true,
      reply: getFallbackResponse(message)
    });
  }

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
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, max_tokens: 500, temperature: 0.7 })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Chat API error:', response.status, errText);
      return res.json({ success: true, reply: getFallbackResponse(message) });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';

    res.json({ success: true, reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.json({ success: true, reply: getFallbackResponse(message) });
  }
});

function getFallbackResponse(message) {
  const lower = message.toLowerCase();

  if (lower.includes('french drain')) {
    return "French drains are great for redirecting subsurface water! They consist of a perforated pipe surrounded by gravel in a trench. Key tips:\n\n• Dig a trench 18-24\" deep with a 1% minimum slope\n• Use landscape fabric to prevent soil clogging\n• Fill with 3/4\" washed gravel\n• Use 4\" perforated PVC or corrugated pipe\n• Ensure it outlets to a safe discharge point\n\nWant to know more about sizing or installation?";
  }
  if (lower.includes('rain garden')) {
    return "Rain gardens are beautiful AND functional! They capture and filter stormwater runoff. Here's the basics:\n\n• Locate 10+ feet from foundations\n• Size it to about 20-30% of the area draining to it\n• Dig 6-8\" deep with a flat bottom\n• Use a mix of 60% sand, 20% compost, 20% topsoil\n• Plant with native species tolerant of wet/dry cycles\n• Great plants: Black-eyed Susan, Switchgrass, Blue Flag Iris\n\nShall I suggest plants for your climate zone?";
  }
  if (lower.includes('slope') || lower.includes('grading')) {
    return "Proper grading is the #1 drainage solution! Guidelines:\n\n• Minimum 2% slope (1/4\" per foot) away from foundations\n• Ideal: 5% slope for first 10 feet from the house\n• Use a string level or laser level to check grade\n• Build up soil at the foundation if needed\n• Consider a swale for redirecting sheet flow\n\nWould you like tips on calculating slope or creating a swale?";
  }
  if (lower.includes('erosion')) {
    return "Erosion control is critical for slopes and disturbed areas! Options include:\n\n• Groundcover plants (creeping juniper, vinca, pachysandra)\n• Erosion control blankets for new seeding\n• Riprap or river rock for concentrated flow areas\n• Terracing with retaining walls\n• Bioswales with deep-rooted native grasses\n• Mulch (3-4\" layer) for immediate protection\n\nThe best solution depends on slope steepness and water volume. What's your situation?";
  }
  if (lower.includes('plant') || lower.includes('native')) {
    return "Native plants are excellent for drainage landscapes! They develop deep root systems that improve infiltration. Popular choices:\n\n🌿 Wet areas: Blue Flag Iris, Cardinal Flower, Switchgrass, Soft Rush\n🌿 Moist areas: Black-Eyed Susan, Coneflower, Fern, Daylily\n🌿 Dry/slopes: Sedum, Creeping Juniper, Lavender, Prairie Dropseed\n\nFor best results, choose plants rated for your USDA Hardiness Zone. What zone are you in?";
  }
  if (lower.includes('soil') || lower.includes('clay')) {
    return "Soil type dramatically affects drainage! Here's a quick guide:\n\n• Sand/Gravel (Group A): Drains fast, rarely pools\n• Loam (Group B): Good balance, ideal for most landscapes\n• Silt/Silty Clay (Group C): Slow drainage, may need amendments\n• Clay/Heavy Clay (Group D): Very slow, water pools easily\n\nFor clay soils: consider raised beds, French drains, or amending with gypsum and organic matter. A perc test can confirm your drainage rate.\n\nWhat soil type are you working with?";
  }

  return "I'm your landscaping and drainage assistant! I can help with:\n\n🌧️ **Drainage** — French drains, catch basins, grading, dry wells\n🌿 **Landscaping** — Rain gardens, native plants, bioswales\n🏗️ **Hardscaping** — Retaining walls, permeable pavers\n🌱 **Lawn & Garden** — Soil improvement, erosion control\n\nJust ask me anything about outdoor projects and I'll do my best to help! Note: For full AI-powered responses, configure the OPENAI_API_KEY environment variable.";
}

module.exports = router;
