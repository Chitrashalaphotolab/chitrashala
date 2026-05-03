import { useState } from "react";
import { motion } from "framer-motion";
import { Play, X } from "lucide-react";

const SAMPLE_VIDEO_ID = "bPYlKEFpGcE"; // Sample wedding cinematography

const VideoSection = () => {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-4">Cinema</p>
          <h2
            className="text-4xl md:text-6xl font-light text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Moving Pictures
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative aspect-video bg-card overflow-hidden group"
        >
          {playing ? (
            <>
              <iframe
                src={`https://www.youtube.com/embed/${SAMPLE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
                title="Wedding Film"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
              <button
                onClick={() => setPlaying(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-background transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Thumbnail */}
              <img
                src={`https://img.youtube.com/vi/${SAMPLE_VIDEO_ID}/maxresdefault.jpg`}
                alt="Wedding Film Thumbnail"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-background/30" />

              {/* Play button */}
              <button
                onClick={() => setPlaying(true)}
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
              >
                <motion.div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full border border-primary/40 flex items-center justify-center bg-background/20 backdrop-blur-sm group-hover:border-primary group-hover:bg-primary/10 transition-all duration-500"
                  whileHover={{ scale: 1.1 }}
                >
                  <Play className="w-8 h-8 text-primary ml-1" />
                </motion.div>
              </button>

              {/* Title overlay */}
              <div className="absolute bottom-8 left-8">
                <p className="text-[10px] tracking-[0.3em] uppercase text-primary">Featured Film</p>
                <h3
                  className="text-2xl font-light text-foreground mt-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  A Love That Transcends
                </h3>
              </div>

              {/* Cinematic bars */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-background/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/80 to-transparent" />
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default VideoSection;
