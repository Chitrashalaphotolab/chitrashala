import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";

const slides = [
  { src: hero1, title: "Stories", subtitle: "that last forever" },
  { src: hero2, title: "Emotions", subtitle: "captured in light" },
  { src: hero3, title: "Portraits", subtitle: "of the soul" },
  { src: hero4, title: "Journeys", subtitle: "worth remembering" },
];

const HeroSlideshow = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  // Character animation variants
  const charVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.3 + i * 0.04, duration: 0.6, ease: "easeOut" as const },
    }),
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].src}
            alt={slides[current].title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/10 to-background/90" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <AnimatePresence mode="wait">
          <motion.div key={current} className="text-center">
            {/* Character-by-character title */}
            <h1
              className="text-6xl md:text-8xl lg:text-9xl font-light tracking-wider text-foreground overflow-hidden"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {slides[current].title.split("").map((char, i) => (
                <motion.span
                  key={`${current}-${i}`}
                  custom={i}
                  variants={charVariants}
                  initial="hidden"
                  animate="visible"
                  className="inline-block"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </h1>
            <motion.p
              className="mt-4 text-lg md:text-xl tracking-[0.3em] uppercase text-foreground/60 font-light"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
            >
              {slides[current].subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        {/* Explore CTA */}
        <motion.a
          href="#portfolio"
          className="absolute bottom-32 text-[10px] tracking-[0.4em] uppercase text-foreground/50 hover:text-primary transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          data-cursor-hover
        >
          Explore Stories
        </motion.a>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-[2px] transition-all duration-500 ${
              i === current ? "w-12 bg-primary" : "w-6 bg-foreground/20"
            }`}
          />
        ))}
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-primary/50 to-primary" />
      </motion.div>

      {/* Slide number */}
      <div className="absolute bottom-10 right-8 z-10 hidden md:block">
        <span className="text-xs tracking-[0.2em] text-foreground/30">
          {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
};

export default HeroSlideshow;
