import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    quote: "Chitrashala didn't just photograph our wedding — they captured the very essence of our love story. Every frame feels like a painting.",
    name: "Priya & Arjun",
    event: "Udaipur Wedding, 2025",
  },
  {
    quote: "Working with Chitrashala felt effortless. They have this incredible ability to find beauty in the smallest, most fleeting moments.",
    name: "Meera & Karthik",
    event: "Kerala Destination Wedding, 2024",
  },
  {
    quote: "The photos made us relive every emotion. Our families were moved to tears seeing the final gallery. Truly artists.",
    name: "Ananya & Vikram",
    event: "Jaipur Celebration, 2025",
  },
];

const Testimonials = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs tracking-[0.4em] uppercase text-primary mb-12">Kind Words</p>
        
        <div className="relative min-h-[250px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="absolute"
            >
              <span
                className="text-8xl text-primary/20 leading-none block mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                "
              </span>
              <p
                className="text-xl md:text-2xl lg:text-3xl font-light text-foreground/90 leading-relaxed italic max-w-3xl mx-auto"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {testimonials[current].quote}
              </p>
              <div className="mt-8">
                <p className="text-sm tracking-[0.2em] text-foreground">{testimonials[current].name}</p>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-1">
                  {testimonials[current].event}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-3 mt-12">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-[2px] transition-all duration-500 ${
                i === current ? "w-10 bg-primary" : "w-4 bg-foreground/20"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
