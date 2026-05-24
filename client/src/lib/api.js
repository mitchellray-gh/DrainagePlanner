const API_BASE = ''

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`)
  return res.json()
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.json()
}

export async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.json()
}

export async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' })
  return res.json()
}

export async function uploadFiles(path, files, extraFields = {}) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('photos', file)
  }
  for (const [key, val] of Object.entries(extraFields)) {
    formData.append(key, val)
  }
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', body: formData })
  return res.json()
}
