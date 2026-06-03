import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import SymptomsGrid from '../components/SymptomsGrid';
import Benefits from '../components/Benefits';
import AiAssistant from '../components/AiAssistant';
import ServicesCarousel from '../components/ServicesCarousel';
import ProcessTimeline from '../components/ProcessTimeline';
import Pricing from '../components/Pricing';
import Specialists from '../components/Specialists';
import Testimonials from '../components/Testimonials';
import FaqAccordion from '../components/FaqAccordion';
import FooterCta from '../components/FooterCta';
import ChatbotWidget from '../components/ChatbotWidget';

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Smooth scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="font-jakarta bg-background overflow-hidden selection:bg-primary/20 selection:text-primary min-h-screen">
      <Hero />
      <SymptomsGrid />
      <Benefits />
      <AiAssistant setIsChatOpen={setIsChatOpen} />
      <ServicesCarousel />
      <ProcessTimeline />
      <Pricing />
      <Specialists />
      <Testimonials />
      <FaqAccordion />
      <FooterCta setIsChatOpen={setIsChatOpen} />
      <ChatbotWidget isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
    </div>
  );
}
