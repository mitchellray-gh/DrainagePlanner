/**
 * DrainagePlanner Pro — Frontend Application
 * Handles all UI interactions, API calls, map management, and data visualization
 */

// ─── STATE ───────────────────────────────────────────────────────────
let currentProject = null;
let projectMap = null;
let surveyMap = null;
let surveyMarkers = [];
let currentPlan = null;

const API = '';

// ─── NAVIGATION ──────────────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showPanel(btn.dataset.panel));
});

function showPanel(panelId) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const panel = document.getElementById(`panel-${panelId}`);
  if (panel) panel.classList.add('active');

  const navBtn = document.querySelector(`.nav-btn[data-panel="${panelId}"]`);
  if (navBtn) navBtn.classList.add('active');

  // Initialize maps when panels become visible
  if (panelId === 'project') setTimeout(() => initProjectMap(), 100);
  if (panelId === 'survey') setTimeout(() => initSurveyMap(), 100);

  // Show/hide content based on project state
  updatePanelVisibility();
}

function updatePanelVisibility() {
  const hasProject = currentProject !== null;
  document.querySelectorAll('#no-project-warning').forEach(el => el.style.display = hasProject ? 'none' : 'block');
  document.querySelectorAll('#survey-content, #photos-content, #analysis-content, #plan-content, #landscape-content, #report-content')
    .forEach(el => el.style.display = hasProject ? 'block' : 'none');
}

// ─── PROJECTS ────────────────────────────────────────────────────────
async function loadProjects() {
  try {
    const res = await fetch(`${API}/api/projects`);
    const data = await res.json();
    if (data.success && data.projects.length > 0) {
      document.getElementById('no-projects').style.display = 'none';
      document.getElementById('projects-list').style.display = 'grid';
      renderProjectsList(data.projects);
    } else {
      document.getElementById('no-projects').style.display = 'block';
      document.getElementById('projects-list').style.display = 'none';
    }
  } catch (err) {
    console.error('Error loading projects:', err);
  }
}

function renderProjectsList(projects) {
  const grid = document.getElementById('projects-list');
  grid.innerHTML = projects.map(p => `
    <div class="project-card" onclick="loadProject('${p.id}')">
      <h3>${escHtml(p.name)}</h3>
      <div class="meta">${escHtml(p.address || 'No address')} · ${p.soil_type || 'Unknown soil'}</div>
      <div class="stats">
        <span class="stat">📸 ${p.photo_count || 0} photos</span>
        <span class="stat">📐 ${p.survey_point_count || 0} points</span>
        <span class="stat">🗺️ ${p.plan_count || 0} plans</span>
      </div>
      <div class="meta" style="margin-top:0.5rem;">${new Date(p.updated_at).toLocaleDateString()}</div>
    </div>
  `).join('');
}

async function loadProject(id) {
  try {
    const res = await fetch(`${API}/api/projects/${id}`);
    const data = await res.json();
    if (data.success) {
      currentProject = data.project;
      populateProjectForm(currentProject);
      renderSurveyPoints(currentProject.surveyPoints || []);
      renderPhotos(currentProject.photos || []);
      if (currentProject.plans && currentProject.plans.length > 0) {
        currentPlan = currentProject.plans[0];
      }
      updatePanelVisibility();
      showPanel('project');
      showNotification('Project loaded: ' + currentProject.name);
    }
  } catch (err) {
    console.error('Error loading project:', err);
  }
}

function populateProjectForm(p) {
  document.getElementById('proj-name').value = p.name || '';
  document.getElementById('proj-address').value = p.address || '';
  document.getElementById('proj-lat').value = p.latitude || '';
  document.getElementById('proj-lng').value = p.longitude || '';
  document.getElementById('proj-area').value = p.property_area_sqft || '';
  document.getElementById('proj-soil').value = p.soil_type || 'unknown';
  document.getElementById('proj-rainfall').value = p.avg_annual_rainfall_in || '';
  document.getElementById('proj-climate').value = p.climate_zone || '';
  document.getElementById('proj-notes').value = p.notes || '';
  // show delete button when a project is loaded
  const delBtn = document.getElementById('proj-delete-btn');
  if (delBtn) {
    delBtn.style.display = p && p.id ? 'inline-block' : 'none';
    delBtn.onclick = () => deleteProject();
  }
}

async function deleteProject() {
  // show modal confirmation instead of immediate delete
  showDeleteModal();
}

function showDeleteModal() {
  const modal = document.getElementById('proj-delete-modal');
  const nameEl = document.getElementById('modal-proj-name');
  const input = document.getElementById('modal-confirm-input');
  const trashBtn = document.getElementById('modal-trash-btn');
  const hardBtn = document.getElementById('modal-hard-btn');
  if (!modal || !currentProject) return showNotification('No project selected', 'error');
  nameEl.textContent = currentProject.name;
  input.value = '';
  trashBtn.disabled = true;
  hardBtn.disabled = true;
  modal.style.display = 'block';

  input.focus();

  function onInput() {
    const matches = input.value.trim() === currentProject.name;
    trashBtn.disabled = !matches;
    hardBtn.disabled = !matches;
  }

  input.removeEventListener('input', onInput);
  input.addEventListener('input', onInput);

  trashBtn.onclick = async () => {
    try {
      // soft-delete
      const res = await fetch(`${API}/api/projects/${currentProject.id}/trash`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        closeDeleteModal();
        // clear UI
        currentProject = null;
        currentPlan = null;
        document.getElementById('project-form').reset();
        document.getElementById('photos-grid').innerHTML = '';
        document.getElementById('survey-points-table').querySelector('tbody').innerHTML = '';
        document.getElementById('proj-delete-btn').style.display = 'none';
        await loadProjects();
        showPanel('dashboard');
        // show undo notification
        showNotification('Project moved to Trash', 'success', {
          timeout: 10000,
          actionLabel: 'Undo',
          action: async () => {
            try {
              await fetch(`${API}/api/projects/${data.project.id}/restore`, { method: 'POST' });
              await loadProjects();
              showNotification('Project restored', 'success');
            } catch (e) {
              showNotification('Restore failed: ' + e.message, 'error');
            }
          }
        });
      } else {
        showNotification('Trash failed: ' + (data.error || 'unknown'), 'error');
      }
    } catch (err) {
      showNotification('Trash error: ' + err.message, 'error');
    }
  };

  hardBtn.onclick = async () => {
    if (!confirm('This will permanently delete the project and all associated files. Proceed?')) return;
    try {
      const res = await fetch(`${API}/api/projects/${currentProject.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        closeDeleteModal();
        currentProject = null;
        currentPlan = null;
        document.getElementById('project-form').reset();
        document.getElementById('photos-grid').innerHTML = '';
        document.getElementById('survey-points-table').querySelector('tbody').innerHTML = '';
        document.getElementById('proj-delete-btn').style.display = 'none';
        await loadProjects();
        showPanel('dashboard');
        showNotification('Project permanently deleted', 'success');
      } else {
        showNotification('Delete failed: ' + (data.error || 'unknown'), 'error');
      }
    } catch (err) {
      showNotification('Delete error: ' + err.message, 'error');
    }
  };
}

function closeDeleteModal() {
  const modal = document.getElementById('proj-delete-modal');
  if (modal) modal.style.display = 'none';
}

document.getElementById('project-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const projectData = {
    name: document.getElementById('proj-name').value,
    address: document.getElementById('proj-address').value,
    latitude: parseFloat(document.getElementById('proj-lat').value) || null,
    longitude: parseFloat(document.getElementById('proj-lng').value) || null,
    property_area_sqft: parseFloat(document.getElementById('proj-area').value) || null,
    soil_type: document.getElementById('proj-soil').value,
    avg_annual_rainfall_in: parseFloat(document.getElementById('proj-rainfall').value) || null,
    climate_zone: document.getElementById('proj-climate').value,
    notes: document.getElementById('proj-notes').value
  };

  // Save structures
  saveStructures();

  try {
    let res;
    if (currentProject && currentProject.id) {
      res = await fetch(`${API}/api/projects/${currentProject.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
    } else {
      res = await fetch(`${API}/api/projects`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
    }

    const data = await res.json();
    if (data.success) {
      currentProject = { ...currentProject, ...data.project };
      updatePanelVisibility();
      showNotification('Project saved!', 'success');
    }
  } catch (err) {
    showNotification('Error saving project: ' + err.message, 'error');
  }
});

// Auto-fill project location from address
document.getElementById('proj-autofill-btn')?.addEventListener('click', async () => {
  const addr = document.getElementById('proj-address').value.trim();
  if (!addr) return showNotification('Enter an address first', 'warning');
  showNotification('Looking up address...');
  try {
    const provider = document.getElementById('proj-geocode-provider')?.value || '';
    const res = await fetch(`${API}/api/analysis/geocode?address=${encodeURIComponent(addr)}${provider ? '&provider='+encodeURIComponent(provider) : ''}`);
    const data = await res.json();
    if (!data.success) return showNotification('Geocode failed: ' + (data.error || 'unknown'), 'error');
    if (!data.result) return showNotification('No results found', 'warning');
    const r = data.result;
    document.getElementById('proj-address').value = r.display_name || addr;
    document.getElementById('proj-lat').value = r.lat.toFixed(6);
    document.getElementById('proj-lng').value = r.lon.toFixed(6);
    if (r.approx_area_sqft) document.getElementById('proj-area').value = r.approx_area_sqft;
    const used = r.provider || provider || (data.provider || 'nominatim');
    showNotification('Address filled: ' + (r.display_name || addr) + ` (provider: ${used})`, 'success');
    // center the project map if initialized
    if (projectMap) {
      try { projectMap.setView([r.lat, r.lon], 17); } catch (e) { /* ignore */ }
    }
  } catch (err) {
    showNotification('Geocode error: ' + err.message, 'error');
  }
});

// Find parcel (OSM Overpass) and draw polygon
document.getElementById('proj-find-parcel-btn')?.addEventListener('click', async () => {
  const addr = document.getElementById('proj-address').value.trim();
  let lat = document.getElementById('proj-lat').value;
  let lon = document.getElementById('proj-lng').value;
  let url = `${API}/api/analysis/parcel`;
  if (lat && lon) {
    url += `?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  } else if (addr) {
    url += `?address=${encodeURIComponent(addr)}`;
  } else {
    return showNotification('Enter an address or coordinates first', 'warning');
  }

  showNotification('Searching OSM for parcel/building...');
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) return showNotification('Parcel lookup failed: ' + (data.error||'unknown'), 'error');
    if (!data.found) return showNotification('No parcel/building polygon found nearby', 'warning');
    const poly = data.polygon;
    document.getElementById('proj-area').value = poly.area_sqft;
    showNotification(`Parcel found — area ${poly.area_sqft} sqft (OSM)`, 'success');
    // draw polygon on map
    if (projectMap && poly.coords) {
      try {
        // remove previous parcel layer if present
        if (window._parcelLayer) { projectMap.removeLayer(window._parcelLayer); }
        const latlngs = poly.coords.map(c => [c[1], c[0]]);
        window._parcelLayer = L.polygon(latlngs, { color: '#16a34a', weight: 2, fillOpacity: 0.15 }).addTo(projectMap);
        projectMap.fitBounds(window._parcelLayer.getBounds(), { padding: [20,20] });
      } catch (e) { console.debug('Draw parcel failed', e); }
    }
  } catch (err) {
    showNotification('Parcel lookup error: ' + err.message, 'error');
  }
});

// ─── STRUCTURES ──────────────────────────────────────────────────────
let structureCounter = 0;

function addStructureRow(data = {}) {
  structureCounter++;
  const id = `struct-${structureCounter}`;
  const row = document.createElement('div');
  row.className = 'structure-row';
  row.id = id;
  row.innerHTML = `
    <select name="struct-type">
      <option value="house" ${data.structure_type === 'house' ? 'selected' : ''}>House</option>
      <option value="garage" ${data.structure_type === 'garage' ? 'selected' : ''}>Garage</option>
      <option value="shed" ${data.structure_type === 'shed' ? 'selected' : ''}>Shed</option>
      <option value="driveway" ${data.structure_type === 'driveway' ? 'selected' : ''}>Driveway</option>
      <option value="patio" ${data.structure_type === 'patio' ? 'selected' : ''}>Patio</option>
      <option value="sidewalk" ${data.structure_type === 'sidewalk' ? 'selected' : ''}>Sidewalk</option>
      <option value="deck" ${data.structure_type === 'deck' ? 'selected' : ''}>Deck</option>
      <option value="pool" ${data.structure_type === 'pool' ? 'selected' : ''}>Pool</option>
      <option value="retaining_wall" ${data.structure_type === 'retaining_wall' ? 'selected' : ''}>Retaining Wall</option>
      <option value="other" ${data.structure_type === 'other' ? 'selected' : ''}>Other</option>
    </select>
    <input type="text" name="struct-label" placeholder="Label" value="${escHtml(data.label || '')}">
    <input type="number" name="struct-area" placeholder="Area (sqft)" value="${data.area_sqft || ''}">
    <input type="number" name="struct-perim" placeholder="Perimeter (ft)" value="${data.perimeter_ft || ''}">
    <button type="button" class="btn btn-sm btn-danger" onclick="removeStructureRow('${id}')">✕</button>
  `;
  document.getElementById('structures-list').appendChild(row);
}

function removeStructureRow(id) {
  document.getElementById(id)?.remove();
}

async function saveStructures() {
  if (!currentProject?.id) return;

  const rows = document.querySelectorAll('.structure-row');
  for (const row of rows) {
    const data = {
      structure_type: row.querySelector('[name="struct-type"]').value,
      label: row.querySelector('[name="struct-label"]').value,
      geometry: {
        area_sqft: parseFloat(row.querySelector('[name="struct-area"]').value) || 0,
        perimeter_ft: parseFloat(row.querySelector('[name="struct-perim"]').value) || 0
      }
    };

    try {
      await fetch(`${API}/api/projects/${currentProject.id}/structures`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error('Error saving structure:', err);
    }
  }
}

// ─── MAPS ────────────────────────────────────────────────────────────
function initProjectMap() {
  if (projectMap) { projectMap.invalidateSize(); return; }

  const lat = parseFloat(document.getElementById('proj-lat').value) || 39.8283;
  const lng = parseFloat(document.getElementById('proj-lng').value) || -98.5795;
  const zoom = lat !== 39.8283 ? 17 : 4;

  projectMap = L.map('project-map').setView([lat, lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 20
  }).addTo(projectMap);

  let marker;
  projectMap.on('click', (e) => {
    if (marker) projectMap.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(projectMap);
    document.getElementById('proj-lat').value = e.latlng.lat.toFixed(6);
    document.getElementById('proj-lng').value = e.latlng.lng.toFixed(6);
  });
}

function initSurveyMap() {
  if (surveyMap) { surveyMap.invalidateSize(); return; }

  const lat = currentProject?.latitude || 39.8283;
  const lng = currentProject?.longitude || -98.5795;
  const zoom = currentProject?.latitude ? 18 : 4;

  surveyMap = L.map('survey-map').setView([lat, lng], zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 22
  }).addTo(surveyMap);

  surveyMap.on('click', (e) => {
    document.getElementById('sp-lat').value = e.latlng.lat.toFixed(6);
    document.getElementById('sp-lng').value = e.latlng.lng.toFixed(6);
    // attempt to auto-fetch elevation for the clicked point
    fetchElevationForInput(e.latlng.lat, e.latlng.lng);
  });

  // Add existing survey points to map
  if (currentProject?.surveyPoints) {
    for (const pt of currentProject.surveyPoints) {
      addSurveyMarker(pt);
    }
    if (currentProject.surveyPoints.length > 0) {
      const bounds = L.latLngBounds(currentProject.surveyPoints.map(p => [p.latitude, p.longitude]));
      surveyMap.fitBounds(bounds, { padding: [30, 30] });
    }
  }
}

function addSurveyMarker(point) {
  if (!surveyMap || !point.latitude || !point.longitude) return;

  const color = getPointColor(point.point_type);
  const marker = L.circleMarker([point.latitude, point.longitude], {
    radius: 8, fillColor: color, fillOpacity: 0.8,
    color: '#fff', weight: 2
  }).addTo(surveyMap);

  marker.bindPopup(`
    <strong>${escHtml(point.label || 'Point')}</strong><br>
    Elevation: ${point.elevation_ft || '?'} ft<br>
    Type: ${point.point_type}<br>
    ${point.soil_type ? 'Soil: ' + point.soil_type : ''}
  `);

  // Add elevation label
  L.marker([point.latitude, point.longitude], {
    icon: L.divIcon({
      className: 'elev-label',
      html: `<div style="background:${color};color:#fff;padding:1px 4px;border-radius:3px;font-size:10px;font-weight:700;white-space:nowrap;">${point.elevation_ft || '?'}'</div>`,
      iconSize: [40, 16], iconAnchor: [20, -8]
    })
  }).addTo(surveyMap);

  surveyMarkers.push(marker);
}

function getPointColor(type) {
  const colors = {
    ground: '#2563eb', foundation: '#dc2626', high_point: '#f59e0b',
    low_point: '#7c3aed', drain: '#06b6d4', gutter: '#6366f1', property_corner: '#10b981'
  };
  return colors[type] || '#2563eb';
}

// ─── SURVEY POINTS ───────────────────────────────────────────────────
document.getElementById('survey-point-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentProject?.id) return showNotification('Save project first', 'error');

  const pointData = {
    label: document.getElementById('sp-label').value,
    latitude: parseFloat(document.getElementById('sp-lat').value),
    longitude: parseFloat(document.getElementById('sp-lng').value),
    elevation_ft: parseFloat(document.getElementById('sp-elev').value),
    point_type: document.getElementById('sp-type').value,
    soil_type: document.getElementById('sp-soil').value || null
  };

  try {
    const res = await fetch(`${API}/api/projects/${currentProject.id}/survey-points`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pointData)
    });
    const data = await res.json();
    if (data.success) {
      if (!currentProject.surveyPoints) currentProject.surveyPoints = [];
      currentProject.surveyPoints.push(data.point);
      renderSurveyPoints(currentProject.surveyPoints);
      addSurveyMarker(data.point);
      document.getElementById('survey-point-form').reset();
      showNotification('Survey point added');
    }
  } catch (err) {
    showNotification('Error adding point: ' + err.message, 'error');
  }
});

// Auto-locate button (use device GPS then fetch elevation)
document.getElementById('sp-auto-locate')?.addEventListener('click', async () => {
  if (!navigator.geolocation) return showNotification('Geolocation not supported by your browser', 'error');
  showNotification('Acquiring GPS position...');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    document.getElementById('sp-lat').value = lat.toFixed(6);
    document.getElementById('sp-lng').value = lng.toFixed(6);
    showNotification('GPS position acquired — fetching elevation...');
    try {
      const res = await fetch(`${API}/api/analysis/elevation?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data.success) {
        document.getElementById('sp-elev').value = data.elevation.feet;
        showNotification('Elevation filled: ' + data.elevation.feet + ' ft', 'success');
      } else {
        showNotification('Elevation lookup failed: ' + (data.error || 'unknown'), 'warning');
      }
    } catch (err) {
      showNotification('Elevation error: ' + err.message, 'error');
    }
  }, (err) => {
    showNotification('GPS error: ' + err.message, 'error');
  }, { enableHighAccuracy: true, timeout: 10000 });
});

// When clicking on the survey map, auto-fetch elevation for the clicked point
function fetchElevationForInput(lat, lng) {
  if (!lat || !lng) return;
  fetch(`${API}/api/analysis/elevation?lat=${lat}&lng=${lng}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) document.getElementById('sp-elev').value = data.elevation.feet;
    }).catch(err => {
      console.debug('Elevation lookup failed', err);
    });
}

function renderSurveyPoints(points) {
  const tbody = document.querySelector('#survey-points-table tbody');
  tbody.innerHTML = points.map(p => `
    <tr>
      <td><strong>${escHtml(p.label || '')}</strong></td>
      <td>${p.latitude?.toFixed(6) || ''}</td>
      <td>${p.longitude?.toFixed(6) || ''}</td>
      <td><strong>${p.elevation_ft || '?'} ft</strong></td>
      <td>${p.point_type || ''}</td>
      <td>${p.soil_type || ''}</td>
      <td><button class="btn btn-sm btn-danger" onclick="deleteSurveyPoint('${p.id}')">✕</button></td>
    </tr>
  `).join('');
}

// ─── PHOTOS ──────────────────────────────────────────────────────────
const uploadZone = document.getElementById('upload-zone');
const photoInput = document.getElementById('photo-input');

uploadZone?.addEventListener('click', () => photoInput.click());
uploadZone?.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone?.addEventListener('drop', (e) => {
  e.preventDefault(); uploadZone.classList.remove('dragover');
  handlePhotoFiles(e.dataTransfer.files);
});
photoInput?.addEventListener('change', (e) => handlePhotoFiles(e.target.files));

async function handlePhotoFiles(files) {
  if (!currentProject?.id) return showNotification('Save project first', 'error');
  if (!files.length) return;

  const formData = new FormData();
  for (const file of files) {
    formData.append('photos', file);
  }
  formData.append('photo_type', document.getElementById('photo-type').value);
  formData.append('description', document.getElementById('photo-desc').value);
  formData.append('tags', document.getElementById('photo-tags').value);

  try {
    showNotification('Uploading photos...');
    const res = await fetch(`${API}/api/photos/upload/${currentProject.id}`, {
      method: 'POST', body: formData
    });
    const data = await res.json();
    if (data.success) {
      if (!currentProject.photos) currentProject.photos = [];
      currentProject.photos.push(...data.photos);
      renderPhotos(currentProject.photos);
      showNotification(`${data.photos.length} photo(s) uploaded!`, 'success');
    }
  } catch (err) {
    showNotification('Upload error: ' + err.message, 'error');
  }
}

function renderPhotos(photos) {
  const grid = document.getElementById('photos-grid');
  if (!grid) return;
  grid.innerHTML = photos.map(p => `
    <div class="photo-card">
      <img src="${p.filepath}" alt="${escHtml(p.description || 'Site photo')}" loading="lazy" 
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22160%22><rect fill=%22%23e2e8f0%22 width=%22200%22 height=%22160%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2214%22>📷 Photo</text></svg>'">
      <div class="info">
        <div class="type">${p.photo_type || 'site'}</div>
        ${p.description ? `<div>${escHtml(p.description)}</div>` : ''}
        ${p.latitude ? `<div class="coords">📍 ${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}</div>` : ''}
        <button class="btn btn-sm btn-danger" style="margin-top:0.3rem;" onclick="deletePhoto('${p.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function deletePhoto(id) {
  if (!confirm('Delete this photo?')) return;
  try {
    await fetch(`${API}/api/photos/${id}`, { method: 'DELETE' });
    currentProject.photos = currentProject.photos.filter(p => p.id !== id);
    renderPhotos(currentProject.photos);
    showNotification('Photo deleted');
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
}

// ─── ANALYSIS ────────────────────────────────────────────────────────
async function runFullAnalysis() {
  if (!currentProject?.id) return;

  try {
    showNotification('Running full site analysis...');
    const res = await fetch(`${API}/api/analysis/full/${currentProject.id}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      renderAnalysisResults(data.analysis);
      showNotification('Analysis complete!', 'success');
    }
  } catch (err) {
    showNotification('Analysis error: ' + err.message, 'error');
  }
}

function renderAnalysisResults(analysis) {
  const container = document.getElementById('analysis-results');
  const drainage = analysis.drainage;
  const topo = analysis.topography;
  const soil = analysis.soil;

  let html = '';

  // Overall risk
  if (drainage?.overall_risk) {
    const risk = drainage.overall_risk;
    const riskClass = risk.level?.toLowerCase() || 'moderate';
    html += `
      <div class="section-card">
        <h3>Overall Risk Assessment</h3>
        <div style="display:flex;align-items:center;gap:1rem;margin:0.5rem 0;">
          <span class="risk-badge risk-${riskClass}">⚠️ ${risk.level}</span>
          <span style="font-size:1.2rem;font-weight:700;">Score: ${risk.score}/100</span>
        </div>
      </div>`;
  }

  // Site summary metrics
  if (drainage?.site_summary) {
    const s = drainage.site_summary;
    html += `
      <div class="section-card">
        <h3>Site Summary</h3>
        <div class="metric-grid">
          <div class="metric-card"><div class="metric-label">Total Area</div><div class="metric-value">${(s.total_area_sqft || 0).toLocaleString()} sf</div><div class="metric-detail">${s.total_area_acres} acres</div></div>
          <div class="metric-card"><div class="metric-label">Impervious</div><div class="metric-value">${s.impervious_ratio || 0}%</div><div class="metric-detail">${(s.impervious_area_sqft || 0).toLocaleString()} sf</div></div>
          <div class="metric-card"><div class="metric-label">Soil Type</div><div class="metric-value">${s.soil_type || '?'}</div></div>
          <div class="metric-card"><div class="metric-label">Avg Rainfall</div><div class="metric-value">${s.avg_rainfall_in || '?'}" / yr</div></div>
        </div>
      </div>`;
  }

  // Storm analysis table
  if (drainage?.storm_analysis) {
    html += `
      <div class="section-card">
        <h3>Storm Event Analysis</h3>
        <table class="data-table">
          <thead><tr><th>Storm Event</th><th>Rainfall</th><th>Peak Flow</th><th>Total Volume</th><th>Risk</th></tr></thead>
          <tbody>
          ${drainage.storm_analysis.map(s => {
            const riskClass = s.risk_level?.level?.toLowerCase() || 'moderate';
            return `<tr>
              <td><strong>${s.scenario}</strong></td>
              <td>${s.input?.rainfall_inches?.toFixed(1) || '?'}"</td>
              <td>${s.peak_flow_gpm?.toFixed(1) || '?'} GPM</td>
              <td>${s.total_volume_gallons?.toLocaleString() || '?'} gal</td>
              <td><span class="risk-badge risk-${riskClass}">${s.risk_level?.level || '?'}</span></td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>`;
  }

  // Topography
  if (topo?.status === 'complete') {
    html += `
      <div class="section-card">
        <h3>📐 Topography Analysis</h3>
        <div class="metric-grid">
          <div class="metric-card"><div class="metric-label">Relief</div><div class="metric-value">${topo.total_relief_ft} ft</div><div class="metric-detail">${topo.min_elevation_ft}' — ${topo.max_elevation_ft}'</div></div>
          <div class="metric-card"><div class="metric-label">Avg Slope</div><div class="metric-value">${topo.avg_slope_percent}%</div></div>
          <div class="metric-card"><div class="metric-label">Drainage Dir</div><div class="metric-value">${topo.drainage_direction}</div><div class="metric-detail">${topo.drainage_bearing}°</div></div>
          <div class="metric-card"><div class="metric-label">Assessment</div><div class="metric-value">${topo.overall_assessment?.rating}</div><div class="metric-detail">Score: ${topo.overall_assessment?.score}/100</div></div>
        </div>
        ${topo.overall_assessment?.issues?.length > 0 ? `<ul style="margin-top:0.5rem;">${topo.overall_assessment.issues.map(i => `<li style="color:#b45309;">${i}</li>`).join('')}</ul>` : ''}
      </div>`;
  }

  // Soil info
  if (soil) {
    html += `
      <div class="section-card">
        <h3>🪨 Soil Analysis</h3>
        <div class="metric-grid">
          <div class="metric-card"><div class="metric-label">Classification</div><div class="metric-value">${soil.usda_class || '?'}</div></div>
          <div class="metric-card"><div class="metric-label">Infiltration</div><div class="metric-value">${soil.infiltration_rate_in_hr || '?'} in/hr</div><div class="metric-detail">${soil.permeability || ''}</div></div>
          <div class="metric-card"><div class="metric-label">Runoff Potential</div><div class="metric-value">${soil.runoff_potential || '?'}</div></div>
          <div class="metric-card"><div class="metric-label">Hydro Group</div><div class="metric-value">${soil.hydrologic_group || '?'}</div></div>
        </div>
        ${soil.drainage_implications ? `<h4 style="margin-top:0.75rem;">Key Implications:</h4><ul>${soil.drainage_implications.map(d => `<li>${d}</li>`).join('')}</ul>` : ''}
      </div>`;
  }

  // Problem areas
  if (drainage?.problem_areas?.length > 0) {
    html += `
      <div class="section-card">
        <h3>⚠️ Problem Areas Identified</h3>
        ${drainage.problem_areas.map(p => `
          <div style="padding:0.5rem;margin:0.3rem 0;border-left:3px solid ${p.severity === 'HIGH' ? '#dc2626' : '#f59e0b'};background:#fff;">
            <strong>${p.type.replace(/_/g, ' ').toUpperCase()}</strong> — <span class="risk-badge risk-${p.severity.toLowerCase()}">${p.severity}</span>
            <div style="color:#475569;font-size:0.9rem;">${p.description}</div>
            <div style="color:#2563eb;font-size:0.85rem;">💡 ${p.recommendation}</div>
          </div>
        `).join('')}
      </div>`;
  }

  container.innerHTML = html;
}

function runRunoffCalc() {
  const el = document.getElementById('runoff-calc');
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

document.getElementById('runoff-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentProject?.id) return;

  try {
    const res = await fetch(`${API}/api/analysis/runoff/${currentProject.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rainfall_inches: parseFloat(document.getElementById('ro-rainfall').value),
        duration_hours: parseFloat(document.getElementById('ro-duration').value),
        return_period_years: parseInt(document.getElementById('ro-return').value)
      })
    });
    const data = await res.json();
    if (data.success) {
      const r = data.runoff;
      document.getElementById('runoff-results').innerHTML = `
        <div class="metric-grid" style="margin-top:1rem;">
          <div class="metric-card"><div class="metric-label">Peak Flow</div><div class="metric-value">${r.peak_flow_gpm} GPM</div></div>
          <div class="metric-card"><div class="metric-label">Total Volume</div><div class="metric-value">${r.total_volume_gallons?.toLocaleString()} gal</div></div>
          <div class="metric-card"><div class="metric-label">Runoff Coeff</div><div class="metric-value">${r.runoff_coefficient}</div></div>
          <div class="metric-card"><div class="metric-label">Risk</div><div class="metric-value"><span class="risk-badge risk-${r.risk_level?.level?.toLowerCase()}">${r.risk_level?.level}</span></div></div>
        </div>
        ${r.recommendations ? `<h4 style="margin-top:0.75rem;">Recommendations:</h4><ul>${r.recommendations.map(rec => `<li><strong>[${rec.priority}]</strong> ${rec.description}</li>`).join('')}</ul>` : ''}
      `;
    }
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
});

async function showSoilInfo() {
  const el = document.getElementById('soil-info-display');
  if (!currentProject) return;

  try {
    const res = await fetch(`${API}/api/analysis/soil-info/${currentProject.soil_type || 'unknown'}`);
    const data = await res.json();
    if (data.success) {
      const s = data.soil;
      el.innerHTML = `
        <h3>🪨 ${s.usda_class}</h3>
        <p>${s.description}</p>
        <div class="metric-grid" style="margin:1rem 0;">
          <div class="metric-card"><div class="metric-label">Infiltration</div><div class="metric-value">${s.infiltration_rate_in_hr} in/hr</div><div class="metric-detail">${s.infiltration_range}</div></div>
          <div class="metric-card"><div class="metric-label">Hydro Group</div><div class="metric-value">${s.hydrologic_group}</div></div>
          <div class="metric-card"><div class="metric-label">Permeability</div><div class="metric-value">${s.permeability}</div></div>
          <div class="metric-card"><div class="metric-label">Runoff</div><div class="metric-value">${s.runoff_potential}</div></div>
          <div class="metric-card"><div class="metric-label">Shrink/Swell</div><div class="metric-value">${s.shrink_swell}</div></div>
          <div class="metric-card"><div class="metric-label">Drainage Class</div><div class="metric-value">${s.drainage_class}</div></div>
        </div>
        <h4>Drainage Implications:</h4>
        <ul>${s.drainage_implications.map(d => `<li>${d}</li>`).join('')}</ul>
        <h4 style="margin-top:0.5rem;">Amendments:</h4>
        <ul>${s.amendment_recommendations.map(a => `<li>${a}</li>`).join('')}</ul>
      `;
      el.style.display = 'block';
    }
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
}

async function runSlopeAnalysis() {
  if (!currentProject?.id) return;

  try {
    const points = currentProject.surveyPoints?.filter(p => p.elevation_ft != null) || [];
    if (points.length < 2) return showNotification('Need at least 2 points with elevation', 'error');

    const res = await fetch(`${API}/api/analysis/slope`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points })
    });
    const data = await res.json();
    if (data.success) {
      const slopes = data.slopes;
      document.getElementById('slope-results').innerHTML = `
        <table class="data-table" style="margin-top:0.75rem;">
          <thead><tr><th>From</th><th>To</th><th>Distance</th><th>Rise</th><th>Slope</th><th>Rating</th></tr></thead>
          <tbody>
          ${slopes.map(s => `
            <tr>
              <td>${escHtml(s.from.label || '?')}</td>
              <td>${escHtml(s.to.label || '?')}</td>
              <td>${s.horizontal_distance_ft} ft</td>
              <td>${s.vertical_rise_ft} ft ${s.direction === 'uphill' ? '↑' : s.direction === 'downhill' ? '↓' : '→'}</td>
              <td><strong>${Math.abs(s.slope_percent)}%</strong></td>
              <td><span class="risk-badge risk-${s.drainage_assessment.rating === 'POOR' ? 'critical' : s.drainage_assessment.rating === 'MARGINAL' ? 'high' : s.drainage_assessment.rating === 'ACCEPTABLE' ? 'moderate' : 'low'}">${s.drainage_assessment.rating}</span></td>
            </tr>
          `).join('')}
          </tbody>
        </table>
      `;
    }
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
}

async function generateContours() {
  if (!currentProject?.id) return;

  try {
    const interval = parseFloat(document.getElementById('contour-interval').value) || 1;
    const res = await fetch(`${API}/api/analysis/contours/${currentProject.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interval_ft: interval })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('contour-results').innerHTML = `
        <div class="section-card" style="margin-top:0.75rem;">
          <p>Generated <strong>${data.contours.contour_count}</strong> contour lines at ${data.contours.interval_ft}ft intervals</p>
          <p>Elevation range: ${data.contours.min_elevation}' — ${data.contours.max_elevation}'</p>
        </div>
      `;

      // Draw contours on survey map
      if (surveyMap && data.contours.contours) {
        for (const contour of data.contours.contours) {
          for (const segment of contour.segments) {
            if (segment.length >= 2) {
              L.polyline(
                segment.map(p => [p.lat, p.lng]),
                { color: contour.is_index ? '#dc2626' : '#94a3b8', weight: contour.is_index ? 2 : 1, opacity: 0.7 }
              ).addTo(surveyMap).bindPopup(`Elevation: ${contour.elevation}'`);
            }
          }
        }
      }

      showNotification('Contours generated!', 'success');
    }
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
}

// ─── DRAINAGE PLAN ───────────────────────────────────────────────────
async function generatePlan() {
  if (!currentProject?.id) return;

  try {
    showNotification('Generating comprehensive drainage plan...');
    const res = await fetch(`${API}/api/plans/generate/${currentProject.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_name: `Drainage Plan — ${currentProject.name}`,
        plan_type: 'comprehensive'
      })
    });
    const data = await res.json();
    if (data.success) {
      currentPlan = data.plan;
      renderPlanResults(data.plan);
      showNotification('Drainage plan generated!', 'success');
    }
  } catch (err) {
    showNotification('Error generating plan: ' + err.message, 'error');
  }
}

function renderPlanResults(plan) {
  const container = document.getElementById('plan-results');
  const planData = plan.plan_data || {};
  const drainage = planData.drainage || {};
  const landscaping = planData.landscaping || {};
  const materials = plan.materials || [];
  const costs = plan.costEstimate || {};
  const steps = plan.installSteps || {};

  let html = '';

  // Summary
  if (drainage.summary) {
    const s = drainage.summary;
    html += `
      <div class="section-card">
        <h3>Plan Summary</h3>
        <div class="metric-grid">
          <div class="metric-card"><div class="metric-label">Elements</div><div class="metric-value">${s.total_elements}</div></div>
          <div class="metric-card"><div class="metric-label">Risk Before</div><div class="metric-value"><span class="risk-badge risk-${s.risk_before?.level?.toLowerCase()}">${s.risk_before?.level}</span></div></div>
          <div class="metric-card"><div class="metric-label">Risk After</div><div class="metric-value"><span class="risk-badge risk-${s.estimated_risk_after?.level?.toLowerCase()}">${s.estimated_risk_after?.level}</span></div></div>
          <div class="metric-card"><div class="metric-label">Standard</div><div class="metric-value" style="font-size:0.9rem;">${s.design_standard}</div></div>
        </div>
      </div>`;
  }

  // Drainage elements
  if (drainage.elements?.length > 0) {
    html += `<div class="section-card"><h3>🏗️ Drainage Elements</h3>`;
    for (const el of drainage.elements) {
      html += `
        <div class="plan-element ${el.type}">
          <h4>${escHtml(el.label)}</h4>
          <span class="type-badge">${el.type.replace(/_/g, ' ')}</span>
          <div class="specs">
            ${el.slope_percent != null ? `<span>Slope: ${el.slope_percent}%</span> · ` : ''}
            ${el.depth_in != null ? `<span>Depth: ${el.depth_in}"</span> · ` : ''}
            ${el.material ? `<span>Material: ${el.material}</span>` : ''}
          </div>
          ${el.notes ? `<div style="font-size:0.85rem;color:#475569;margin-top:0.3rem;">${el.notes}</div>` : ''}
        </div>
      `;
    }
    html += `</div>`;
  }

  // Materials
  if (materials.length > 0) {
    html += `<div class="section-card"><h3>📦 Materials List</h3>`;
    for (const group of materials) {
      html += `<h4 style="margin-top:0.5rem;">${group.category}</h4>
        <table class="data-table"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th></tr></thead><tbody>
        ${group.items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.unit}</td></tr>`).join('')}
        </tbody></table>`;
    }
    html += `</div>`;
  }

  // Costs
  if (costs.grand_total) {
    html += `
      <div class="section-card">
        <h3>💰 Cost Estimate</h3>
        <div class="metric-grid">
          <div class="metric-card"><div class="metric-label">Materials</div><div class="metric-value">$${costs.material_cost?.toLocaleString()}</div></div>
          <div class="metric-card"><div class="metric-label">Labor</div><div class="metric-value">$${costs.labor_cost?.toLocaleString()}</div></div>
          <div class="metric-card"><div class="metric-label">Equipment</div><div class="metric-value">$${costs.equipment_cost?.toLocaleString()}</div></div>
        </div>
        <div class="cost-total-box">
          <div class="label">Professional Install (incl. 15% contingency)</div>
          <div class="amount">$${costs.grand_total?.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
        <div class="cost-diy">
          <div class="label">DIY Estimate</div>
          <div class="amount">$${costs.diy_estimate?.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
        </div>
      </div>`;
  }

  // Installation steps
  if (steps.steps?.length > 0) {
    html += `<div class="section-card"><h3>🔨 Installation Guide</h3>
      <p style="margin-bottom:0.75rem;">Estimated Duration: <strong>${steps.estimated_total_duration}</strong></p>`;

    let currentPhase = '';
    for (const step of steps.steps) {
      if (step.phase !== currentPhase) {
        currentPhase = step.phase;
        html += `<h4 style="margin-top:1rem;color:#1e40af;">${currentPhase}</h4>`;
      }
      html += `
        <div class="install-step ${step.critical ? 'critical' : ''}">
          <div class="step-num">${step.step}</div>
          <div class="step-body">
            <div class="step-title">${step.title} ${step.critical ? '<span class="risk-badge risk-critical" style="font-size:0.65rem;">CRITICAL</span>' : ''}</div>
            <div class="step-desc">${step.description}</div>
            <div class="step-meta">${step.duration}</div>
          </div>
        </div>
      `;
    }
    html += `</div>`;
  }

  // Landscaping
  if (landscaping.elements?.length > 0) {
    html += `<div class="section-card"><h3>🌿 Landscaping Integration</h3>`;
    for (const el of landscaping.elements) {
      html += `
        <div class="landscape-element">
          <h4>${el.label || el.type}</h4>
          <p>${el.description || ''}</p>
          ${el.plants ? `<div class="plant-grid">${el.plants.map(p => `
            <div class="plant-card">
              <div class="plant-name">🌱 ${typeof p === 'string' ? p : p.name}</div>
              ${p.botanical ? `<div class="plant-botanical">${p.botanical}</div>` : ''}
              ${p.height ? `<div class="plant-info">${p.type || ''} · ${p.height} · Zones ${p.zones || '?'}</div>` : ''}
            </div>
          `).join('')}</div>` : ''}
        </div>
      `;
    }

    // Maintenance
    if (landscaping.maintenance_schedule) {
      html += `<h4 style="margin-top:1rem;">📋 Maintenance Schedule</h4>
        <table class="data-table">
          <tr><th>Monthly</th><td><ul>${landscaping.maintenance_schedule.monthly.map(t => `<li>${t}</li>`).join('')}</ul></td></tr>
          <tr><th>Quarterly</th><td><ul>${landscaping.maintenance_schedule.quarterly.map(t => `<li>${t}</li>`).join('')}</ul></td></tr>
          <tr><th>Annually</th><td><ul>${landscaping.maintenance_schedule.annually.map(t => `<li>${t}</li>`).join('')}</ul></td></tr>
          <tr><th>After Storms</th><td><ul>${landscaping.maintenance_schedule.after_major_storms.map(t => `<li>${t}</li>`).join('')}</ul></td></tr>
        </table>`;
    }
    html += `</div>`;
  }

  container.innerHTML = html;

  // Also update landscaping panel
  if (landscaping.elements?.length > 0) {
    document.getElementById('landscape-results').innerHTML = html;
  }
}

// ─── REPORT ──────────────────────────────────────────────────────────
async function viewReport() {
  if (!currentPlan?.id) {
    return showNotification('Generate a drainage plan first', 'error');
  }

  const reportUrl = `${API}/api/reports/html/${currentPlan.id}`;
  document.getElementById('report-preview').innerHTML = `<iframe src="${reportUrl}"></iframe>`;
}

function printReport() {
  if (!currentPlan?.id) return showNotification('Generate a drainage plan first', 'error');
  const win = window.open(`${API}/api/reports/html/${currentPlan.id}`, '_blank');
  win.onload = () => setTimeout(() => win.print(), 500);
}

// ─── UTILITIES ───────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showNotification(message, type = 'info', options = {}) {
  // options: { timeout: ms, actionLabel: string, action: fn }
  const { timeout = 3500, actionLabel = null, action = null } = options;
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const colors = { info: '#2563eb', success: '#16a34a', error: '#dc2626', warning: '#ca8a04' };
  const el = document.createElement('div');
  el.className = 'notification';
  el.style.cssText = `
    position: fixed; top: 1rem; right: 1rem; z-index: 9999;
    padding: 0.75rem 1.25rem; border-radius: 8px; display:flex;align-items:center;gap:0.5rem;
    background: ${colors[type] || colors.info}; color: #fff;
    font-weight: 600; font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: fadeIn 0.2s ease;
  `;
  const msg = document.createElement('div');
  msg.textContent = message;
  el.appendChild(msg);

  if (actionLabel && typeof action === 'function') {
    const btn = document.createElement('button');
    btn.textContent = actionLabel;
    btn.style.cssText = 'margin-left:0.5rem;padding:0.35rem 0.6rem;border-radius:6px;border:none;background:rgba(255,255,255,0.12);color:#fff;font-weight:700;cursor:pointer;';
    btn.onclick = () => {
      try {
        action();
      } catch (e) {
        console.error('Notification action error', e);
      }
      el.remove();
    };
    el.appendChild(btn);
  }

  document.body.appendChild(el);
  if (timeout > 0) setTimeout(() => el.remove(), timeout);
}

// ─── INIT ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadProjects();
  showPanel('dashboard');
});
