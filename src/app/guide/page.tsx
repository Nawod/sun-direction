import type { Metadata } from 'next';
import Link from 'next/link';
import PlannerGuide from '@/components/PlannerGuide';

export const metadata: Metadata = { title: 'How to use Sun Direction | Route planner guide', description: 'Plan a journey, interpret the seat recommendation, and use accessible controls to explore sunlight. Includes a browser-agent reference.', alternates: { canonical: '/guide' } };
export default function Guide() {
  return <main id="main-content" className="reference-page"><Link href="/">← Open Sun Direction</Link><h1>Sun Direction guide</h1><PlannerGuide/>
    <section className="planner-guide" aria-labelledby="agent-title"><h2 id="agent-title">Browser-agent reference</h2><p>The planner is a browser application, not a public route API. Google Maps must load before place search and route calculations are available.</p>
    <h3>Use the accessible controls</h3><ol><li>Dismiss the optional interactive guide with “Skip guide” or Escape, or follow it using the highlighted controls.</li><li>In the “Plan a journey” form, select “Bus” or “Train”. The selected button has aria-pressed=true.</li><li>Fill the place controls named “Your starting point” and “Where are you headed?”. Select a place suggestion when offered.</li><li>Use “Journey timezone” and the date-time input labeled “Leaving at”.</li><li>Press “Find my shady side”. Wait for the “Seat recommendation” region or an inline alert. Read the result as text; map images are not required.</li><li>Use the “Position along journey” slider and “Sunlight along the journey” region to read the time, elevation, bearing, and side receiving sunlight.</li><li>“Edit journey” returns to the form. “Share this journey” copies the current route link when clipboard access is available.</li></ol>
    <h3>Shareable route links</h3><p>The home page accepts <code>origin</code> and <code>dest</code> as addresses or latitude,longitude pairs, <code>mode</code> as BUS or TRAIN, <code>time</code> as a Unix timestamp in milliseconds, and <code>tz</code> as an IANA timezone. Encode query values. Opening a complete origin/destination link automatically requests a route.</p><p>Ask the user for missing journey details. Do not treat an unavailable route or loading screen as a successful recommendation. The app does not book tickets.</p>
    </section></main>;
}
