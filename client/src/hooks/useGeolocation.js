import { useState, useCallback } from 'react'

export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser')
      return Promise.reject('Geolocation not supported')
    }

    setLoading(true)
    setError(null)

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          // Try to fetch elevation
          try {
            const elevRes = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${coords.lat},${coords.lng}`)
            const elevData = await elevRes.json()
            if (elevData.results && elevData.results[0]) {
              coords.elevation = elevData.results[0].elevation * 3.28084 // meters to feet
            }
          } catch (e) {
            // Elevation fetch failed, continue without
          }
          setPosition(coords)
          setLoading(false)
          resolve(coords)
        },
        (err) => {
          setError(err.message)
          setLoading(false)
          reject(err)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      )
    })
  }, [])

  return { position, loading, error, getPosition }
}
