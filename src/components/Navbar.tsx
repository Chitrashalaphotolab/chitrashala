import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo-icon.png";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHashLink = (hash: string) => {
    setMenuOpen(false);
    if (location.pathname === "/") {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 400);
    }
  };

  const links = [
    { label: "Stories", hash: "#portfolio" },
    { label: "Gallery", href: "/gallery", isRoute: true },
    { label: "About", hash: "#about" },
    { label: "Contact", hash: "#contact" },
    { label: "Scan QR", href: "/scan", isRoute: true },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-background/90 backdrop-blur-md py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3" data-cursor-hover>
          <img src={logo} alt="Chitrashala" className="h-10 md:h-12 w-auto" />
          <div className="hidden sm:block">
            <span
              className="text-lg md:text-xl tracking-[0.15em] text-foreground font-light block leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Chitrashala
            </span>
            <span className="text-[7px] tracking-[0.35em] uppercase text-muted-foreground">
              Every Picture Tells a Story
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((link) =>
            link.isRoute ? (
              <Link
                key={link.label}
                to={link.href!}
                className="text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.label}
                onClick={() => handleHashLink(link.hash!)}
                className="text-xs tracking-[0.25em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                {link.label}
              </button>
            )
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5"
        >
          <span className={`w-6 h-[1px] bg-foreground transition-all ${menuOpen ? "rotate-45 translate-y-[3.5px]" : ""}`} />
          <span className={`w-6 h-[1px] bg-foreground transition-all ${menuOpen ? "-rotate-45 -translate-y-[3.5px]" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="md:hidden bg-background/95 backdrop-blur-md px-6 py-8 flex flex-col gap-6"
        >
          {links.map((link) =>
            link.isRoute ? (
              <Link
                key={link.label}
                to={link.href!}
                onClick={() => setMenuOpen(false)}
                className="text-sm tracking-[0.25em] uppercase text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.label}
                onClick={() => handleHashLink(link.hash!)}
                className="text-sm tracking-[0.25em] uppercase text-muted-foreground hover:text-primary transition-colors text-left"
              >
                {link.label}
              </button>
            )
          )}
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
