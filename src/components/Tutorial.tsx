'use client';
import { useEffect, useRef, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';

const steps = [
  { target: '#tour-mode', title: 'Choose your transport', text: 'Click Bus or Train in the highlighted control to begin.' },
  { target: '#tour-origin', title: 'Enter your starting point', text: 'Type into the highlighted From field and choose a place suggestion. Then continue.' },
  { target: '#tour-destination', title: 'Where are you going?', text: 'Enter your destination in the real To field. Choose a suggestion, then continue.' },
  { target: '#tour-departure', title: 'Set your departure', text: 'Click the date and time control to choose when you travel. Times use the timezone in the header.' },
  { target: '#tour-calculate', title: 'Find your shady side', text: 'Click the highlighted button. We’ll continue when your route and seat recommendation are ready.' },
  { target: '#seat-recommendation', title: 'This is your recommended side', text: 'Left and right mean facing the front of the vehicle. This estimate compares sunlight over your journey.' },
  { target: '.journey-slider', title: 'Explore the real route', text: 'Drag the highlighted slider or press an arrow beside it. Watch the sun move along your route.' },
];
interface Props { origin: string; destination: string; hasResult: boolean; isLoading: boolean; routeError: string; onClose: () => void }
export default function Tutorial({ origin, destination, hasResult, isLoading, routeError, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [explored, setExplored] = useState(false);
  const [box, setBox] = useState<{top:number;left:number;width:number;height:number;cardTop:number;cardLeft:number}|null>(null);
  const card = useRef<HTMLDivElement>(null);
  const current = steps[step];
  const dismiss = () => { try { localStorage.setItem('sun-direction-tour-v2','seen'); } catch {} onClose(); };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if(event.key==='Escape') { try { localStorage.setItem('sun-direction-tour-v2','seen'); } catch {} onClose(); } };
    document.addEventListener('keydown',escape);
    return()=>document.removeEventListener('keydown',escape);
  },[onClose]);
  useEffect(() => {
    if(step<=4 && hasResult) { const id=requestAnimationFrame(()=>setStep(5)); return()=>cancelAnimationFrame(id); }
  },[step,hasResult]);
  useEffect(() => {
    const target=document.querySelector<HTMLElement>(current.target);
    if(!target) return;
    target.setAttribute('aria-describedby','tour-instruction');
    const oldTabIndex=target.getAttribute('tabindex');
    if(oldTabIndex===null)target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
    target.scrollIntoView({block:innerWidth>800?'nearest':'center',behavior:'instant'});
    let frame=0;
    const update=()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const rect=target.getBoundingClientRect();
        const height=card.current?.offsetHeight||240;
        const width=Math.min(360,window.innerWidth-24);
        const beside=rect.right+24+width<window.innerWidth;
        setBox({top:rect.top-5,left:rect.left-5,width:rect.width+10,height:rect.height+10,
          cardTop:beside?Math.max(12,Math.min(rect.top,innerHeight-height-12)):rect.top>height+24?rect.top-height-14:Math.min(innerHeight-height-12,rect.bottom+14),
          cardLeft:beside?rect.right+20:Math.max(12,Math.min(rect.left,innerWidth-width-12))});
      });
    };
    const interact=(event:Event)=>{
      if(step===0 && (event.target as HTMLElement).closest('button')) setStep(1);
      if(step===6) setExplored(true);
    };
    target.addEventListener('click',interact);target.addEventListener('input',interact);
    const observer=new ResizeObserver(update);observer.observe(target);if(card.current)observer.observe(card.current);
    window.addEventListener('resize',update);window.addEventListener('scroll',update,true);update();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',update);window.removeEventListener('scroll',update,true);target.removeEventListener('click',interact);target.removeEventListener('input',interact);target.removeAttribute('aria-describedby');if(oldTabIndex===null)target.removeAttribute('tabindex');};
  },[step,current.target,isLoading,routeError]);
  const canContinue=step===1?!!origin.trim():step===2?!!destination.trim():step===3||step===5;
  return <div className="guided-tour">
    {box && !isLoading && <div className="tour-spotlight" aria-hidden="true" style={{top:box.top,left:box.left,width:box.width,height:box.height}}/>}
    <div ref={card} className="tour-card" role="region" aria-label="Interactive guide" style={{top:box?.cardTop??12,left:box?.cardLeft??12}}>
      <button className="icon-button close-help" aria-label="Close tutorial" onClick={dismiss}><X size={20}/></button>
      <span className="tutorial-progress">On your screen · {step+1} of {steps.length}</span>
      <div aria-live="polite" aria-atomic="true"><h2>{isLoading?'Finding your route…':current.title}</h2><p id="tour-instruction">{isLoading?'Your journey is being calculated. You can leave this guide open.':step===4&&routeError?'The route could not load. Check the error below the form, edit your locations, and try again.':current.text}</p></div>
      <div className="tour-actions"><button className="tour-skip" onClick={dismiss}>Skip guide</button>{step>0&&step<5&&<button className="tour-back" disabled={isLoading} onClick={()=>setStep(step-1)}>Back</button>}{step===6?<button className="primary-button" disabled={!explored} onClick={dismiss}>Finish guide</button>:canContinue?<button className="primary-button" onClick={()=>setStep(step+1)}>Next<ArrowRight size={16}/></button>:<span className="tour-action-hint">{step===0?'Click a transport option':step===1||step===2?'Enter a location to continue':'Use the highlighted button'}</span>}</div>
    </div>
  </div>;
}
