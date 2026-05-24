import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Leaf, Loader2, Brain } from 'lucide-react'

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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Chat is currently unavailable. Please configure OPENAI_API_KEY to enable the assistant.' }])
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
