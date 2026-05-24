/**
 * AIRecommendations — Displays AI-predicted drainage recommendations
 * Shows model status, predictions with confidence bars, and training controls
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, RefreshCw, Trash2, Loader2, CheckCircle2, AlertCircle, Zap } from 'lucide-react'
import { MODEL_STATUS } from '../hooks/useDrainageAI'

export default function AIRecommendations({ ai, currentProject }) {
  const { status, progress, error, lastTrained, isReady, train, getPredictions, resetModel } = ai
  const [predictions, setPredictions] = useState(null)

  const runPrediction = () => {
    if (!currentProject || !isReady) return
    const results = getPredictions(currentProject)
    setPredictions(results)
  }

  const handleTrain = async () => {
    setPredictions(null)
    await train()
  }

  return (
    <div className="section-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-purple-600" />
          <h3 className="font-bold text-slate-800">AI Recommendations</h3>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-2">
          {isReady && currentProject && (
            <button
              onClick={runPrediction}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-1 transition-colors"
            >
              <Zap size={12} />
              Predict
            </button>
          )}
          <button
            onClick={handleTrain}
            disabled={status === MODEL_STATUS.TRAINING}
            className="text-xs px-3 py-1.5 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 disabled:opacity-50 flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={12} className={status === MODEL_STATUS.TRAINING ? 'animate-spin' : ''} />
            {isReady ? 'Retrain' : 'Train Model'}
          </button>
          {isReady && (
            <button
              onClick={resetModel}
              className="text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Reset model"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Training Progress */}
      {status === MODEL_STATUS.TRAINING && progress && (
        <div className="mb-4 p-3 bg-brand-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={14} className="animate-spin text-brand-600" />
            <span className="text-xs text-brand-700 font-medium">
              Training... Epoch {progress.epoch}/{progress.totalEpochs}
            </span>
          </div>
          <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-brand-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(progress.epoch / progress.totalEpochs) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-brand-600">
            <span>Loss: {progress.loss?.toFixed(4)}</span>
            <span>Accuracy: {((progress.accuracy || 0) * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}

      {/* Model Info */}
      {isReady && lastTrained && (
        <div className="mb-4 text-xs text-slate-500">
          Model trained {lastTrained.toLocaleDateString()} at {lastTrained.toLocaleTimeString()}
          {localStorage.getItem('drainageAI_sampleCount') && (
            <span> • {localStorage.getItem('drainageAI_sampleCount')} training samples</span>
          )}
        </div>
      )}

      {/* Idle / No data prompts */}
      {status === MODEL_STATUS.IDLE && (
        <p className="text-sm text-slate-500">
          Train the AI model on your saved projects to get intelligent drainage recommendations. 
          The model runs entirely in your browser — no data leaves your device.
        </p>
      )}
      {status === MODEL_STATUS.NO_DATA && (
        <p className="text-sm text-amber-600">
          No project data available for training. Create and save some drainage projects first!
        </p>
      )}

      {/* Predictions */}
      {predictions && predictions.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Recommended Elements</p>
          {predictions.map((pred) => (
            <div key={pred.type} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-medium ${pred.recommended ? 'text-slate-800' : 'text-slate-400'}`}>
                    {pred.label}
                  </span>
                  <span className={`text-xs ${pred.recommended ? 'text-green-600' : 'text-slate-400'}`}>
                    {(pred.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pred.confidence > 0.7 ? 'bg-green-500' :
                      pred.confidence > 0.4 ? 'bg-amber-400' :
                      'bg-slate-300'
                    }`}
                    style={{ width: `${pred.confidence * 100}%` }}
                  />
                </div>
              </div>
              {pred.recommended && (
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
              )}
            </div>
          ))}
          {predictions.filter(p => p.recommended).length === 0 && (
            <p className="text-xs text-slate-400 italic mt-2">
              Model confidence is low — consider adding more project data and retraining.
            </p>
          )}
        </div>
      )}

      {/* No project selected */}
      {!currentProject && isReady && (
        <p className="text-sm text-slate-400 italic">Select a project to get AI predictions.</p>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const config = {
    [MODEL_STATUS.IDLE]: { text: 'Untrained', color: 'bg-slate-100 text-slate-500' },
    [MODEL_STATUS.LOADING]: { text: 'Loading...', color: 'bg-blue-100 text-blue-600' },
    [MODEL_STATUS.TRAINING]: { text: 'Training', color: 'bg-amber-100 text-amber-600' },
    [MODEL_STATUS.READY]: { text: 'Ready', color: 'bg-green-100 text-green-700' },
    [MODEL_STATUS.ERROR]: { text: 'Error', color: 'bg-red-100 text-red-600' },
    [MODEL_STATUS.NO_DATA]: { text: 'No Data', color: 'bg-amber-100 text-amber-600' },
  }

  const { text, color } = config[status] || config[MODEL_STATUS.IDLE]
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{text}</span>
  )
}
