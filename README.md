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

