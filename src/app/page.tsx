import type { Metadata } from 'next';
import JourneyPlanner from '@/components/JourneyPlanner';
import PlannerGuide from '@/components/PlannerGuide';

export const metadata: Metadata = { alternates: { canonical: '/' } };
export default function Home() {
  return <div className="home-page"><a className="skip-link" href="#main-content">Skip to route planner</a><JourneyPlanner/><details className="planner-about"><summary><span>About Sun Direction</span><span className="about-caption">How seat recommendations work</span></summary><PlannerGuide/></details></div>;
}
