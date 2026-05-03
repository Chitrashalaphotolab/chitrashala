import { motion } from "framer-motion";

const items = [
  "Wedding Stories",
  "•",
  "Cinematic Portraits",
  "•",
  "Destination Weddings",
  "•",
  "Couple Portraits",
  "•",
  "Pre-Wedding Films",
  "•",
  "Fine Art Photography",
  "•",
];

const Marquee = () => {
  const content = [...items, ...items]; // Duplicate for seamless loop

  return (
    <div className="py-12 md:py-16 overflow-hidden border-y border-border/30">
      <motion.div
        className="flex whitespace-nowrap gap-8"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {content.map((item, i) => (
          <span
            key={i}
            className={`text-2xl md:text-4xl font-light shrink-0 ${
              item === "•" ? "text-primary/40" : "text-foreground/20"
            }`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export default Marquee;
