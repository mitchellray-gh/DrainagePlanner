# 🌧️ DrainagePlanner Pro

An integrated yard drainage planning app that blends construction management, land surveying, and landscape design expertise into a single, opinionated toolset.

This repository contains a self-hosted Node.js + Express server and a simple browser-based frontend (Leaflet) for: project setup, survey point capture, photo upload, runoff analysis, drainage plan generation, and print-ready HTML reports.

Why this project
-- It speeds up preliminary site assessments for property owners and contractors.
-- It produces installation-ready material lists and step-by-step plans.
-- It gives landscape-friendly recommendations (rain gardens, bioswales) alongside engineered drainage solutions.

Highlights
- Topography and slope analysis
- Runoff estimation (SCS Curve Number + Rational method helpers)
- Soil classification and infiltration guidance
- Automatic generation of drainage elements (swales, French drains, catch basins)
- Landscape integration with native plant palettes and maintenance notes
- Print-ready HTML reports with material takeoffs and cost estimates

Quick start (local)

```bash
# from project root
npm install

# start the server (default: http://localhost:3000)
npm start

# development (if you have nodemon)
npm run dev
```

Open http://localhost:3000 in your browser.

Notes about the current build
- The project originally used a native SQLite binding; to avoid native build issues this branch uses a small JSON-file datastore (see `src/models/database.js` and `data/database.json`).
- File uploads (photos) are stored in the `uploads/` folder.

Primary files
- `src/server.js` — Express app bootstrap and route wiring
- `src/routes/` — REST endpoints for projects, photos, analysis, reports
- `src/engine/` — domain engines (soil, landscape, report generation)
- `src/models/database.js` — JSON-file DB abstraction
- `public/` — frontend app (HTML/CSS/JS)

API (common endpoints)

- GET `/api/projects` — list projects
- POST `/api/projects` — create project (JSON body)
- POST `/api/projects/:id/survey-points` — add survey point
- POST `/api/photos/upload/:projectId` — upload photos (multipart)
- POST `/api/analysis/full/:projectId` — run full analysis pipeline
- POST `/api/plans/generate/:projectId` — generate a drainage plan
- GET `/api/reports/html/:planId` — view printable HTML report

Recommendations for pushing to GitHub
- This repo may include local files such as `data/database.json` and `uploads/`. If you prefer not to push generated data, add them to `.gitignore` (already included).
- To push from your machine, either use HTTPS with a personal access token (PAT) or set an SSH remote. Example (HTTPS + PAT):

```bash
# set remote (already added by the helper script in this repo)
git remote add origin https://github.com/mitchellray-gh/DrainagePlanner.git

# push
git push -u origin main
```

If you get authentication errors, create a GitHub PAT with repo permissions and either use Git credential helper or set the remote URL to include the token (not recommended for long-term). Prefer SSH for secure workflows.

Contributing
- Open issues for bugs or design ideas
- Send PRs against `main` (small, focused changes are easiest to review)

License

MIT

Credits
- Designed for rapid prototyping of residential drainage plans.

Environment & external services
-- You can configure geocoding and elevation providers via environment variables. By default the app uses OpenStreetMap Nominatim for geocoding and Open-Elevation for elevation lookups. For production use you should provide a commercial geocoding provider or a parcel API for accurate property area data.

- GEOCODE_API_URL: override the default geocode URL template. Use {q} as a placeholder for the address. Example for Google Maps (note: you must include your API key):
	- "https://maps.googleapis.com/maps/api/geocode/json?address={q}&key=YOUR_API_KEY"
- GEOCODE_PROVIDER: set to "zillow" to use Zillow DeepSearchResults (requires ZILLOW_ZWSID). If set to "zillow" the backend will attempt to extract lot size information from Zillow's response.
- ZILLOW_ZWSID: your Zillow Web Services ID (required if GEOCODE_PROVIDER=zillow). Zillow responses are XML and may include lot size fields when available.
- ELEVATION_API_URL: override elevation lookup. Default: Open-Elevation
	- Example: "https://api.open-elevation.com/api/v1/lookup?locations={lat},{lng}"
- DB_DIR / DB_FALLBACK_DIR: configure where the JSON database should be persisted. If the configured DB directory is not writable (for example in some container/serverless environments), the app will fallback to `DB_FALLBACK_DIR` or the system temp directory and, if necessary, operate in-memory (non-persistent).
- UPLOAD_DIR / UPLOAD_FALLBACK_DIR: configure a writable uploads directory for photos. If not writable the server will fallback to a writable temp dir.

Security & usage notes
- Public/free geocoding services (OpenStreetMap/Nominatim, Open-Elevation) are rate-limited and not suitable for high-volume production. Use a paid provider (Google, Mapbox, Bing) or a commercial parcel API for reliable parcel boundaries and lot area.
- Zillow's API may return lot/parcel measurements for certain properties but the field availability is not guaranteed. Always verify returned parcel areas against authoritative local data (county assessor or parcel API) before using them for design or costing.

## Help — how to use DrainagePlanner Pro

This section gives a short user guide for the common flows so you (or someone on your team) can get up and running quickly.

1) Create a new project
- Open the app at http://localhost:3000 and click "New Project" (or use the Create Project form).
- Fill name, address (optional), select soil type and any notes you have. Save the project before adding survey points or photos.

2) Prefill location / parcel (optional)
- Use the address autofill to geocode the property. By default the app uses OpenStreetMap Nominatim. If you have commercial keys (Google/Mapbox/Zillow) configure the appropriate environment variables.
- If you don't have commercial APIs, use "Find Parcel (OSM)" to try to locate building/parcel geometry from OpenStreetMap/Overpass. This gives an approximate area — verify against authoritative data when accuracy matters.

3) Capture survey points (recommended)
- Go to the Survey panel and either click on the map or enter coordinates manually.
- Use the Auto-locate button to acquire device GPS coordinates; the app will attempt to fetch elevation automatically.
- Each survey point should include latitude, longitude and (preferably) elevation in feet. Add several points across the site (3+ points recommended for topographic analysis).
- To remove a point, click the red ✕ in the survey points table; deletions are immediate.

4) Upload site photos (batch-friendly)
- Use the photo upload area to drag-and-drop or select multiple images. The UI will stage files into an upload queue and upload them sequentially (one-at-a-time) so large batches are handled reliably.
- The uploader will automatically retry failed uploads up to 3 times. If an image still fails it will show as "Failed" in the queue.
- Uploaded photos are stored in the configured uploads directory. If the server is running in an environment where the default `uploads/` directory is not writable, the server falls back to a temp folder and exposes the images via an internal `/api/photos/file/:filename` URL so thumbnails still load.

5) Run analysis and generate a plan
- After you have points, boundaries and photos, run the Full Analysis from the Analysis panel. The analysis includes topography interpolation, slope/runoff estimation and soil-aware drainage recommendations.
- Generate a drainage plan to produce a printable HTML report with material lists and estimated costs.

6) Trash / Restore projects
- Deleting a project performs file cleanup. Use the Trash (soft-delete) and Restore endpoints from the project UI if you want undoable deletes for a project.

Troubleshooting
- Uploads failing or thumbnails missing: check server logs to confirm where files were written. If the app fell back to a temp upload dir, thumbnails will be served from `/api/photos/file/<filename>`; ensure the server process can read that directory.
- Multer errors: if you see errors such as `LIMIT_FILE_SIZE` or `LIMIT_UNEXPECTED_FILE`, either increase the limits in environment (or code) or reduce per-file sizes. The app allows up to 50 files per request on the backend but the frontend uploads sequentially to improve reliability.
- Geocoding or Overpass failures: those services are rate-limited. If you get `429` or timeouts, try again later or configure a commercial geocoding/parcel provider.

Tips & recommended workflow
- Start with a small number of survey points (4–8) across the property to get an initial topographic model. Add more points to refine contours.
- Use the parcel polygon from OSM/Overpass only as a starting estimate — confirm area from county assessor or deed where available.
- For production work, use a commercial geocoding provider and consider caching results to avoid rate limits.

Want enhancements?
- I can add progress bars for per-file upload (requires switching to XHR/Fetch streaming) or persistent queueing across browser sessions (IndexedDB). Tell me which and I’ll implement it.

