# ☀️ Sun Direction

**Sun Direction** is an advanced, intelligent transit route planner designed to answer one crucial question: *"Which side of the bus or train should I sit on to avoid the sun?"*

Built specifically for mobile use, the app calculates the exact geometry of your route against the physical position of the sun in the sky (factoring in the time of year, time of day, and planetary tilt) to recommend the most comfortable seat.

![App Preview](/public/window.svg) <!-- Replace with an actual screenshot if available -->

## ✨ Features

- **Advanced Sun Physics Engine:** Uses `suncalc` to calculate exact sun azimuth and altitude at micro-segments along your route.
- **Smart Weather Fallbacks:** Integrates with the Open-Meteo API. If it's heavily raining or completely overcast, the app intelligently tells you to "Sit Anywhere".
- **"Shadier Time" Auto-Suggest:** If you attempt to travel during peak glare, the app runs a hidden 4-hour simulation and suggests alternative departure times that reduce sun exposure by at least 30%.
- **Interactive Visualizations:** View a color-coded "Trip Timeline" showing exactly when the sun will hit the left side, right side, or when you'll be in the dark.
- **Dynamic Vehicle Graphics:** A top-down 2D rendering of your selected transport mode (Bus/Train) visually demonstrates where the sun rays will hit.
- **Step-by-step Navigation:** Expand the "View Journey Steps" accordion for exact transit instructions directly from Google Maps.
- **Progressive Web App (PWA):** Fully installable as a native app on iOS and Android devices directly from the browser.
- **Responsive Mobile-First UX:** The UI dynamically shifts between a "Search Mode" and a compact "Results Mode" to maximize map visibility on small screens.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16+](https://nextjs.org/) (App Router)
- **Styling:** Custom CSS with Glassmorphism UI principles
- **Maps API:** Google Maps API (`@react-google-maps/api`)
- **Astronomy/Physics:** `suncalc`
- **Weather API:** Open-Meteo API
- **Timezone Management:** `date-fns-tz`, `countries-and-timezones`

## 🚀 Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- A Google Cloud Console account with the **Maps JavaScript API** and **Places API (New)** enabled, with an active billing account linked to the same project. Routing uses **Routes API**, which must also be enabled and allowed by your API key.

### 2. Clone the Repository
```bash
git clone https://github.com/yourusername/sun-direction.git
cd sun-direction
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your Google Maps API Key:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:8001](http://localhost:8001) with your browser to see the result.

## 📦 PWA Support (Production)

To test the Progressive Web App features (like the "Install App" prompt), build and start the production server:
```bash
npm run build
npm run start
```

## © Copyright & Credits

Created by **Nawod Madhuwantha** ([nawodmadhuwantha.com](https://www.nawodmadhuwantha.com/)).

This project and its source code are provided for educational and demonstrative purposes. All rights reserved.

## Google Maps troubleshooting

`BillingNotEnabledMapError` means billing is not enabled for the Google Cloud project that owns your API key. In Google Cloud Console, select that project, open Billing, and link an active billing account. This cannot be fixed in application code.

Enable Maps JavaScript API and Places API (New) in that same project. Allow these APIs in the key restrictions, along with Routes API for routing. Set website restrictions to include `http://localhost:8001/*` and your production origin.

Routing uses Route.computeRoutes and createPolylines from the Maps JavaScript routes library. The selected departure time and bus/train preference are included in requests. If no bus route is available, an estimated driving route is clearly labeled.

The route fields use PlaceAutocompleteElement rather than the deprecated Autocomplete widget. After changing the environment key, restart the development server (rebuild for production), then reload the page.
