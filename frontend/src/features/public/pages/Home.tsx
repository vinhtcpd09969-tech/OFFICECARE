import { useState, useEffect } from 'react';
import Hero from '../components/home/Hero';
import SymptomsGrid from '../components/home/SymptomsGrid';
import Benefits from '../components/home/Benefits';
import AiAssistant from '../components/chatbot/AiAssistant';
import ServicesCarousel from '../components/home/ServicesCarousel';
import ProcessTimeline from '../components/home/ProcessTimeline';
import Pricing from '../components/home/Pricing';
import Specialists from '../components/home/Specialists';
import Testimonials from '../components/home/Testimonials';
import FaqAccordion from '../components/home/FaqAccordion';
import FooterCta from '../components/home/FooterCta';
import ChatbotWidget from '../components/chatbot/ChatbotWidget';

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
