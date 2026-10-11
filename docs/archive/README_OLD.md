# UrbanRally 🎯

**Multi-Tenant Scavenger Hunt SaaS for International Student Organizations**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Then edit .env with your Firebase credentials

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Project Overview

UrbanRally is an **Offline-First Progressive Web App (PWA)** that enables international student organizations (like ESN) to run engaging scavenger hunt events across cities. Teams navigate using GPS, complete challenges, and earn points—all while offline.

### Key Features
- ✅ **Offline-First Architecture** - Works without internet after initial load
- ✅ **Multi-Tenant SaaS** - Host multiple events with strict data isolation
- ✅ **Team Code Authentication** - Simple access via pre-generated codes
- ✅ **GPS-Based Challenges** - Location-triggered tasks and checkpoints
- ✅ **Photo Missions** - Client-side image compression (<200KB)
- ✅ **Sponsored Tasks** - Monetization through branded challenges
- ✅ **Dynamic Theming** - White-label branding per tenant

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS (with CSS variables for theming)
- **State**: Zustand (offline-resilient)
- **Maps**: React-Leaflet (offline tile caching)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Payments**: Stripe via Firebase Extension

## 📂 Project Structure

```
urban-rally/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker for offline
│   └── icons/                 # App icons
├── src/
│   ├── components/            # Reusable UI components
│   ├── features/              # Feature-based modules
│   │   ├── auth/              # Team code authentication
│   │   ├── map/               # Leaflet map integration
│   │   ├── tasks/             # Task list & completion
│   │   └── leaderboard/       # Rankings & scores
│   ├── services/              # Firebase & API services
│   │   ├── firebase.service.ts
│   │   └── mock.service.ts    # Development mock data
│   ├── store/                 # Zustand state management
│   ├── types/                 # TypeScript definitions
│   │   └── schema.ts          # Core data models
│   ├── utils/                 # Helper functions
│   │   ├── image.utils.ts     # Image compression
│   │   └── geo.utils.ts       # GPS calculations
│   ├── config/                # App configuration
│   │   └── app.config.ts
│   ├── index.css              # Global styles + Tailwind
│   └── main.tsx               # App entry point
├── .env.example               # Environment template
├── tailwind.config.js         # Tailwind configuration
└── vite.config.ts             # Vite configuration
```

## 🔑 Environment Setup

Create a `.env` file in the root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 🎮 Core Concepts

### Multi-Tenancy
Every Firestore query is scoped by `tenantId` to ensure data isolation between organizations.

### Offline-First
Uses Firestore's `enableIndexedDbPersistence()` to cache data locally. Users load the app on WiFi, then play offline during the event.

### Team Code Auth
No email/password. Users enter a pre-generated access code (e.g., "BER-42") linked to their team.

## 📝 Development Guidelines

- Mobile-first responsive design
- Touch targets must be ≥44px
- All images compressed client-side before upload
- Strict TypeScript typing (no `any`)
- Multi-tenant query validation in all services

## 🧪 Development Mode

The project includes a mock service for developing UI without Firebase:

```typescript
import { mockService } from './services/mock.service';

// Use mock data during development
const tasks = await mockService.getTasks(eventId, tenantId);
```

## 🔥 Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore, Authentication (Anonymous), and Storage
3. Install Firebase Stripe Extension for payments
4. Copy your Firebase config to `.env`

## 📄 License

MIT

---

Built with ❤️ for international students worldwide 🌍
