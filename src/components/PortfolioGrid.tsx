import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";
import Lightbox from "./Lightbox";

const images = [
  { src: gallery1, title: "The First Dance", category: "Wedding" },
  { src: gallery2, title: "Sacred Details", category: "Details" },
  { src: gallery3, title: "The Groom", category: "Portrait" },
  { src: gallery4, title: "Golden Hour", category: "Couple" },
  { src: gallery5, title: "Monsoon Love", category: "Couple" },
  { src: gallery6, title: "By The Sea", category: "Destination" },
];

const PortfolioGrid = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <section id="portfolio" className="py-24 md:py-32">
        <div className="px-6 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-4">Portfolio</p>
            <h2
              className="text-4xl md:text-6xl font-light text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Selected Stories
            </h2>
          </motion.div>
        </div>

        {/* Horizontal scrolling gallery */}
        <div ref={scrollRef} className="overflow-hidden">
          <motion.div style={{ x }} className="flex gap-4 px-6 md:gap-6 md:px-12">
            {images.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                className="group relative shrink-0 w-[80vw] md:w-[45vw] lg:w-[30vw] overflow-hidden cursor-pointer"
                onClick={() => openLightbox(i)}
                data-cursor-hover
              >
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end">
                  <div className="p-6">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-primary">{img.category}</p>
                    <h3
                      className="text-xl font-light text-foreground mt-1"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {img.title}
                    </h3>
                  </div>
                </div>

                {/* Image number overlay */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span
                    className="text-5xl font-light text-foreground/10"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* View all CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16 px-6"
        >
          <a
            href="#contact"
            className="inline-block text-xs tracking-[0.3em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300 border-b border-muted-foreground/30 hover:border-primary pb-1"
          >
            View All Stories
          </a>
        </motion.div>
      </section>

      <Lightbox
        images={images}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </>
  );
};

export default PortfolioGrid;
