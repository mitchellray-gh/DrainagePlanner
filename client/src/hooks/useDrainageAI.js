/**
 * useDrainageAI — React hook for managing the browser-based drainage AI model
 * Handles model loading, training, inference, and status tracking
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { trainModel, saveModel, loadModel, hasStoredModel, deleteStoredModel, predict } from '../lib/drainageModel'
import { projectToFeatures } from '../lib/trainingDataTransformer'
import { apiGet } from '../lib/api'

// Model status enum
export const MODEL_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  TRAINING: 'training',
  READY: 'ready',
  ERROR: 'error',
  NO_DATA: 'no_data'
}

export default function useDrainageAI() {
  const [status, setStatus] = useState(MODEL_STATUS.IDLE)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [lastTrained, setLastTrained] = useState(null)
  const modelRef = useRef(null)

  // Try to load existing model on mount
  useEffect(() => {
    async function init() {
      setStatus(MODEL_STATUS.LOADING)
      try {
        const exists = await hasStoredModel()
        if (exists) {
          const model = await loadModel()
          if (model) {
            modelRef.current = model
            setStatus(MODEL_STATUS.READY)
            // Retrieve last trained timestamp from localStorage
            const ts = localStorage.getItem('drainageAI_lastTrained')
            if (ts) setLastTrained(new Date(ts))
            return
          }
        }
        setStatus(MODEL_STATUS.IDLE)
      } catch (e) {
        setStatus(MODEL_STATUS.IDLE)
      }
    }
    init()
  }, [])

  /**
   * Train (or retrain) the model using data from the API
   */
  const train = useCallback(async () => {
    setStatus(MODEL_STATUS.TRAINING)
    setProgress({ epoch: 0, totalEpochs: 0, loss: 0, accuracy: 0 })
    setError(null)

    try {
      // Fetch training data from server
      const response = await apiGet('/api/ai/training-data')
      if (!response.success || !response.samples || response.samples.length === 0) {
        setStatus(MODEL_STATUS.NO_DATA)
        setError('No training data available. Save some projects first!')
        return
      }

      // Train the model
      const model = await trainModel(response.samples, (prog) => {
        setProgress(prog)
      })

      // Save to IndexedDB
      await saveModel(model)
      modelRef.current = model

      const now = new Date()
      setLastTrained(now)
      localStorage.setItem('drainageAI_lastTrained', now.toISOString())
      localStorage.setItem('drainageAI_sampleCount', String(response.samples.length))

      setStatus(MODEL_STATUS.READY)
      setProgress(null)
    } catch (e) {
      setError(e.message)
      setStatus(MODEL_STATUS.ERROR)
    }
  }, [])

  /**
   * Get predictions for a project
   * @param {Object} project - Project data
   * @returns {Array|null} Sorted predictions with confidence
   */
  const getPredictions = useCallback((project) => {
    if (!modelRef.current || status !== MODEL_STATUS.READY) return null

    const features = projectToFeatures(project)
    if (!features) return null

    try {
      return predict(modelRef.current, features)
    } catch (e) {
      console.error('Prediction error:', e)
      return null
    }
  }, [status])

  /**
   * Reset the model (delete from IndexedDB)
   */
  const resetModel = useCallback(async () => {
    await deleteStoredModel()
    modelRef.current = null
    setStatus(MODEL_STATUS.IDLE)
    setLastTrained(null)
    setProgress(null)
    localStorage.removeItem('drainageAI_lastTrained')
    localStorage.removeItem('drainageAI_sampleCount')
  }, [])

  return {
    status,
    progress,
    error,
    lastTrained,
    isReady: status === MODEL_STATUS.READY,
    train,
    getPredictions,
    resetModel
  }
}
