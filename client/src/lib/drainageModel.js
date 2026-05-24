/**
 * DrainageModel — TensorFlow.js browser-based neural network
 * Trains on saved project data to recommend drainage elements
 */
import * as tf from '@tensorflow/tfjs'

const MODEL_KEY = 'indexeddb://drainage-recommendation-model'
const FEATURE_COUNT = 20
const OUTPUT_COUNT = 7 // drainage element types

const ELEMENT_TYPES = [
  'french_drain',
  'catch_basin',
  'rain_garden',
  'dry_well',
  'swale',
  'channel_drain',
  'grading'
]

const ELEMENT_LABELS = [
  'French Drain',
  'Catch Basin',
  'Rain Garden',
  'Dry Well',
  'Swale',
  'Channel Drain',
  'Grading'
]

/**
 * Create the neural network architecture
 */
function createModel() {
  const model = tf.sequential()

  model.add(tf.layers.dense({
    inputShape: [FEATURE_COUNT],
    units: 32,
    activation: 'relu',
    kernelInitializer: 'glorotUniform'
  }))

  model.add(tf.layers.dropout({ rate: 0.2 }))

  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu',
    kernelInitializer: 'glorotUniform'
  }))

  model.add(tf.layers.dense({
    units: OUTPUT_COUNT,
    activation: 'sigmoid'
  }))

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  })

  return model
}

/**
 * Train the model on provided samples
 * @param {Array} samples - Array of {features: number[], labels: number[]}
 * @param {Function} onProgress - Callback with {epoch, loss, accuracy}
 * @returns {tf.Sequential} Trained model
 */
async function trainModel(samples, onProgress = null) {
  if (!samples || samples.length === 0) {
    throw new Error('No training data available')
  }

  const model = createModel()

  const xs = tf.tensor2d(samples.map(s => s.features), [samples.length, FEATURE_COUNT])
  const ys = tf.tensor2d(samples.map(s => s.labels), [samples.length, OUTPUT_COUNT])

  const epochs = Math.min(100, Math.max(30, Math.floor(200 / Math.sqrt(samples.length))))

  await model.fit(xs, ys, {
    epochs,
    batchSize: Math.min(32, Math.max(4, Math.floor(samples.length / 4))),
    validationSplit: samples.length > 20 ? 0.2 : 0,
    shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (onProgress) {
          onProgress({
            epoch: epoch + 1,
            totalEpochs: epochs,
            loss: logs.loss,
            accuracy: logs.acc || logs.accuracy
          })
        }
      }
    }
  })

  // Clean up tensors
  xs.dispose()
  ys.dispose()

  return model
}

/**
 * Save trained model to IndexedDB
 */
async function saveModel(model) {
  await model.save(MODEL_KEY)
}

/**
 * Load model from IndexedDB
 * @returns {tf.Sequential|null}
 */
async function loadModel() {
  try {
    const model = await tf.loadLayersModel(MODEL_KEY)
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    })
    return model
  } catch (e) {
    return null
  }
}

/**
 * Check if a saved model exists in IndexedDB
 */
async function hasStoredModel() {
  try {
    const models = await tf.io.listModels()
    return MODEL_KEY in models
  } catch (e) {
    return false
  }
}

/**
 * Delete stored model from IndexedDB
 */
async function deleteStoredModel() {
  try {
    await tf.io.removeModel(MODEL_KEY)
  } catch (e) {
    // Model may not exist
  }
}

/**
 * Run inference on a feature vector
 * @param {tf.Sequential} model
 * @param {number[]} features - Array of 20 normalized features
 * @returns {Array} Predictions with element types and confidence scores
 */
function predict(model, features) {
  const input = tf.tensor2d([features], [1, FEATURE_COUNT])
  const output = model.predict(input)
  const predictions = output.dataSync()

  input.dispose()
  output.dispose()

  return ELEMENT_TYPES.map((type, i) => ({
    type,
    label: ELEMENT_LABELS[i],
    confidence: Math.round(predictions[i] * 100) / 100,
    recommended: predictions[i] > 0.5
  })).sort((a, b) => b.confidence - a.confidence)
}

export {
  createModel,
  trainModel,
  saveModel,
  loadModel,
  hasStoredModel,
  deleteStoredModel,
  predict,
  ELEMENT_TYPES,
  ELEMENT_LABELS,
  FEATURE_COUNT,
  OUTPUT_COUNT
}
