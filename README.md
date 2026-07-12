# 🚚 RouteMaster - AI Logistics & Fleet Management

![RouteMaster Banner](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue)
![TailwindCSS](https://img.shields.io/badge/Style-TailwindCSS-06B6D4)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20(Python)-009688)
![Capacitor](https://img.shields.io/badge/Mobile-Capacitor%20(Android)-119ED8)

RouteMaster is a comprehensive, enterprise-grade logistics and fleet management platform. It combines a powerful web-based "Control Tower" for administrators with a native mobile application for delivery drivers.

The system uses advanced algorithmic routing and real-time geocoding to optimize delivery paths, providing live ETAs, distance tracking, and seamless communication between the warehouse and the fleet on the road.

## ✨ Key Features

### 🏢 For Administrators (Control Tower)
- **Live Fleet Tracking:** Monitor all active drivers on a real-time Leaflet satellite map.
- **AI Route Optimization:** Automatically calculates the most efficient delivery path using OpenRouteService (OSRM) matrix algorithms.
- **Order Management:** Compact, high-efficiency dashboard to manage pending packages, assign routes, and process manual warehouse drop-offs.
- **Financial Dashboard:** Track global revenue, operational costs, and fleet efficiency metrics.
- **Dark-Mode UI:** A stunning, glassmorphism-inspired interface built with TailwindCSS.

### 📱 For Drivers (Mobile App)
- **Native Android APK:** Installable directly on any Android device via Capacitor.
- **Driver Portal:** A dedicated view to see assigned routes, pending stops, and completed deliveries.
- **Live Navigation & ETA:** Floating HUD displaying real-time distance and estimated time of arrival based on current GPS location.
- **Proof of Delivery (POD):** One-tap system to mark packages as delivered with exact timestamps.
- **Offline Capable:** Leverages PWA Service Workers to ensure the app stays functional even in low-signal areas.

## 🛠️ Technology Stack

- **Frontend:** React 18, Vite, TailwindCSS, React-Leaflet, Axios.
- **Backend:** Python, FastAPI, SQLite (SQLAlchemy), JWT Authentication.
- **Mobile:** Ionic Capacitor (Wrapper for Android Native APK).
- **APIs:** OpenRouteService (Geocoding & Directions), OpenStreetMap.
- **Deployment:** Vercel (Frontend).

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/escobardeiby21-cmyk/RouteMaster.git
cd RouteMaster
```

### 2. Start the Backend (FastAPI)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 3. Start the Frontend (React)
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

### 4. Build the Android App (Optional)
```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

## 🔒 Default Credentials
For demonstration purposes, you can use the following default credentials to explore the system:
- **Admin Login:** `admin` / `1234`
- **Driver Login:** `chofer_1` / `1234`

---
*Built with ❤️ for modern logistics operations.*
