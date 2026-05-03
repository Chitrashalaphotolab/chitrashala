import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Download, Lock } from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LightboxProps {
  images: { src: string; title: string; category: string }[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const Lightbox = ({ images, currentIndex, isOpen, onClose, onNavigate }: LightboxProps) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadCode, setDownloadCode] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const goNext = useCallback(() => {
    onNavigate((currentIndex + 1) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  const goPrev = useCallback(() => {
    onNavigate((currentIndex - 1 + images.length) % images.length);
  }, [currentIndex, images.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showDownloadModal) {
          setShowDownloadModal(false);
        } else {
          onClose();
        }
      }
      if (e.key === "ArrowRight" && !showDownloadModal) goNext();
      if (e.key === "ArrowLeft" && !showDownloadModal) goPrev();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, goNext, goPrev, onClose, showDownloadModal]);

  const handleDownload = async () => {
    if (!downloadCode.trim()) {
      setDownloadError("Please enter a download code.");
      return;
    }

    setDownloading(true);
    setDownloadError("");

    // Verify code against database
    const { data: passwords } = await supabase
      .from("download_passwords")
      .select("*")
      .eq("code", downloadCode.trim())
      .eq("is_active", true);

    if (!passwords || passwords.length === 0) {
      setDownloadError("Invalid download code.");
      setDownloading(false);
      return;
    }

    const pwd = passwords[0];

    // Check expiry
    if (pwd.expires_at && new Date(pwd.expires_at) < new Date()) {
      setDownloadError("This code has expired.");
      setDownloading(false);
      return;
    }

    // Check usage
    if (pwd.max_uses && (pwd.used_count ?? 0) >= pwd.max_uses) {
      setDownloadError("This code has reached its maximum uses.");
      setDownloading(false);
      return;
    }

    // Code is valid — trigger download
    try {
      const response = await fetch(images[currentIndex].src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${images[currentIndex].title || "chitrashala-photo"}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Increment used_count — we use anon so need public update or edge fn
      // For now just close modal on success
      setShowDownloadModal(false);
      setDownloadCode("");
    } catch {
      setDownloadError("Download failed. Please try again.");
    }

    setDownloading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[80] bg-background/95 backdrop-blur-xl flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-foreground/60 hover:text-foreground transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation */}
          <button
            onClick={goPrev}
            className="absolute left-4 md:left-8 text-foreground/40 hover:text-foreground transition-colors z-10"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 md:right-8 text-foreground/40 hover:text-foreground transition-colors z-10"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
            >
              <img
                src={images[currentIndex].src}
                alt={images[currentIndex].title}
                className="max-w-full max-h-[70vh] object-contain select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              <div className="mt-6 text-center">
                <p className="text-[10px] tracking-[0.3em] uppercase text-primary">
                  {images[currentIndex].category}
                </p>
                <h3
                  className="text-xl font-light text-foreground mt-1"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {images[currentIndex].title}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  {currentIndex + 1} / {images.length}
                </p>
                {/* Download button */}
                <button
                  onClick={() => { setShowDownloadModal(true); setDownloadError(""); setDownloadCode(""); }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-primary/30 text-xs tracking-[0.15em] uppercase text-primary hover:bg-primary/10 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Download Code Modal */}
          <AnimatePresence>
            {showDownloadModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[90] bg-background/80 backdrop-blur-md flex items-center justify-center"
                onClick={() => setShowDownloadModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-card border border-border p-8 max-w-sm w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center mb-6">
                    <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3
                      className="text-xl font-light text-foreground"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Enter Download Code
                    </h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      Contact the photographer to get a download access code.
                    </p>
                  </div>

                  <input
                    type="text"
                    value={downloadCode}
                    onChange={(e) => setDownloadCode(e.target.value.toUpperCase())}
                    placeholder="e.g. CS-ABC123-XYZ"
                    className="w-full px-4 py-3 bg-background border border-border text-foreground text-sm tracking-widest text-center font-mono focus:outline-none focus:border-primary transition-colors uppercase"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleDownload()}
                  />

                  {downloadError && (
                    <p className="text-destructive text-xs text-center mt-3">{downloadError}</p>
                  )}

                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full mt-4 py-3 bg-primary text-primary-foreground text-sm tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {downloading ? "Verifying..." : <><Download className="w-4 h-4" /> Download Photo</>}
                  </button>

                  <button
                    onClick={() => setShowDownloadModal(false)}
                    className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;
