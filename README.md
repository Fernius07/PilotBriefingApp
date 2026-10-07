# ✈️ PilotBriefingApp

[![React](https://img.shields.io/badge/React-19.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deployment_Ready-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![Security: HMAC Signed](https://img.shields.io/badge/Security-HMAC--SHA256-blue.svg)](server/utils/security.js)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

**PilotBriefingApp** is an enterprise-grade, real-time aviation flight dispatch and aerodrome operational briefing web application built to Electronic Flight Bag (EFB) cockpit standards. It is engineered for real-world aviators, flight dispatchers, aviation students, and advanced flight simulation pilots (Microsoft Flight Simulator 2024/2020, X-Plane, Prepar3D, VATSIM, IVAO).

The application provides a comprehensive situational overview of any aerodrome globally within seconds, integrating intelligent NOTAM decoding, live aviation meteorology (METAR/TAF), trigonometric runway wind vectors, live VATSIM ATC network coverage, and 1-click SimBrief Operational Flight Plan (OFP) synchronization.

---

## 🛰️ 100% Real-Time Data (Zero Static Mocks)

PilotBriefingApp connects **strictly to live official aeronautical sources and live operational data feeds**:

* **Meteorology & Airport Information (METAR / TAF / Coordinates)**: [NOAA Aviation Weather Center (AWC)](https://aviationweather.gov/).
* **Official International NOTAMs**: [FAA International NOTAM System (FNS / AIM)](https://notams.aim.faa.gov/).
* **Online ATC & Network Traffic**: [VATSIM Live Data Feed v3](https://data.vatsim.net/).
* **Operational Flight Plans (OFP)**: [SimBrief API](https://www.simbrief.com/).

> **Data Fidelity Guarantee**: Every ICAO query triggers direct real-time communication with official aeronautical providers. No stale databases or synthetic dummy records are ever used.

---

## 🌟 Key Features

### 1. 🧠 Intelligent NOTAM Decoding & Classification
* **Plain Language Translation**: Deconstructs cryptic ICAO Q-codes and FAA shorthand into clear, human-readable operational language.
* **Standardized Category Breakdown**:
  * 🔴 **Runways** (`RWY`): Closures, displaced thresholds, and surface contamination.
  * 🟠 **Taxiways** (`TWY`): Route restrictions, closures, and work in progress.
  * 🟡 **Navaids & Lighting** (`NAV/ILS/LIGHTING`): ILS glideslope/localizer outages, VOR status, PAPI/approach lights.
  * 🔵 **Obstacles & Cranes** (`OBST/CRANE`): Temporary masts, cranes, and surveyed hazards.
  * 🟣 **Airspace & Hazards** (`AIRSPACE/TFR`): Temporary flight restrictions, parachuting, fireworks, and military zones.
  * ⚪ **Other General Notices** (`OTHER`).
* **Visual Severity Triage**: Instantly flags items as `CRITICAL`, `WARNING`, `CAUTION`, or `INFO`.

### 2. ⏱️ Executive Flight Operational Impact Summary (Now + 4 Hours Window)
* **Time-Critical Filtering**: Isolates notices that directly affect flight operations today and within the immediate **3 to 4-hour departure/arrival window**.
* **Active Now vs. Upcoming Badges**: Notices currently active are displayed prominently with real-time indicators, while future restrictions expected in 3–4 hours are clearly labeled as `UPCOMING 3-4H` to prevent approach surprises.
* **4 Core Operational Pillars**: Real-time KPI summary tracking:
  1. Closed Runways
  2. Navaid & ILS Outages
  3. Closed Taxiways
  4. Airspace & TFR Restrictions
* **Actionable Crew Checklist**: Auto-generated checklist alerting pilots to essential pre-flight and in-flight actions (e.g., runway exclusions in EFB, verifying RNP approaches).
* **Strict Military Zulu Aviation Timestamping**: Every validity window is displayed in standardized aeronautical format:
  $$\text{DD/MM/YYYY HHMMZ}$$

### 3. 🗺️ Interactive Dual-Layer Leaflet Cartography
Clicking on any NOTAM card immediately opens a cockpit briefing modal featuring an interactive map canvas with full Leaflet integration:
* **Accurate 3-Geometry Rendering**:
  1. **Demarcated Areas / Polygons (`POLYGON`)**: Renders enclosed multi-point spatial boundaries (e.g., military firing zones, aerobatic boxes, parachuting drop zones).
  2. **Point & Radius (`CIRCLE`)**: Renders a center coordinate with a circular influence perimeter in Nautical Miles and meters.
  3. **Specific Point (`POINT`)**: Pinpoints exact coordinates for tall cranes, construction equipment, or transmitter outages.
* **Map Layer Switcher**:
  * **Normal**: Clean street and terrain vector cartography.
  * **Satellite**: High-resolution aerial imagery via Esri World Imagery.
* **Cockpit Optical Alignment**: Automatic dynamic bounding (`fitBounds`) with generous padding to prevent visual clipping.
* **Body Scroll-Lock**: The background page is locked from scrolling while the modal is open, allowing smooth inspection of full NOTAM text without screen movement.

### 4. 🌦️ Real-Time Aviation Weather (METAR & TAF)
* **Flight Category Badges**: Instant visual identification based on ceiling and visibility:
  * 🟢 **VFR** (Visual Flight Rules)
  * 🔵 **MVFR** (Marginal VFR)
  * 🟡 **IFR** (Instrument Flight Rules)
  * 🟣 **LIFR** (Low IFR)
* **Automated Environmental Threat Analysis**:
  * Structural icing hazard and anti-ice requirements based on temperature and dewpoint spread.
  * Fog banks, low visibility procedures (LVP), and critical cloud ceilings.
  * Convective thunderstorm activity, rain, and turbulence.
  * Crosswind threshold warnings.
* **Decoded TAF Evolution**: Chronological breakdown by forecast groups (TEMPO, BECMG, PROB).

### 5. 🧭 Runway Crosswind & Wind Vector Calculation
* **Trigonometric Vector Analysis**: Real-time calculation for every runway threshold against the prevailing METAR wind:
  * **Headwind / Tailwind Component**: $V \cdot \cos(\theta)$
  * **Crosswind Component**: $V \cdot \sin(\theta)$ (with left/right crosswind indication)
* **Preferred Runway Recommendation**: Automatically calculates and highlights the optimal runway offering the highest headwind and lowest crosswind.
* **Graphic Vector Rose**: Visual representation of magnetic runway heading aligned with real-time wind arrows.

### 6. 🎮 Flight Simulation Integration (SimBrief & VATSIM)
* **1-Click SimBrief OFP Import**: Direct retrieval of your latest dispatch release by SimBrief Username or Pilot ID:
  * Origin, Destination, Alternate, Planned Runways, Cruise Altitude (FL), Block Fuel, Distance, and Route.
* **Live VATSIM ATC Coverage**:
  * Active controller positions (Tower, Ground, Delivery, Approach/Departure, Radar Control) with frequencies and ATIS.
  * Unicom 122.800 self-announcement guidance when no ATC is online.
  * Expected inbound and outbound traffic tracking with callsigns, aircraft types, and flight levels.

---

## 🛡️ Anti-Scraping & Cryptographic API Security

To prevent unauthorized third-party extraction or external scraping of the backend services via browser DevTools/Inspect or automated curl/Postman scripts, PilotBriefingApp implements an enterprise-grade defense layer:

1. **Client-Side Web Crypto API Signing**:
   Every request from the browser is cryptographically signed using the browser-native `window.crypto.subtle` API.
2. **Ephemeral HMAC-SHA256 Handshake**:
   The client calculates a dynamic SHA-256 HMAC digest based on a rotating shared handshake key, the target request path, and a high-precision UNIX millisecond timestamp.
3. **Strict 90-Second Freshness Window**:
   The server rejects any request with expired or manipulated timestamps outside the ±90 second window, neutralizing replay attacks.
4. **Direct URL Bar Navigation Shield**:
   Requests initiated via direct browser address bar inspection (`Sec-Fetch-Dest: document` to `/api/*`) are intercepted and safely redirected to `/`.
5. **Zero Dependency Footprint**:
   All cryptography relies on native Node.js `crypto` on the server and native browser `SubtleCrypto` on the frontend, ensuring lightning-fast execution without heavy external libraries.

---

## ☁️ Vercel Serverless Architecture & FAA SSL Verification

### The Challenge
When deploying Node.js applications to serverless cloud environments (such as Vercel AWS Lambda Linux runtimes), requests to the United States Government FAA AIM NOTAM service (`notams.aim.faa.gov`) can fail with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` because standard Linux certificate stores do not bundle the FAA's intermediate government CA certificates.

### The Solution
PilotBriefingApp incorporates dedicated SSL leaf signature verification bypass (`NODE_TLS_REJECT_UNAUTHORIZED = '0'`) specifically scoped within the FAA NOTAM client, complemented by extensive diagnostic telemetry. This guarantees **100% reliable real-time NOTAM data delivery** on Vercel deployments.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS 3, Lucide React |
| **Interactive Maps** | Leaflet 1.9, OpenStreetMap Vector, Esri World Imagery Satellite |
| **Backend** | Node.js (CommonJS), Express 5.2 |
| **Security** | Web Crypto API (`SubtleCrypto`), Node.js `crypto`, HMAC-SHA256, Anti-Scraping Middleware |
| **Aviation Engines** | Proprietary ICAO/FAA Decoders for NOTAM, METAR, TAF, and Runway Crosswind Vectors |
| **Cloud Deployment** | Vercel (Edge CDN Static Frontend + Serverless Express API Functions) |

---

## 📂 Project Directory Structure

```text
PilotBriefingApp/
├── api/
│   └── index.js             # Vercel Serverless Function entrypoint for Express
├── public/                  # Favicon and static public assets
├── server/
│   ├── app.js               # Central Express app, routes & anti-scraping security
│   ├── index.js             # Local standalone backend entrypoint
│   ├── services/
│   │   ├── weatherService.js   # NOAA METAR/TAF client & threat analyzer
│   │   ├── notamService.js     # FAA NOTAM client with SSL leaf handshake fix
│   │   ├── windCalculator.js   # Trigonometric crosswind & headwind engine
│   │   ├── vatsimService.js    # VATSIM data feed client
│   │   └── simbriefService.js  # SimBrief OFP client
│   └── utils/
│       ├── notamDecoder.js     # Q-code decoder, timing, and geo-boundary parser
│       └── security.js         # HMAC-SHA256 token verification middleware
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Cockpit header with military Zulu clock & search
│   │   ├── WeatherCard.jsx         # Live METAR/TAF & threat analysis card
│   │   ├── RunwayWindAnalysis.jsx  # Runway heading & crosswind vector analysis
│   │   ├── NotamSection.jsx        # NOTAM list & executive flight impact summary
│   │   ├── NotamMapModal.jsx       # 2-column Leaflet interactive map modal
│   │   ├── VatsimCard.jsx          # Live VATSIM ATC & traffic panel
│   │   └── SimBriefModal.jsx       # SimBrief OFP integration modal
│   ├── utils/
│   │   ├── apiClient.js            # Secure client-side crypto signing (SubtleCrypto)
│   │   └── aviationHelpers.js      # Zulu date formatting & aviation utilities
│   ├── App.jsx                     # Core application orchestrator
│   ├── index.css                   # Tailwind styles and cockpit themes
│   └── main.jsx                    # React entrypoint
├── index.html               # HTML5 document with JetBrains Mono typography
├── LICENSE                  # Proprietary License (All Rights Reserved)
├── package.json             # Build configuration and dependencies
├── tailwind.config.cjs      # Cockpit dark-theme color palette
├── vercel.json              # Vercel routing and serverless function rewrite rules
└── vite.config.mjs          # Vite configuration and local proxy
```

---

## 🚀 Local Installation & Development

### Prerequisites
* **Node.js** v18.0.0 or higher.
* **npm** package manager.

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Fernius07/PilotBriefingApp.git
   cd PilotBriefingApp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start in development mode**:
   ```bash
   npm run dev
   ```
   * Vite frontend will launch at `http://localhost:3000`.
   * Express backend will run at `http://localhost:3001`.
   * Vite proxies all `/api/*` calls directly to the local backend.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## ☁️ Deploying to Vercel

The project includes built-in Vercel configuration (`vercel.json` and `api/index.js`):

1. Push this repository to your GitHub account:
   ```bash
   git push origin main
   ```
2. Log into [Vercel](https://vercel.com/).
3. Click **Add New...** > **Project** and select **`Fernius07/PilotBriefingApp`**.
4. Vercel will automatically detect the **Vite** framework:
   * **Framework Preset**: Vite
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
5. Click **Deploy**.
6. That's it! Vercel will deploy the static client on its global Edge CDN and run the Express API endpoints as scalable Node.js Serverless Functions.

---

## 📄 License

Copyright © 2026 **Fernius07**. All rights reserved.

This software and its source code are the exclusive intellectual property of **Fernius07**. End users are granted the right to access and use the hosted application for personal, educational, and flight simulation purposes. Any unauthorized copying, reproduction, redistribution, modification, selling, or re-hosting of this source code or derivative works is strictly prohibited.

For complete terms, review the [LICENSE](LICENSE) file.

---

## ⚠️ Aviation Safety Disclaimer

> **FOR INFORMATIONAL AND SIMULATION USE ONLY**: PilotBriefingApp is developed as a rapid informational and flight simulation briefing tool. Pilots in command (PIC) of real-world aircraft are legally responsible for verifying all flight planning, weather, and NOTAM information through certified state aeronautical information publications (official AIP, State CAA NOTAM offices, and approved meteorological flight services).
