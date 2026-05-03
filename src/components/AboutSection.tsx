import { motion } from "framer-motion";
import gallery1 from "@/assets/gallery-1.jpg";

const AboutSection = () => {
  return (
    <section id="about" className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="aspect-[3/4] overflow-hidden">
            <img src={gallery1} alt="Chitrashala - Photographer" className="w-full h-full object-cover protected-content" />
          </div>
          <div className="absolute -bottom-4 -right-4 w-full h-full border border-primary/20 -z-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-4">About</p>
          <h2 className="text-4xl md:text-5xl font-light text-foreground mb-8" style={{ fontFamily: "var(--font-display)" }}>
            The Storyteller
          </h2>
          <div className="space-y-6 text-muted-foreground font-light leading-relaxed text-sm">
            <p>
              Welcome to Chitrashala — where every frame tells a story and every click
              captures a lifetime of emotions. We believe your special moments deserve to be preserved
              with the depth and artistry of a cinematic masterpiece.
            </p>
            <p>
              With years of experience documenting weddings, portraits, and celebrations across India
              and beyond, we bring an editorial eye and a documentary heart to every frame. From intimate
              ceremonies to grand celebrations, we find poetry in every detail.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-border">
            {[
              { number: "500+", label: "Stories Told" },
              { number: "8+", label: "Years of Craft" },
              { number: "15+", label: "Cities Covered" },
              { number: "50+", label: "Awards" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              >
                <p className="text-3xl md:text-4xl font-light text-primary" style={{ fontFamily: "var(--font-display)" }}>
                  {stat.number}
                </p>
                <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
