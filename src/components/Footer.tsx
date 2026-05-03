import { motion } from "framer-motion";
import { Instagram, Youtube, ArrowUp } from "lucide-react";
import logo from "@/assets/logo-icon.png";

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="py-16 px-6 border-t border-border/30">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 text-center md:text-left">
            <img src={logo} alt="Chitrashala" className="h-10 w-auto" />
            <div>
              <h3
                className="text-2xl tracking-[0.15em] text-foreground font-light"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Chitrashala
              </h3>
              <p className="text-[8px] tracking-[0.4em] uppercase text-muted-foreground mt-0.5">
                Every Picture Tells a Story
              </p>
            </div>
          </div>

          <div className="flex gap-6">
            {[
              { icon: Instagram, href: "https://www.instagram.com/chitrasala2025" },
              { icon: Youtube, href: "#" },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                className="text-muted-foreground/40 hover:text-primary transition-colors duration-300"
                data-cursor-hover
              >
                <s.icon className="w-4 h-4" />
              </a>
            ))}
          </div>

          <motion.button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-muted-foreground/40 hover:text-primary transition-colors duration-300"
            whileHover={{ y: -2 }}
            data-cursor-hover
          >
            <span className="text-[10px] tracking-[0.3em] uppercase">Back to Top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        <div className="mt-12 pt-8 border-t border-border/20 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground/30">
            © 2026 Chitrashala. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
