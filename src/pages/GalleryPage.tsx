import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, User, Calendar, MapPin, Grid3X3, Users, Tag, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Lightbox from "@/components/Lightbox";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";

type Photo = {
  id: string;
  title: string | null;
  image_url: string;
  category: string;
  event_id: string | null;
};

type Event = {
  id: string;
  name: string;
  slug: string;
  event_date: string | null;
  location: string | null;
  category: string;
  cover_image_url: string | null;
};

type Person = {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
};

type ViewMode = "events" | "persons" | "categories";

const GalleryPage = () => {
  const { eventSlug, personSlug } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>("events");
  const [events, setEvents] = useState<Event[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentTitle, setCurrentTitle] = useState("");

  // Load events list
  useEffect(() => {
    if (!eventSlug && !personSlug) {
      loadOverview();
    }
  }, [eventSlug, personSlug]);

  // Load specific event photos
  useEffect(() => {
    if (eventSlug) loadEventPhotos(eventSlug);
  }, [eventSlug]);

  // Load specific person photos
  useEffect(() => {
    if (personSlug) loadPersonPhotos(personSlug);
  }, [personSlug]);

  const loadOverview = async () => {
    setLoading(true);
    const [eventsRes, personsRes, photosRes] = await Promise.all([
      supabase.from("events").select("*").eq("is_public", true).order("event_date", { ascending: false }),
      supabase.from("persons").select("*").order("name"),
      supabase.from("photos").select("category"),
    ]);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (personsRes.data) setPersons(personsRes.data);
    if (photosRes.data) {
      const cats = [...new Set(photosRes.data.map((p) => p.category))];
      setCategories(cats);
    }
    setLoading(false);
  };

  const loadEventPhotos = async (slug: string) => {
    setLoading(true);
    const { data: event } = await supabase.from("events").select("*").eq("slug", slug).single();
    if (event) {
      setCurrentTitle(event.name);
      const { data: photos } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", event.id)
        .order("sort_order");
      if (photos) setPhotos(photos);
    }
    setLoading(false);
  };

  const loadPersonPhotos = async (slug: string) => {
    setLoading(true);
    const { data: person } = await supabase.from("persons").select("*").eq("slug", slug).single();
    if (person) {
      setCurrentTitle(person.name);
      const { data: photoPersons } = await supabase
        .from("photo_persons")
        .select("photo_id")
        .eq("person_id", person.id);
      if (photoPersons && photoPersons.length > 0) {
        const photoIds = photoPersons.map((pp) => pp.photo_id);
        const { data: photos } = await supabase
          .from("photos")
          .select("*")
          .in("id", photoIds);
        if (photos) setPhotos(photos);
      }
    }
    setLoading(false);
  };

  const loadCategoryPhotos = async (category: string) => {
    setLoading(true);
    setSelectedCategory(category);
    setCurrentTitle(category);
    const { data } = await supabase
      .from("photos")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });
    if (data) setPhotos(data);
    setLoading(false);
  };

  const lightboxImages = photos.map((p) => ({
    src: p.image_url,
    title: p.title || "",
    category: p.category,
  }));

  const isDetailView = eventSlug || personSlug || selectedCategory;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16 px-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          {isDetailView && (
            <Link
              to="/gallery"
              onClick={() => {
                setPhotos([]);
                setSelectedCategory(null);
                setCurrentTitle("");
                loadOverview();
              }}
              className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Gallery
            </Link>
          )}
          <h1
            className="text-4xl md:text-6xl font-light text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isDetailView ? currentTitle : "Gallery"}
          </h1>
        </motion.div>

        {/* View mode tabs (only on overview) */}
        {!isDetailView && (
          <div className="flex justify-center gap-6 mb-12">
            {([
              { mode: "events" as ViewMode, icon: Calendar, label: "By Event" },
              { mode: "persons" as ViewMode, icon: Users, label: "By Person" },
              { mode: "categories" as ViewMode, icon: Tag, label: "By Category" },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-2 px-4 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 border-b-2 ${
                  viewMode === mode
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : isDetailView ? (
          /* Photo grid */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="columns-1 sm:columns-2 lg:columns-3 gap-4"
          >
            {photos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="break-inside-avoid mb-4 group cursor-pointer overflow-hidden"
                onClick={() => {
                  setLightboxIndex(i);
                  setLightboxOpen(true);
                }}
              >
                <img
                  src={photo.image_url}
                  alt={photo.title || "Photo"}
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          /* Overview grids */
          <AnimatePresence mode="wait">
            {viewMode === "events" && (
              <motion.div
                key="events"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {events.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-20">
                    No events yet. Add events through the admin panel.
                  </p>
                ) : (
                  events.map((event, i) => (
                    <Link key={event.id} to={`/gallery/event/${event.slug}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative aspect-[4/5] overflow-hidden cursor-pointer"
                      >
                        {event.cover_image_url ? (
                          <img
                            src={event.cover_image_url}
                            alt={event.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-card flex items-center justify-center">
                            <Grid3X3 className="w-12 h-12 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end">
                          <div className="p-6 w-full">
                            <p className="text-[10px] tracking-[0.3em] uppercase text-primary">{event.category}</p>
                            <h3 className="text-xl font-light text-foreground mt-1" style={{ fontFamily: "var(--font-display)" }}>
                              {event.name}
                            </h3>
                            {event.location && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {event.location}
                              </p>
                            )}
                            {/* QR code shown on hover */}
                            {event.qr_code && (
                              <div className="mt-3 flex items-center gap-3">
                                <div className="bg-white p-1.5 rounded">
                                  <QRCodeSVG
                                    value={`${window.location.origin}/scan?code=${event.qr_code}`}
                                    size={56}
                                  />
                                </div>
                                <div>
                                  <p className="text-[9px] tracking-wider uppercase text-muted-foreground">Scan to view photos</p>
                                  <p className="text-[10px] font-mono text-primary mt-0.5">{event.qr_code}</p>
                                  {(event as any).drive_folder_url && (
                                    <a
                                      href={(event as any).drive_folder_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-1 text-[9px] tracking-wider uppercase text-primary/70 hover:text-primary mt-1"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" /> Google Drive
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))
                )}
              </motion.div>
            )}

            {viewMode === "persons" && (
              <motion.div
                key="persons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              >
                {persons.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-20">
                    No persons tagged yet.
                  </p>
                ) : (
                  persons.map((person, i) => (
                    <Link key={person.id} to={`/gallery/person/${person.slug}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group text-center cursor-pointer"
                      >
                        <div className="aspect-square rounded-full overflow-hidden mb-4 mx-auto w-32 h-32 border-2 border-border group-hover:border-primary transition-colors duration-300">
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt={person.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-card flex items-center justify-center">
                              <User className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-sm tracking-[0.15em] text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                          {person.name}
                        </h3>
                      </motion.div>
                    </Link>
                  ))
                )}
              </motion.div>
            )}

            {viewMode === "categories" && (
              <motion.div
                key="categories"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-6"
              >
                {categories.length === 0 ? (
                  <p className="col-span-full text-center text-muted-foreground py-20">
                    No categories yet.
                  </p>
                ) : (
                  categories.map((cat, i) => (
                    <motion.button
                      key={cat}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => loadCategoryPhotos(cat)}
                      className="group p-8 border border-border hover:border-primary/50 transition-all duration-300 text-center"
                    >
                      <Tag className="w-6 h-6 text-primary/50 mx-auto mb-3" />
                      <h3 className="text-lg tracking-[0.15em] capitalize text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                        {cat}
                      </h3>
                    </motion.button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {photos.length === 0 && isDetailView && !loading && (
          <p className="text-center text-muted-foreground py-20">No photos found.</p>
        )}
      </div>

      <Lightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />

      <Footer />
    </div>
  );
};

export default GalleryPage;
