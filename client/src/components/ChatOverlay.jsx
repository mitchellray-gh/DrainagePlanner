import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Leaf, Loader2, Brain } from 'lucide-react'

function getOfflineResponse(message) {
  const lower = message.toLowerCase()

  if (lower.includes('french drain')) {
    return "French drains are great for redirecting subsurface water! They consist of a perforated pipe surrounded by gravel in a trench. Key tips:\n\n• Dig a trench 18-24\" deep with a 1% minimum slope\n• Use landscape fabric to prevent soil clogging\n• Fill with 3/4\" washed gravel\n• Use 4\" perforated PVC or corrugated pipe\n• Ensure it outlets to a safe discharge point\n\nWant to know more about sizing or installation?"
  }
  if (lower.includes('rain garden')) {
    return "Rain gardens are beautiful AND functional! They capture and filter stormwater runoff. Here's the basics:\n\n• Locate 10+ feet from foundations\n• Size it to about 20-30% of the area draining to it\n• Dig 6-8\" deep with a flat bottom\n• Use a mix of 60% sand, 20% compost, 20% topsoil\n• Plant with native species tolerant of wet/dry cycles\n• Great plants: Black-eyed Susan, Switchgrass, Blue Flag Iris\n\nShall I suggest plants for your climate zone?"
  }
  if (lower.includes('slope') || lower.includes('grading')) {
    return "Proper grading is the #1 drainage solution! Guidelines:\n\n• Minimum 2% slope (1/4\" per foot) away from foundations\n• Ideal: 5% slope for first 10 feet from the house\n• Use a string level or laser level to check grade\n• Build up soil at the foundation if needed\n• Consider a swale for redirecting sheet flow\n\nWould you like tips on calculating slope or creating a swale?"
  }
  if (lower.includes('erosion')) {
    return "Erosion control is critical for slopes and disturbed areas! Options include:\n\n• Groundcover plants (creeping juniper, vinca, pachysandra)\n• Erosion control blankets for new seeding\n• Riprap or river rock for concentrated flow areas\n• Terracing with retaining walls\n• Bioswales with deep-rooted native grasses\n• Mulch (3-4\" layer) for immediate protection\n\nThe best solution depends on slope steepness and water volume. What's your situation?"
  }
  if (lower.includes('plant') || lower.includes('native')) {
    return "Native plants are excellent for drainage landscapes! They develop deep root systems that improve infiltration. Popular choices:\n\n🌿 Wet areas: Blue Flag Iris, Cardinal Flower, Switchgrass, Soft Rush\n🌿 Moist areas: Black-Eyed Susan, Coneflower, Fern, Daylily\n🌿 Dry/slopes: Sedum, Creeping Juniper, Lavender, Prairie Dropseed\n\nFor best results, choose plants rated for your USDA Hardiness Zone. What zone are you in?"
  }
  if (lower.includes('soil') || lower.includes('clay')) {
    return "Soil type dramatically affects drainage! Here's a quick guide:\n\n• Sand/Gravel (Group A): Drains fast, rarely pools\n• Loam (Group B): Good balance, ideal for most landscapes\n• Silt/Silty Clay (Group C): Slow drainage, may need amendments\n• Clay/Heavy Clay (Group D): Very slow, water pools easily\n\nFor clay soils: consider raised beds, French drains, or amending with gypsum and organic matter. A perc test can confirm your drainage rate.\n\nWhat soil type are you working with?"
  }
  if (lower.includes('catch basin') || lower.includes('basin')) {
    return "Catch basins are perfect for collecting surface water! Key points:\n\n• Place at low spots where water collects\n• Size the grate for expected flow volume\n• Connect to underground pipe (minimum 1% slope)\n• Use a sump to trap debris before it enters pipes\n• Clean out seasonally to prevent clogging\n• Consider a 12\" or 18\" basin for residential use\n\nWant to know about sizing or connecting multiple basins?"
  }
  if (lower.includes('dry well') || lower.includes('drywell')) {
    return "Dry wells are great for dispersing collected water underground! Tips:\n\n• Size based on expected runoff volume\n• Place at least 10 feet from foundations\n• Dig 4+ feet deep into permeable soil layer\n• Fill with gravel or use a prefab chamber\n• Connect downspouts or French drain outlets to it\n• Won't work well in clay — do a perc test first\n\nWould you like help calculating the size you need?"
  }
  if (lower.includes('swale') || lower.includes('bioswale')) {
    return "Swales are shallow channels that direct and slow water flow! Benefits:\n\n• Creates natural-looking drainage path\n• Allows water to infiltrate as it flows\n• Can be planted with native grasses\n• Minimum 1% slope along the bottom\n• Typical depth: 6-12 inches\n• Side slopes no steeper than 3:1\n\nBioswales add plants and engineered soil for water quality treatment. Great for managing roof runoff or driveway drainage!"
  }
  if (lower.includes('retaining wall') || lower.includes('wall')) {
    return "Retaining walls help manage slopes and drainage! Consider:\n\n• Walls over 4 feet usually need engineering\n• Always include drainage behind the wall (gravel + perforated pipe)\n• Use geogrid reinforcement for taller walls\n• Materials: concrete block, natural stone, timber, gabion\n• Weep holes allow water to escape and reduce pressure\n• Proper backfill drainage prevents wall failure\n\nWhat height are you considering?"
  }

  return "I'm your landscaping and drainage assistant! I can help with:\n\n🌧️ **Drainage** — French drains, catch basins, grading, dry wells, swales\n🌿 **Landscaping** — Rain gardens, native plants, bioswales\n🏗️ **Hardscaping** — Retaining walls, permeable pavers\n🌱 **Lawn & Garden** — Soil improvement, erosion control\n\nJust ask me anything about outdoor projects and I'll do my best to help!"
}

export default function ChatOverlay({ ai, currentProject }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your landscaping & drainage assistant. Ask me about rain gardens, French drains, native plants, erosion control, soil types, grading, or anything outdoor-related! 🌿\n\nI also have an AI model that can predict recommended drainage elements for your project." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEnd = useRef(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    // Check if user is asking for AI predictions
    const lowerMsg = userMsg.toLowerCase()
    if ((lowerMsg.includes('predict') || lowerMsg.includes('recommend') || lowerMsg.includes('ai') || lowerMsg.includes('suggest')) && ai?.isReady && currentProject) {
      const predictions = ai.getPredictions(currentProject)
      if (predictions) {
        const recommended = predictions.filter(p => p.recommended)
        let reply = '🧠 **AI Model Predictions** for your project:\n\n'
        if (recommended.length > 0) {
          reply += recommended.map(p => `✅ ${p.label} (${(p.confidence * 100).toFixed(0)}% confidence)`).join('\n')
          reply += '\n\nOther considerations:\n'
          reply += predictions.filter(p => !p.recommended).map(p => `• ${p.label} (${(p.confidence * 100).toFixed(0)}%)`).join('\n')
        } else {
          reply += 'Model confidence is low for all element types. Consider:\n'
          reply += predictions.slice(0, 3).map(p => `• ${p.label} (${(p.confidence * 100).toFixed(0)}%)`).join('\n')
          reply += '\n\nTry retraining the model with more project data for better predictions.'
        }
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages.slice(-10) })
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Sorry, I could not process that request. Please try again.' }])
      }
    } catch (err) {
      // API unreachable — use client-side fallback responses
      const fallbackReply = getOfflineResponse(userMsg)
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackReply }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Chat Bubble */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Leaf size={16} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">Outdoor Assistant</div>
                <div className="text-white/70 text-xs">Landscaping · Drainage · Grading</div>
              </div>
              {ai?.isReady && (
                <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full">
                  <Brain size={10} className="text-green-300" />
                  <span className="text-[10px] text-green-300 font-medium">AI</span>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-700 rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-bl-md">
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEnd} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about drainage, landscaping..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
