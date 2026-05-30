import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Save, Trash2, MapPin, Search, Building2 } from 'lucide-react'
import { apiPost, apiPut, apiDelete } from '../lib/api'

const SOIL_TYPES = [
  { value: 'unknown', label: 'Unknown — Soil Test Recommended' },
  { value: 'sand', label: 'Sand (Hydrologic Group A)' },
  { value: 'sandy_loam', label: 'Sandy Loam (Group A)' },
  { value: 'loam', label: 'Loam (Group B)' },
  { value: 'silt', label: 'Silt (Group B)' },
  { value: 'silty_clay', label: 'Silty Clay (Group C)' },
  { value: 'clay', label: 'Clay (Group D)' },
  { value: 'heavy_clay', label: 'Heavy/Expansive Clay (Group D)' },
  { value: 'gravel', label: 'Gravel/Coarse (Group A)' },
]

function useAddressSuggest(query) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setSuggestions([])
      return
    }
    // Debounce 400ms
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/analysis/address-suggest?q=${encodeURIComponent(query.trim())}`)
        const data = await res.json()
        if (data.success && data.suggestions) {
          setSuggestions(data.suggestions)
        } else {
          setSuggestions([])
        }
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => clearTimeout(timerRef.current)
  }, [query])

  return { suggestions, loading }
}

export default function ProjectSetup({ currentProject, setCurrentProject, showNotification, navigate }) {
  const [form, setForm] = useState({
    name: '', address: '', latitude: '', longitude: '',
    property_area_sqft: '', soil_type: 'unknown',
    avg_annual_rainfall_in: '', climate_zone: '', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const addressRef = useRef(null)
  const suggestionsRef = useRef(null)

  const { suggestions, loading: suggestLoading } = useAddressSuggest(showSuggestions ? form.address : '')

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          addressRef.current && !addressRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (currentProject) {
      setForm({
        name: currentProject.name || '',
        address: currentProject.address || '',
        latitude: currentProject.latitude || '',
        longitude: currentProject.longitude || '',
        property_area_sqft: currentProject.property_area_sqft || '',
        soil_type: currentProject.soil_type || 'unknown',
        avg_annual_rainfall_in: currentProject.avg_annual_rainfall_in || '',
        climate_zone: currentProject.climate_zone || '',
        notes: currentProject.notes || ''
      })
    }
  }, [currentProject])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === 'address') setShowSuggestions(true)
  }

  const handleSelectSuggestion = (suggestion) => {
    setForm(prev => ({
      ...prev,
      address: suggestion.display_name,
      latitude: suggestion.lat?.toFixed(6) || prev.latitude,
      longitude: suggestion.lon?.toFixed(6) || prev.longitude,
      property_area_sqft: suggestion.approx_area_sqft || prev.property_area_sqft,
    }))
    setShowSuggestions(false)
    showNotification('Address filled from suggestion!', 'success')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return showNotification('Project name is required', 'warning')
    setSaving(true)

    const payload = {
      ...form,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      property_area_sqft: form.property_area_sqft ? parseFloat(form.property_area_sqft) : null,
      avg_annual_rainfall_in: form.avg_annual_rainfall_in ? parseFloat(form.avg_annual_rainfall_in) : null,
    }

    try {
      let data
      if (currentProject?.id) {
        data = await apiPut(`/api/projects/${currentProject.id}`, payload)
      } else {
        data = await apiPost('/api/projects', payload)
      }
      if (data.success) {
        setCurrentProject({ ...currentProject, ...data.project })
        showNotification('Project saved!', 'success')
      } else {
        showNotification('Error: ' + (data.error || 'Unknown'), 'error')
      }
    } catch (err) {
      showNotification('Save error: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!currentProject?.id) return
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      const data = await apiDelete(`/api/projects/${currentProject.id}`)
      if (data.success) {
        setCurrentProject(null)
        setForm({ name: '', address: '', latitude: '', longitude: '', property_area_sqft: '', soil_type: 'unknown', avg_annual_rainfall_in: '', climate_zone: '', notes: '' })
        navigate('dashboard')
        showNotification('Project deleted', 'success')
      }
    } catch (err) {
      showNotification('Delete error: ' + err.message, 'error')
    }
  }

  const handleAutofill = async () => {
    if (!form.address.trim()) return showNotification('Enter an address first', 'warning')
    showNotification('Looking up address...', 'info')
    try {
      const res = await fetch(`/api/analysis/geocode?address=${encodeURIComponent(form.address)}`)
      const data = await res.json()
      if (data.success && data.result) {
        setForm(prev => ({
          ...prev,
          address: data.result.display_name || prev.address,
          latitude: data.result.lat?.toFixed(6) || prev.latitude,
          longitude: data.result.lon?.toFixed(6) || prev.longitude,
          property_area_sqft: data.result.approx_area_sqft || prev.property_area_sqft,
        }))
        showNotification('Address filled!', 'success')
      } else {
        showNotification('Geocode failed', 'error')
      }
    } catch (err) {
      showNotification('Geocode error: ' + err.message, 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Project Setup</h1>
        {currentProject?.id && (
          <button onClick={handleDelete} className="btn-danger flex items-center gap-2 text-sm">
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Project Name */}
        <div className="section-card">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name *</label>
          <input
            name="name" value={form.name} onChange={handleChange}
            placeholder="e.g., Smith Residence Drainage"
            className="input-field" required
          />
        </div>

        {/* Address & Location */}
        <div className="section-card">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-brand-600" /> Location
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Property Address</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    ref={addressRef}
                    name="address" value={form.address} onChange={handleChange}
                    onFocus={() => form.address.trim().length >= 3 && setShowSuggestions(true)}
                    placeholder="123 Main St, City, State ZIP"
                    className="input-field w-full"
                    autoComplete="off"
                  />
                  {showSuggestions && (suggestions.length > 0 || suggestLoading) && (
                    <div ref={suggestionsRef} className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {suggestLoading && <div className="px-4 py-2 text-sm text-slate-500">Searching...</div>}
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSelectSuggestion(s)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-brand-50 hover:text-brand-700 border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <span className="font-medium">{s.display_name.split(',')[0]}</span>
                          <span className="text-slate-500 ml-1">{s.display_name.split(',').slice(1).join(',')}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={handleAutofill} className="btn-outline flex items-center gap-2 whitespace-nowrap">
                  <Search size={16} /> Auto-fill
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Start typing for suggestions, or click Auto-fill to look up the full address</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Latitude</label>
                <input name="latitude" value={form.latitude} onChange={handleChange} type="number" step="any" placeholder="35.2271" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Longitude</label>
                <input name="longitude" value={form.longitude} onChange={handleChange} type="number" step="any" placeholder="-80.8431" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Property Area (sq ft)</label>
                <input name="property_area_sqft" value={form.property_area_sqft} onChange={handleChange} type="number" placeholder="15000" className="input-field" />
              </div>
            </div>
          </div>
        </div>

        {/* Site Conditions */}
        <div className="section-card">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-brand-600" /> Site Conditions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Soil Type</label>
              <select name="soil_type" value={form.soil_type} onChange={handleChange} className="input-field">
                {SOIL_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Avg Annual Rainfall (in)</label>
              <input name="avg_annual_rainfall_in" value={form.avg_annual_rainfall_in} onChange={handleChange} type="number" step="0.1" placeholder="47" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">USDA Hardiness Zone</label>
              <input name="climate_zone" value={form.climate_zone} onChange={handleChange} placeholder="e.g., 7b" className="input-field" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="section-card">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Notes & Observations</label>
          <textarea
            name="notes" value={form.notes} onChange={handleChange} rows="3"
            placeholder="Describe any water issues, flooding, foundation cracks..."
            className="input-field resize-y"
          />
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-lg px-6 py-3">
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
