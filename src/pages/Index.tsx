import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import HeroSlideshow from "@/components/HeroSlideshow";
import Marquee from "@/components/Marquee";
import PortfolioGrid from "@/components/PortfolioGrid";
import VideoSection from "@/components/VideoSection";
import Testimonials from "@/components/Testimonials";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";

import FilmGrain from "@/components/FilmGrain";
import ScrollProgress from "@/components/ScrollProgress";
import ThemeToggle from "@/components/ThemeToggle";
import ContentProtection from "@/components/ContentProtection";

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const handleLoaded = useCallback(() => setLoaded(true), []);

  return (
    <div className="min-h-screen bg-background">
      <Preloader onComplete={handleLoaded} />
      
      <FilmGrain />
      <ScrollProgress />
      <ThemeToggle />
      <ContentProtection />

      {loaded && (
        <>
          <Navbar />
          <HeroSlideshow />
          <Marquee />
          <PortfolioGrid />
          <VideoSection />
          <Testimonials />
          <AboutSection />
          <ContactSection />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Index;
