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

