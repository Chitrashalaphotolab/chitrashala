import { motion } from "framer-motion";
import { Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 md:py-32 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-2 gap-16"
        >
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-4">Get In Touch</p>
            <h2 className="text-4xl md:text-6xl font-light text-foreground mb-6" style={{ fontFamily: "var(--font-display)" }}>
              Let's Create
              <br />
              <span className="italic text-primary">Together</span>
            </h2>
            <p className="text-muted-foreground font-light mb-12 text-sm leading-relaxed">
              Every love story is unique. We'd love to hear yours and create something extraordinary together.
              Whether it's an intimate ceremony or a grand celebration, let Chitrashala make it timeless.
            </p>

            <div className="space-y-4">
              <motion.a
                href="mailto:Harivemula.a4@gmail.com"
                className="flex items-center gap-3 px-6 py-3 border border-primary/40 hover:bg-primary/10 transition-all duration-500 group"
                whileHover={{ scale: 1.02 }}
              >
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm tracking-[0.1em] text-foreground group-hover:text-primary transition-colors">
                  Harivemula.a4@gmail.com
                </span>
              </motion.a>
              <motion.a
                href="tel:+91970134623"
                className="flex items-center gap-3 px-6 py-3 border border-primary/40 hover:bg-primary/10 transition-all duration-500 group"
                whileHover={{ scale: 1.02 }}
              >
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-sm tracking-[0.1em] text-foreground group-hover:text-primary transition-colors">
                  +91 97013 4623
                </span>
              </motion.a>
            </div>
          </div>

          <div className="space-y-10 md:pt-16">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Based In</p>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary/60" />
                <span className="text-foreground font-light" style={{ fontFamily: "var(--font-display)" }}>
                  India & Worldwide
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">Follow Along</p>
              <div className="flex gap-6">
                {[
                  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/chitrasala2025" },
                  { icon: Youtube, label: "YouTube", href: "#" },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-300 group"
                    data-cursor-hover
                  >
                    <social.icon className="w-4 h-4" />
                    <span className="text-xs tracking-[0.2em] uppercase">{social.label}</span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Availability</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm text-foreground/70 font-light">Now booking 2026 & 2027</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
