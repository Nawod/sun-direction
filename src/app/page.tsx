import type { Metadata } from 'next';
import JourneyPlanner from '@/components/JourneyPlanner';
import PlannerGuide from '@/components/PlannerGuide';

export const metadata: Metadata = { alternates: { canonical: '/' } };
export default function Home() {
  return <><a className="skip-link" href="#main-content">Skip to route planner</a><JourneyPlanner/><PlannerGuide/></>;
}
