# CivicFix AI 2.0 🏙️
> **Advanced AI-Powered Civic Issue Reporting & Municipal Management Platform**

CivicFix AI 2.0 is a full-stack, responsive civic technology platform designed to bridge the gap between citizens and municipal authorities. It simplifies reporting potholes, overflowing garbage dumpsters, damaged roads, broken streetlights, water pipeline ruptures, and public hazards with **Gemini AI image and text triage**, **Leaflet interactive maps**, **real-time duplicate detection**, and **transparent status auditing**.

---

## 🌟 Key Features

### 1. Modern Smart-City Landing Page
- Preserves CivicFix brand identity (Navy `#102a43`, Ocean Teal `#176b87`, Vibrant Cyan `#087f8c`).
- Hero section with clear call-to-actions (`Report an Issue`, `Live Map`).
- Dynamic impact statistics (Total Reports, Pending Triage, In Progress, Resolved).
- 4-step "How It Works" visual flow (Snap & Report -> AI Triage -> Municipal Dispatch -> Track & Resolve).
- Category quick-selector cards for common municipal hazards.

### 2. Intelligent Complaint Submission
- **Photo Upload & Preview**: Drag-and-drop or file picker with instant preview, remove option, and client-side validation (JPG, PNG, WebP up to 5MB).
- **Dual Geolocation**:
  - One-click **"📍 Use Current Location"** using browser `navigator.geolocation` with automatic reverse geocoding via OpenStreetMap Nominatim.
  - Interactive **Leaflet Mini-Map**: Click anywhere on the mini-map to drop or drag a pin and auto-fill coordinates.
- **Unique Tracking ID**: Generates human-readable IDs (`CFX-2026-XXXXX`).

### 3. AI Issue Triage (Google Gemini 2.0 Flash)
- Secure server-side analysis via **Supabase Edge Function** (`analyze-issue`), ensuring API keys are never exposed in frontend code.
- Analyzes uploaded image and citizen description to suggest:
  - Exact issue category
  - Concise 10-15 word summary
  - Public safety severity (`Critical`, `High`, `Medium`, `Low`)
  - Recommended municipal priority
  - Confidence percentage & technical reasoning
  - Detected physical hazards
- **Transparent Demo Mode**: When the Gemini API is unconfigured or unavailable, the UI clearly displays `[DEMO MODE: Simulated AI Analysis]` without fabricating fake API responses.

### 4. Real-Time Proximity Duplicate Detection
- Uses the **Haversine formula** to calculate distance between coordinates and token-based text similarity for descriptions.
- When an active open complaint exists within 350 meters or has similar keywords, a non-blocking warning alert appears:
  > *"⚠️ Potential Duplicate Issue Detected! A similar issue was previously reported nearby (140m away). Review existing report before submitting."*
- Prevents redundant municipal tickets while still allowing citizens to submit if it is an independent issue.

### 5. Interactive Issue Map (Leaflet + OpenStreetMap)
- Displays all reported issues with valid coordinates across the municipality.
- Custom SVG pin markers color-coded by status (Gray = Pending, Purple = In Review, Amber = In Progress, Green = Resolved).
- Interactive marker popups featuring photo thumbnail, category, priority, status, and a button to view the full complaint record.
- Filter toolbar to filter map pins by category and status in real-time.

### 6. Citizen Dashboard & Feed
- Filter tabs: `All`, `Pending`, `In Progress`, `Resolved`.
- Live search across titles, categories, addresses, tracking IDs, and descriptions.
- Responsive issue cards with image previews, category tags, priority pills, and AI verification chips.
- Modal dialog with full details and **status audit history timeline**.

### 7. Protected Municipal Admin Portal
- Searchable complaints table with multi-filters (Status, Category, Priority).
- Triage modal enabling municipal officers to:
  - Inspect citizen photos and full Gemini AI suggestions.
  - Update complaint status (`Pending` -> `In Review` -> `In Progress` -> `Resolved` -> `Rejected`).
  - Assign municipal departments (*Public Works, Solid Waste, Electricity Board, Water Board, Electrical Safety*).
  - Add official progress notes that get recorded in the public status audit trail.
- Role-based permissions enforced by PostgreSQL Row Level Security (RLS).

### 8. Enterprise PostgreSQL Database & Security
- **Strict Row Level Security (RLS)**:
  - Public read access for transparency.
  - Citizens can only update their own pending complaints and cannot alter priority or status.
  - Role escalation prevention: Citizens cannot elevate themselves to administrators.
  - Immutable audit history: Updates and deletions on `complaint_status_history` are blocked by RLS policies.
- Automated triggers for `updated_at` timestamps and automatic lifecycle transition logging.

---

## 🚀 Quick Start (One Command)

You can launch the entire platform with one command:

```bash
npm start
```
*(Or on Windows, simply double-click `start.bat`)*

Then open your browser at:
**[http://localhost:3000](http://localhost:3000)**

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Server** | Node.js (v24+), Express 5 / 4, CORS, JSON Body-Parser |
| **Database** | Persistent JSON File Database (`data/complaints.json`) with sample municipal issues |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+ Modules), Bootstrap 5.3.3 |
| **Mapping** | Leaflet 1.9.4, OpenStreetMap Tiles, Nominatim Geocoding API |
| **AI Triage** | Google Gemini 2.0 Flash / Built-in Smart Municipal Heuristic Engine |
| **Alternative DB** | Supabase PostgreSQL with Row Level Security (SQL schemas included) |

---

## 📂 Project Directory Structure

```
CivicFix-AI/
├── index.html                   # Upgraded single-page application entry point
├── css/
│   └── styles.css               # Design system, brand colors, cards, badges, map
├── js/
│   ├── config.js                # App config, demo mode toggles, localStorage overrides
│   ├── supabase-client.js       # Safe Supabase JS client factory
│   ├── auth.js                  # User authentication & demo role switcher
│   ├── geo-service.js           # GPS geolocation, reverse geocoding & Haversine duplicate check
│   ├── gemini-service.js        # Edge Function caller with labeled demo fallback
│   ├── complaints-store.js      # Unified data store (PostgreSQL / localStorage + v1 migration)
│   ├── map-view.js              # Leaflet map rendering, custom pins, mini coordinate picker
│   └── app.js                   # Application controller, event listeners, view navigation
├── supabase/
│   ├── schema.sql               # PostgreSQL schema (profiles, complaints, audit history)
│   ├── rls.sql                  # Row Level Security policies & role protection
│   ├── storage.sql              # Supabase storage bucket & upload policies
│   ├── seed.sql                 # Sample municipal issues with coordinates & audit logs
│   └── functions/
│       └── analyze-issue/
│           └── index.ts         # Supabase Edge Function integrating Gemini 2.0 Flash
├── .env.example                 # Environment variables template
├── SETUP_GUIDE.md               # Beginner-friendly setup instructions
└── README.md                    # Comprehensive project documentation
```

---

## 🧪 Manual Testing Checklist

Use this checklist to verify all system workflows:

- [ ] **1. Landing Page Navigation**: Click through navbar items (`Home`, `Report Issue`, `Live Map`, `Citizen Feed`, `Admin Portal`) and verify smooth view transitions.
- [ ] **2. Impact Statistics**: Verify that the counters (`Total`, `Pending`, `In Progress`, `Resolved`) update dynamically based on the stored data.
- [ ] **3. Photo Upload & Preview**: In the submission form, drag-and-drop or select a picture (`.jpg`, `.png`). Verify image preview renders and the `✕` remove button works.
- [ ] **4. GPS Geolocation**: Click `📍 Use Current Location`. Verify coordinates populate and the address field is filled via OpenStreetMap reverse geocoding.
- [ ] **5. Mini-Map Pin Drop**: Click anywhere on the mini-map picker in the form. Verify the pin drops and coordinates update.
- [ ] **6. Real-time Duplicate Detection**: In the form, type a title like `"Pothole on MG Road"`. Verify the duplicate warning card appears showing the existing matching complaint.
- [ ] **7. Gemini AI Triage**: Click `⚡ Analyze with Gemini AI`. Verify that the AI suggestion box displays category, severity, priority, confidence score, and reasoning. Notice the clear indicator (`Live Gemini` or `[DEMO MODE: Simulated AI output]`).
- [ ] **8. Issue Submission**: Submit the form. Verify that a unique tracking ID (`CFX-2026-XXXXX`) is generated and the view switches to the Citizen Feed showing your new card.
- [ ] **9. Interactive Map**: Navigate to `Live Map`. Verify markers are placed at valid coordinates. Click a pin to open the popup and click `View Full Report`.
- [ ] **10. Status Audit History**: Open any complaint details modal. Verify the municipal status audit timeline displays each lifecycle transition with timestamps.
- [ ] **11. Admin Triage & Status Update**: Switch to Admin Portal (or choose `🛡️ Municipal Admin Mode` in the demo dropdown). Click `Triage & Update`, change status to `Resolved`, enter progress remarks, and save. Verify the update reflects immediately in stats, map, and citizen feed.
- [ ] **12. Settings Configuration**: Click `⚙️` in the navbar. Verify you can input Supabase credentials or click `Reset to Demo` at any time.

---

## ⚠️ Limitations & Notes
- **Static Hosting**: Frontend runs as client-side ES6 modules. When testing locally, run using any local server (e.g., VS Code Live Server, `npx serve`, or Python `python -m http.server 8080`) to allow browser module imports.
- **Edge Function Deployment**: Calling Gemini requires deploying `supabase/functions/analyze-issue` with `GEMINI_API_KEY` set. When not deployed, the application gracefully operates in clearly labeled Demo Mode.
