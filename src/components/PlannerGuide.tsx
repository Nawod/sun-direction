import Link from 'next/link';

export default function PlannerGuide() {
  return <section className="planner-guide" aria-labelledby="guide-title" id="planning-guide">
    <h2 id="guide-title">Which side of the bus or train gets less sun?</h2>
    <p>Sun Direction compares sunlight on the left and right sides of your journey using your route and departure time. Left and right always mean facing the front of the vehicle.</p>
    <ol><li>Choose bus or train, then enter your starting point and destination.</li><li>Set the departure date and time in the timezone shown in the header.</li><li>Select “Find my shady side” to see your recommended seat.</li><li>Move “Position along journey” to explore the sun’s bearing and elevation along the route.</li></ol>
    <h3>What does the recommendation include?</h3>
    <p>It estimates direct sunlight as the route changes direction. At night or when exposure is similar, either side may be suitable. Available cloud and rain forecasts can adjust the recommendation.</p>
    <h3>Is shade guaranteed?</h3>
    <p>No. Buildings, trees, window tint, seat availability, and changing weather can affect your journey. The sun compass illustrates angles, not the sun’s distance. If bus schedules are unavailable, any estimated road route is clearly labeled.</p>
    <nav aria-label="Planner resources"><Link href="/guide">Detailed guide and browser-agent reference</Link><a href="/llms.txt">Plain-text app reference</a><a href="#main-content">Back to the route planner</a></nav>
  </section>;
}
