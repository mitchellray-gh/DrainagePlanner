import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import { Navigation, Plus, Trash2, Crosshair, MapPin } from 'lucide-react'
import { apiPost, apiGet } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'

const POINT_TYPES = [
  { value: 'ground', label: 'Ground' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'high_point', label: 'High Point' },
  { value: 'low_point', label: 'Low Point' },
  { value: 'drain', label: 'Existing Drain' },
  { value: 'gutter', label: 'Gutter/Downspout' },
  { value: 'property_corner', label: 'Property Corner' },
]

function MapClickHandler({ onMapClick, clickMode }) {
  useMapEvents({
    click(e) {
      if (clickMode) {
        onMapClick(e.latlng)
      }
    }
  })
  return null
}

function FlyToLocation({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 17, { duration: 1.5 })
    }
  }, [position, map])
  return null
}

export default function Survey({ currentProject, showNotification }) {
  const [points, setPoints] = useState([])
  const [clickMode, setClickMode] = useState(false)
  const [pendingPoint, setPendingPoint] = useState(null)
  const [form, setForm] = useState({ label: '', lat: '', lng: '', elevation: '', type: 'ground' })
  const [mapCenter, setMapCenter] = useState(null)
  const { position: gpsPos, loading: gpsLoading, getPosition } = useGeolocation()

  useEffect(() => {
    if (currentProject?.surveyPoints) {
      setPoints(currentProject.surveyPoints)
    }
    if (currentProject?.latitude && currentProject?.longitude) {
      setMapCenter({ lat: currentProject.latitude, lng: currentProject.longitude })
    }
  }, [currentProject])

  const handleMapClick = useCallback(async (latlng) => {
    setForm(prev => ({ ...prev, lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) }))
    setPendingPoint(latlng)
    setClickMode(false)

    // Auto-fetch elevation
    try {
      const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${latlng.lat},${latlng.lng}`)
      const data = await res.json()
      if (data.results?.[0]) {
        const elevFt = (data.results[0].elevation * 3.28084).toFixed(2)
        setForm(prev => ({ ...prev, elevation: elevFt }))
      }
    } catch (e) { /* elevation fetch failed */ }

    showNotification('Point placed! Fill in details and save.', 'info')
  }, [showNotification])

  const handleGPS = async () => {
    try {
      const coords = await getPosition()
      setForm(prev => ({
        ...prev,
        lat: coords.lat.toFixed(6),
        lng: coords.lng.toFixed(6),
        elevation: coords.elevation ? coords.elevation.toFixed(2) : prev.elevation
      }))
      setMapCenter(coords)
      setPendingPoint(coords)
      showNotification('GPS location acquired!', 'success')
    } catch (err) {
      showNotification('GPS failed: ' + (err.message || err), 'error')
    }
  }

  const handleAddPoint = async (e) => {
    e.preventDefault()
    if (!currentProject?.id) return showNotification('Save a project first', 'warning')
    if (!form.lat || !form.lng) return showNotification('Set coordinates first (click map or use GPS)', 'warning')

    try {
      const data = await apiPost(`/api/projects/${currentProject.id}/survey-points`, {
        label: form.label || `Point ${points.length + 1}`,
        latitude: parseFloat(form.lat),
        longitude: parseFloat(form.lng),
        elevation_ft: parseFloat(form.elevation) || 0,
        point_type: form.type,
      })
      if (data.success) {
        setPoints(prev => [...prev, data.point])
        setForm({ label: '', lat: '', lng: '', elevation: '', type: 'ground' })
        setPendingPoint(null)
        showNotification('Survey point added!', 'success')
      }
    } catch (err) {
      showNotification('Error: ' + err.message, 'error')
    }
  }

  const deletePoint = async (pointId) => {
    if (!currentProject?.id) return
    try {
      await fetch(`/api/projects/${currentProject.id}/survey-points/${pointId}`, { method: 'DELETE' })
      setPoints(prev => prev.filter(p => p.id !== pointId))
      showNotification('Point removed', 'success')
    } catch (err) {
      showNotification('Error deleting point', 'error')
    }
  }

  if (!currentProject) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <div className="text-5xl mb-4">📐</div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">No Project Selected</h2>
        <p className="text-slate-500">Create or select a project to add survey data.</p>
      </motion.div>
    )
  }

  const defaultCenter = mapCenter || { lat: 35.2271, lng: -80.8431 }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Survey & Topography</h1>
          <p className="text-slate-500 text-sm mt-1">Land Surveyor Module</p>
        </div>
      </div>

      {/* Map */}
      <div className="section-card p-0 overflow-hidden mb-6">
        <div className="relative">
          <div className="h-[350px] md:h-[450px]">
            <MapContainer
              center={[defaultCenter.lat, defaultCenter.lng]}
              zoom={16}
              className="h-full w-full z-0"
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={handleMapClick} clickMode={clickMode} />
              {mapCenter && <FlyToLocation position={mapCenter} />}

              {/* Existing points */}
              {points.map((pt, i) => (
                <Marker key={pt.id || i} position={[pt.latitude, pt.longitude]}>
                  <Popup>
                    <strong>{pt.label || `Point ${i + 1}`}</strong><br />
                    Elev: {pt.elevation_ft || '?'} ft<br />
                    Type: {pt.point_type || 'ground'}
                  </Popup>
                </Marker>
              ))}

              {/* Pending point */}
              {pendingPoint && (
                <Marker position={[pendingPoint.lat, pendingPoint.lng]} opacity={0.6}>
                  <Popup>New point (unsaved)</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {/* Map controls overlay */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => { setClickMode(!clickMode); showNotification(clickMode ? 'Click mode off' : 'Click map to place a point', 'info') }}
              className={`p-3 rounded-xl shadow-lg transition-all ${clickMode ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              title="Click to place point"
            >
              <Crosshair size={20} />
            </button>
            <button
              type="button"
              onClick={handleGPS}
              disabled={gpsLoading}
              className="p-3 rounded-xl shadow-lg bg-white text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
              title="Use GPS"
            >
              <Navigation size={20} className={gpsLoading ? 'animate-pulse' : ''} />
            </button>
          </div>

          {clickMode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-brand-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
              <MapPin size={14} className="inline mr-1" /> Tap map to place a point
            </div>
          )}
        </div>
      </div>

      {/* Add Point Form */}
      <div className="section-card">
        <h3 className="font-bold text-slate-900 mb-4">Add Survey Point</h3>
        <form onSubmit={handleAddPoint} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
            placeholder="Label (e.g., NW Corner)" className="input-field"
          />
          <input
            value={form.lat} onChange={e => setForm(p => ({ ...p, lat: e.target.value }))}
            placeholder="Latitude" type="number" step="any" className="input-field"
          />
          <input
            value={form.lng} onChange={e => setForm(p => ({ ...p, lng: e.target.value }))}
            placeholder="Longitude" type="number" step="any" className="input-field"
          />
          <input
            value={form.elevation} onChange={e => setForm(p => ({ ...p, elevation: e.target.value }))}
            placeholder="Elevation (ft)" type="number" step="0.01" className="input-field"
          />
          <div className="flex gap-2">
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="input-field flex-1">
              {POINT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <button type="submit" className="btn-primary whitespace-nowrap flex items-center gap-1">
              <Plus size={16} /> Add
            </button>
          </div>
        </form>
      </div>

      {/* Points Table */}
      {points.length > 0 && (
        <div className="section-card mt-4 overflow-x-auto">
          <h3 className="font-bold text-slate-900 mb-4">Survey Points ({points.length})</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="pb-2 pr-4">Label</th>
                <th className="pb-2 pr-4">Lat</th>
                <th className="pb-2 pr-4">Lng</th>
                <th className="pb-2 pr-4">Elev (ft)</th>
                <th className="pb-2 pr-4">Type</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {points.map((pt, i) => (
                <tr key={pt.id || i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 pr-4 font-medium">{pt.label || `Point ${i + 1}`}</td>
                  <td className="py-2 pr-4 text-slate-600">{pt.latitude?.toFixed(5)}</td>
                  <td className="py-2 pr-4 text-slate-600">{pt.longitude?.toFixed(5)}</td>
                  <td className="py-2 pr-4 text-slate-600">{pt.elevation_ft || '—'}</td>
                  <td className="py-2 pr-4 text-slate-600 capitalize">{pt.point_type?.replace('_', ' ') || 'ground'}</td>
                  <td className="py-2">
                    <button onClick={() => deletePoint(pt.id)} className="p-1 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}
