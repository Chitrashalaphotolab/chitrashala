import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Camera, QrCode, ArrowLeft, Download, Lock, Loader2, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Lightbox from "@/components/Lightbox";
import BackButton from "@/components/BackButton";

type Photo = { id: string; title: string | null; image_url: string; category: string; };
type EventInfo = { id: string; name: string; event_date: string | null; location: string | null; drive_folder_url: string | null; qr_code: string; };

const ScanPage = () => {
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.get("code");

  const [step, setStep] = useState<"enter" | "loading" | "photos">("enter");
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showDownload, setShowDownload] = useState(false);
  const [dlCode, setDlCode] = useState("");
  const [dlError, setDlError] = useState("");
  const [dlProgress, setDlProgress] = useState(0);
  const [dlTotal, setDlTotal] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (urlCode) loadEventByQR(urlCode);
  }, [urlCode]);

  const loadEventByQR = async (code: string) => {
    setStep("loading");
    setError("");

    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("qr_code", code.trim().toUpperCase())
      .single();

    if (eventError || !eventData) {
      setError("Invalid code. Please check and try again.");
      setStep("enter");
      return;
    }

    setEvent(eventData);

    // Log this access — store everything
    await supabase.from("qr_access_logs").insert({
      event_id: eventData.id,
      qr_code: code.trim().toUpperCase(),
      user_agent: navigator.userAgent,
      device_type: /mobile|android|iphone|ipad/i.test(navigator.userAgent) ? "mobile" : "desktop",
      accessed_at: new Date().toISOString(),
    });

    // Load photos
    const { data: photosData } = await supabase
      .from("photos")
      .select("*")
      .eq("event_id", eventData.id)
      .order("sort_order");

    if (photosData) setPhotos(photosData);

    // Log photo view
    await supabase.from("photo_access_logs").insert({
      event_id: eventData.id,
      qr_code: code.trim().toUpperCase(),
      action: "view",
      user_agent: navigator.userAgent,
      photos_count: photosData?.length || 0,
    });

    setStep("photos");
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) loadEventByQR(manualCode.trim());
  };

  const startCamera = async () => {
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanQRFromVideo();
      }
    } catch {
      setError("Camera access denied. Enter the code manually.");
      setScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    setScanning(false);
  };

  const scanQRFromVideo = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if ("BarcodeDetector" in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
          detector.detect(canvas).then((barcodes: any[]) => {
            if (barcodes.length > 0) {
              const raw = barcodes[0].rawValue;
              let code = raw;
              try {
                const url = new URL(raw);
                code = url.searchParams.get("code") || raw;
              } catch {}
              stopCamera();
              loadEventByQR(code);
              return;
            }
            requestAnimationFrame(scan);
          }).catch(() => requestAnimationFrame(scan));
        } else {
          requestAnimationFrame(scan);
        }
      } else {
        requestAnimationFrame(scan);
      }
    };
    requestAnimationFrame(scan);
  };

  const handleDownloadAll = async () => {
    if (!dlCode.trim()) { setDlError("Please enter a download code."); return; }
    setIsDownloading(true);
    setDlError("");

    const { data: passwords } = await supabase
      .from("download_passwords")
      .select("*")
      .eq("code", dlCode.trim())
      .eq("is_active", true);

    if (!passwords || passwords.length === 0) {
      setDlError("Invalid download code.");
      setIsDownloading(false);
      return;
    }

    const pwd = passwords[0];
    if (pwd.expires_at && new Date(pwd.expires_at) < new Date()) {
      setDlError("This code has expired.");
      setIsDownloading(false);
      return;
    }
    if (pwd.max_uses && (pwd.used_count ?? 0) >= pwd.max_uses) {
      setDlError("This code has reached its maximum uses.");
      setIsDownloading(false);
      return;
    }

    // Log download
    await supabase.from("photo_access_logs").insert({
      event_id: event!.id,
      qr_code: event!.qr_code,
      action: "download",
      user_agent: navigator.userAgent,
      photos_count: photos.length,
    });

    // Update used count
    await supabase.from("download_passwords")
      .update({ used_count: (pwd.used_count || 0) + 1 })
      .eq("id", pwd.id);

    setDlTotal(photos.length);
    for (let i = 0; i < photos.length; i++) {
      try {
        const response = await fetch(photos[i].image_url);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${photos[i].title || `chitrashala-${i + 1}`}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setDlProgress(i + 1);
        await new Promise((r) => setTimeout(r, 300));
      } catch {}
    }

    setIsDownloading(false);
    setShowDownload(false);
    setDlCode("");
    setDlProgress(0);
  };

  const lightboxImages = photos.map((p) => ({ src: p.image_url, title: p.title || "", category: p.category }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <BackButton />

      <div className="pt-24 pb-16 px-6 max-w-4xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <QrCode className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-light text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            {event ? event.name : "Scan QR Code"}
          </h1>
          {event && (
            <p className="text-muted-foreground mt-2 text-sm">
              {event.location}{event.event_date && ` • ${new Date(event.event_date).toLocaleDateString()}`}
            </p>
          )}
          {event && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] tracking-[0.2em] uppercase">
              Code: {event.qr_code}
            </div>
          )}
          {event?.drive_folder_url && (
            <div className="mt-4">
              <a
                href={event.drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 border border-primary text-primary text-xs tracking-[0.2em] uppercase hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
              >
                <ExternalLink className="w-4 h-4" />
                View All Photos in Google Drive
              </a>
            </div>
          )}
        </motion.div>

        {/* Step: Enter code */}
        {step === "enter" && (
          <div className="max-w-md mx-auto space-y-8">

            {/* Camera scanner */}
            {scanning ? (
              <div className="space-y-4">
                <div className="relative aspect-square bg-card rounded-lg overflow-hidden border border-border">
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-primary/50 rounded-lg" />
                  </div>
                </div>
                <button onClick={stopCamera}
                  className="w-full py-3 border border-border text-sm tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={startCamera}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 border border-border text-sm tracking-[0.15em] uppercase text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                <Camera className="w-4 h-4" />
                Scan QR Code with Camera
              </button>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground">or enter code</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Enter event code (e.g. EVT-ABC123)"
                className="w-full px-4 py-3 bg-card border border-border text-foreground text-center text-lg tracking-[0.2em] uppercase placeholder:text-muted-foreground/40 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-primary transition-colors"
              />
              {error && <p className="text-destructive text-xs text-center">{error}</p>}
              <button type="submit"
                className="w-full px-6 py-3 bg-primary text-primary-foreground text-sm tracking-[0.15em] uppercase hover:bg-primary/90 transition-colors">
                Access Photos
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground/60">
              Ask your photographer for the event QR code or access code
            </p>
          </div>
        )}

        {/* Step: Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Loading your photos...</p>
          </div>
        )}

        {/* Step: Photos */}
        {step === "photos" && event && (
          <>
            {photos.length > 0 ? (
              <>
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                  <p className="text-sm text-muted-foreground">{photos.length} photos</p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setShowDownload(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs tracking-[0.15em] uppercase hover:bg-primary/90 transition-colors">
                      <Download className="w-3 h-3" />
                      Download All
                    </button>
                    <button onClick={() => { setStep("enter"); setEvent(null); setPhotos([]); setManualCode(""); setError(""); }}
                      className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">
                      <ArrowLeft className="w-3 h-3" />
                      Back
                    </button>
                  </div>
                </div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="columns-2 md:columns-3 gap-3">
                  {photos.map((photo, i) => (
                    <motion.div key={photo.id}
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="break-inside-avoid mb-3 group cursor-pointer overflow-hidden relative"
                      onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}>
                      <img src={photo.image_url} alt={photo.title || "Photo"} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors duration-300" />
                    </motion.div>
                  ))}
                </motion.div>
              </>
            ) : (
              <div className="text-center py-20 space-y-4">
                <p className="text-muted-foreground">No photos uploaded yet for this event.</p>
                {event.drive_folder_url && (
                  <a href={event.drive_folder_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary text-xs tracking-[0.2em] uppercase hover:bg-primary hover:text-primary-foreground transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    View in Google Drive
                  </a>
                )}
                <div>
                  <button onClick={() => { setStep("enter"); setEvent(null); }}
                    className="text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors">
                    ← Try another code
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Download Modal */}
      <AnimatePresence>
        {showDownload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6"
            onClick={() => !isDownloading && setShowDownload(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border p-8 space-y-5">
              <div className="text-center space-y-2">
                <Lock className="w-8 h-8 text-primary mx-auto" />
                <h3 className="text-lg font-light text-foreground" style={{ fontFamily: "var(--font-display)" }}>
                  Download All Photos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enter your download code to save all {photos.length} photos
                </p>
              </div>

              {!isDownloading ? (
                <form onSubmit={(e) => { e.preventDefault(); handleDownloadAll(); }} className="space-y-4">
                  <input type="text" value={dlCode} onChange={(e) => setDlCode(e.target.value)}
                    placeholder="Enter download code..."
                    className="w-full px-4 py-3 bg-background border border-border text-foreground text-center tracking-[0.15em] uppercase placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
                    autoFocus />
                  {dlError && <p className="text-destructive text-xs text-center">{dlError}</p>}
                  <button type="submit"
                    className="w-full px-6 py-3 bg-primary text-primary-foreground text-sm tracking-[0.15em] uppercase hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Download {photos.length} Photos
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Downloading {dlProgress} of {dlTotal}...
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(dlProgress / dlTotal) * 100}%` }} />
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Lightbox images={lightboxImages} currentIndex={lightboxIndex} isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)} onNavigate={setLightboxIndex} />
      <Footer />
    </div>
  );
};

export default ScanPage;
