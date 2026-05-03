import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut, Image, Calendar, Users, Settings, QrCode, Shield, Key,
  Upload, Trash2, Plus, Eye, EyeOff, Copy, Check, Activity
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo-icon.png";

type Tab = "events" | "photos" | "persons" | "passwords" | "settings" | "logs";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("events");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [events, setEvents] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [passwords, setPasswords] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [pageVisibility, setPageVisibility] = useState<Record<string, boolean>>({});

  // Form states
  const [newEvent, setNewEvent] = useState({ name: "", slug: "", category: "wedding", location: "", description: "", is_public: true });
  const [newPerson, setNewPerson] = useState({ name: "", slug: "" });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/admin/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      navigate("/admin/login");
      return;
    }

    setUser(session.user);
    loadData();
  };

  const loadData = async () => {
    setLoading(true);
    const [eventsRes, photosRes, personsRes, passwordsRes, settingsRes, logsRes] = await Promise.all([
      supabase.from("events").select("*").order("created_at", { ascending: false }),
      supabase.from("photos").select("*").order("created_at", { ascending: false }),
      supabase.from("persons").select("*").order("name"),
      supabase.from("download_passwords").select("*").order("created_at", { ascending: false }),
      supabase.from("site_settings").select("*").eq("key", "page_visibility").single(),
      supabase.from("qr_access_logs").select("*, events(name)").order("accessed_at", { ascending: false }).limit(100),
    ]);
    if (eventsRes.data) setEvents(eventsRes.data);
    if (photosRes.data) setPhotos(photosRes.data);
    if (personsRes.data) setPersons(personsRes.data);
    if (passwordsRes.data) setPasswords(passwordsRes.data);
    if (settingsRes.data) setPageVisibility(settingsRes.data.value as Record<string, boolean>);
    if (logsRes.data) setAccessLogs(logsRes.data);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const createEvent = async () => {
    if (!newEvent.name || !newEvent.slug) return;
    const qrCode = `EVT-${Date.now().toString(36).toUpperCase()}`;
    await supabase.from("events").insert({ ...newEvent, qr_code: qrCode });
    setNewEvent({ name: "", slug: "", category: "wedding", location: "", description: "", is_public: true });
    loadData();
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event and all its photos?")) return;
    await supabase.from("photos").delete().eq("event_id", id);
    await supabase.from("events").delete().eq("id", id);
    loadData();
  };

  const createPerson = async () => {
    if (!newPerson.name || !newPerson.slug) return;
    await supabase.from("persons").insert(newPerson);
    setNewPerson({ name: "", slug: "" });
    loadData();
  };

  const deletePerson = async (id: string) => {
    if (!confirm("Delete this person?")) return;
    await supabase.from("photo_persons").delete().eq("person_id", id);
    await supabase.from("persons").delete().eq("id", id);
    loadData();
  };

  const generateDownloadPassword = async (eventId?: string) => {
    const code = `CS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).substring(-4).toUpperCase()}`;
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    await supabase.from("download_passwords").insert({
      code,
      event_id: eventId || null,
      expires_at: expires.toISOString(),
      max_uses: 5,
    });
    loadData();
  };

  const togglePageVisibility = async (page: string) => {
    const updated = { ...pageVisibility, [page]: !pageVisibility[page] };
    setPageVisibility(updated);
    await supabase.from("site_settings").update({ value: updated }).eq("key", "page_visibility");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, eventId?: string) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from("photos").upload(fileName, file);
      if (error) { console.error(error); continue; }
      const { data: urlData } = supabase.storage.from("photos").getPublicUrl(data.path);
      await supabase.from("photos").insert({
        image_url: urlData.publicUrl,
        title: file.name.replace(/\.[^/.]+$/, ""),
        event_id: eventId || null,
        category: "general",
      });
    }
    loadData();
  };

  const deletePhoto = async (id: string) => {
    await supabase.from("photo_persons").delete().eq("photo_id", id);
    await supabase.from("photos").delete().eq("id", id);
    loadData();
  };

  const tabs: { key: Tab; icon: any; label: string }[] = [
    { key: "events", icon: Calendar, label: "Events" },
    { key: "photos", icon: Image, label: "Photos" },
    { key: "persons", icon: Users, label: "Persons" },
    { key: "passwords", icon: Key, label: "Download Codes" },
    { key: "logs", icon: Activity, label: "Access Logs" },
    { key: "settings", icon: Settings, label: "Settings" },
  ];

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Chitrashala" className="h-8 w-auto" />
            <div>
              <span className="text-sm font-light text-foreground tracking-[0.1em]" style={{ fontFamily: "var(--font-display)" }}>
                Chitrashala
              </span>
              <span className="text-[8px] tracking-[0.3em] uppercase text-primary ml-2">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground hidden sm:block">{user?.email}</span>
            <a href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">View Site</a>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 hidden md:block">
          <nav className="space-y-1 sticky top-20">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs tracking-[0.15em] uppercase transition-all rounded ${
                  activeTab === key
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 flex">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-[9px] tracking-wider uppercase ${
                activeTab === key ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* EVENTS TAB */}
            {activeTab === "events" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-foreground" style={{ fontFamily: "var(--font-display)" }}>Events</h2>

                {/* Create event form */}
                <div className="bg-card border border-border p-6 space-y-4">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-primary">New Event</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                      placeholder="Event name" className="px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
                    <input value={newEvent.slug} onChange={(e) => setNewEvent({ ...newEvent, slug: e.target.value })}
                      placeholder="URL slug (e.g. priya-arjun-2026)" className="px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
                    <input value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      placeholder="Location" className="px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
                    <select value={newEvent.category} onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      className="px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary">
                      <option value="wedding">Wedding</option>
                      <option value="portrait">Portrait</option>
                      <option value="engagement">Engagement</option>
                      <option value="corporate">Corporate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <input
                    value={(newEvent as any).drive_folder_url || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, ...(newEvent as any), drive_folder_url: e.target.value })}
                    placeholder="Google Drive folder link (cameraman shares this with you)"
                    className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                  />
                  <textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Description" className="w-full px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary h-20" />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input type="checkbox" checked={newEvent.is_public} onChange={(e) => setNewEvent({ ...newEvent, is_public: e.target.checked })} />
                      Public event
                    </label>
                    <button onClick={createEvent} className="px-4 py-2 bg-primary text-primary-foreground text-xs tracking-[0.15em] uppercase hover:bg-primary/90">
                      <Plus className="w-3 h-3 inline mr-1" /> Create Event
                    </button>
                  </div>
                </div>

                {/* Events list */}
                {events.map((event) => (
                  <div key={event.id} className="bg-card border border-border p-4 flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-light text-foreground" style={{ fontFamily: "var(--font-display)" }}>{event.name}</h3>
                          <span className="text-[9px] tracking-wider uppercase px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">{event.category}</span>
                          {event.is_public ? <Eye className="w-3 h-3 text-primary/60" /> : <EyeOff className="w-3 h-3 text-muted-foreground" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{event.location} {event.event_date && `• ${event.event_date}`}</p>
                        {event.qr_code && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] tracking-wider text-muted-foreground font-mono">{event.qr_code}</span>
                            <button onClick={() => copyCode(event.qr_code!)} className="text-muted-foreground hover:text-primary">
                              {copiedCode === event.qr_code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-start gap-3 shrink-0">
                        {/* QR code — scan to view photos */}
                        {event.qr_code && (
                          <div className="flex flex-col items-center gap-1">
                            <div className="bg-white p-2 rounded border border-border">
                              <QRCodeSVG value={`${window.location.origin}/scan?code=${event.qr_code}`} size={80} />
                            </div>
                            <span className="text-[8px] tracking-wider uppercase text-muted-foreground">Scan for Photos</span>
                            <button
                              onClick={() => {
                                const win = window.open("", "_blank");
                                if (!win) return;
                                win.document.write(`
                                  <html><head><title>QR - ${event.name}</title>
                                  <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:serif;background:#0a0a0a;color:#fff;}
                                  .box{background:#fff;padding:32px;border-radius:8px;text-align:center;}
                                  h2{margin:16px 0 4px;font-weight:300;font-size:24px;color:#0a0a0a;}
                                  p{margin:4px 0;font-size:12px;color:#555;letter-spacing:0.2em;text-transform:uppercase;}
                                  .code{margin-top:12px;font-size:14px;color:#888;font-family:monospace;}
                                  </style></head><body>
                                  <div class="box">
                                    <img src="${document.querySelector(`[data-qr="${event.qr_code}"]`)?.closest(".bg-white")?.querySelector("svg")?.outerHTML ? "" : ""}"/>
                                    <div id="qr"></div>
                                    <h2>${event.name}</h2>
                                    <p>${event.location || ""}</p>
                                    <p class="code">${event.qr_code}</p>
                                  </div>
                                  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                                  <script>
                                    var box = document.querySelector('.box');
                                    var qrDiv = document.createElement('div');
                                    box.insertBefore(qrDiv, box.firstChild);
                                    new QRCode(qrDiv, {text: "${window.location.origin}/scan?code=${event.qr_code}", width: 256, height: 256, colorDark:"#000", colorLight:"#fff"});
                                    setTimeout(() => window.print(), 800);
                                  </script></body></html>
                                `);
                                win.document.close();
                              }}
                              className="text-[8px] tracking-wider uppercase text-primary hover:text-primary/80"
                            >
                              Print QR
                            </button>
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <label className="px-3 py-2 border border-primary/30 text-xs text-primary tracking-wider uppercase cursor-pointer hover:bg-primary/10 text-center">
                            <Upload className="w-3 h-3 inline mr-1" /> Photos
                            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, event.id)} />
                          </label>
                          <button onClick={() => deleteEvent(event.id)} className="p-2 text-muted-foreground hover:text-destructive flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Google Drive Section */}
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">
                        Google Drive Folder
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste Google Drive folder link here..."
                          defaultValue={event.drive_folder_url || ""}
                          onBlur={async (e) => {
                            const url = e.target.value.trim();
                            if (url === (event.drive_folder_url || "")) return;
                            await supabase.from("events").update({ drive_folder_url: url || null }).eq("id", event.id);
                            loadData();
                          }}
                          className="flex-1 px-3 py-1.5 bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary transition-colors"
                        />
                        {event.drive_folder_url && (
                          <a href={event.drive_folder_url} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 border border-primary/30 text-xs text-primary tracking-wider uppercase hover:bg-primary/10">
                            Open
                          </a>
                        )}
                      </div>

                      {/* Drive QR — appears automatically when link is pasted */}
                      {event.drive_folder_url && (
                        <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start p-4 bg-background border border-primary/20 rounded">
                          <div className="flex flex-col items-center gap-2">
                            <div className="bg-white p-2 rounded">
                              <QRCodeSVG value={event.drive_folder_url} size={100} />
                            </div>
                            <span className="text-[8px] tracking-wider uppercase text-muted-foreground text-center">Scan for Drive Folder</span>
                            <button
                              onClick={() => {
                                const win = window.open("", "_blank");
                                if (!win) return;
                                win.document.write(`
                                  <html><head><title>Drive QR - ${event.name}</title>
                                  <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:serif;background:#0a0a0a;color:#fff;}
                                  .box{background:#fff;padding:32px;border-radius:8px;text-align:center;}
                                  h2{margin:16px 0 4px;font-weight:300;font-size:24px;color:#0a0a0a;}
                                  p{margin:4px 0;font-size:12px;color:#555;letter-spacing:0.2em;text-transform:uppercase;}
                                  </style></head><body>
                                  <div class="box">
                                    <div id="qr"></div>
                                    <h2>${event.name}</h2>
                                    <p>Scan to view all photos in Google Drive</p>
                                  </div>
                                  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                                  <script>
                                    var box = document.querySelector('.box');
                                    var qrDiv = document.createElement('div');
                                    box.insertBefore(qrDiv, box.firstChild);
                                    new QRCode(qrDiv, {text: "${event.drive_folder_url}", width: 256, height: 256, colorDark:"#000", colorLight:"#fff"});
                                    setTimeout(() => window.print(), 800);
                                  </script></body></html>
                                `);
                                win.document.close();
                              }}
                              className="text-[9px] tracking-wider uppercase text-primary hover:text-primary/80 border border-primary/30 px-3 py-1"
                            >
                              Print Drive QR
                            </button>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-primary font-medium mb-1">✓ Drive folder linked!</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Two QR codes are now available:<br/>
                              <span className="text-foreground/70">① Website QR</span> — scans open your gallery page with the photos you upload here<br/>
                              <span className="text-foreground/70">② Drive QR</span> — scans open the Google Drive folder directly (all cameraman photos)
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-2">
                              Both QR codes are shown on the public Gallery page for guests.
                            </p>
                          </div>
                        </div>
                      )}
                      {!event.drive_folder_url && (
                        <p className="text-[10px] text-muted-foreground/50 mt-1">
                          Cameraman pastes Drive folder link here → Drive QR auto-generates instantly
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

                        {/* PHOTOS TAB */}
            {activeTab === "photos" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-light text-foreground" style={{ fontFamily: "var(--font-display)" }}>All Photos</h2>
                  <label className="px-4 py-2 bg-primary text-primary-foreground text-xs tracking-[0.15em] uppercase cursor-pointer hover:bg-primary/90">
                    <Upload className="w-3 h-3 inline mr-1" /> Upload Photos
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e)} />
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative aspect-square overflow-hidden bg-card border border-border">
                      <img src={photo.image_url} alt={photo.title || ""} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => deletePhoto(photo.id)} className="p-2 bg-destructive/80 text-destructive-foreground rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/80 to-transparent">
                        <p className="text-[9px] text-foreground/80 truncate">{photo.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {photos.length === 0 && <p className="text-center text-muted-foreground py-12">No photos uploaded yet.</p>}
              </div>
            )}

            {/* PERSONS TAB */}
            {activeTab === "persons" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-foreground" style={{ fontFamily: "var(--font-display)" }}>Persons</h2>
                <div className="bg-card border border-border p-6 space-y-3">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-primary">New Person</h3>
                  <div className="flex gap-3">
                    <input value={newPerson.name} onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                      placeholder="Name" className="flex-1 px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
                    <input value={newPerson.slug} onChange={(e) => setNewPerson({ ...newPerson, slug: e.target.value })}
                      placeholder="URL slug" className="flex-1 px-3 py-2 bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
                    <button onClick={createPerson} className="px-4 py-2 bg-primary text-primary-foreground text-xs tracking-[0.15em] uppercase">
                      <Plus className="w-3 h-3 inline mr-1" /> Add
                    </button>
                  </div>
                </div>
                {persons.map((person) => (
                  <div key={person.id} className="bg-card border border-border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground">{person.name}</p>
                        <p className="text-[9px] text-muted-foreground">/{person.slug}</p>
                      </div>
                    </div>
                    <button onClick={() => deletePerson(person.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* DOWNLOAD PASSWORDS TAB */}
            {activeTab === "passwords" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-light text-foreground" style={{ fontFamily: "var(--font-display)" }}>Download Codes</h2>
                  <button onClick={() => generateDownloadPassword()} className="px-4 py-2 bg-primary text-primary-foreground text-xs tracking-[0.15em] uppercase hover:bg-primary/90">
                    <Key className="w-3 h-3 inline mr-1" /> Generate Code
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Generate unique download codes for clients. Each code expires in 24 hours and allows 5 downloads.</p>

                <div className="space-y-3">
                  {passwords.map((pwd) => (
                    <div key={pwd.id} className="bg-card border border-border p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-foreground tracking-wider">{pwd.code}</span>
                          <button onClick={() => copyCode(pwd.code)} className="text-muted-foreground hover:text-primary">
                            {copiedCode === pwd.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          Used: {pwd.used_count}/{pwd.max_uses} • Expires: {new Date(pwd.expires_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`text-[9px] tracking-wider uppercase px-2 py-1 border ${
                        pwd.is_active && new Date(pwd.expires_at) > new Date()
                          ? "text-primary border-primary/30"
                          : "text-destructive border-destructive/30"
                      }`}>
                        {pwd.is_active && new Date(pwd.expires_at) > new Date() ? "Active" : "Expired"}
                      </span>
                    </div>
                  ))}
                  {passwords.length === 0 && <p className="text-center text-muted-foreground py-12">No download codes generated yet.</p>}
                </div>
              </div>
            )}

            {/* ACCESS LOGS TAB */}
            {activeTab === "logs" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-foreground" style={{ fontFamily: "var(--font-display)" }}>Access Logs</h2>
                <p className="text-xs text-muted-foreground tracking-wide">Every QR scan and photo access is recorded here.</p>

                {accessLogs.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground text-sm">No access logs yet. Logs appear when someone scans a QR code.</div>
                ) : (
                  <div className="space-y-2">
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="bg-card border border-border p-4">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Total Scans</p>
                        <p className="text-2xl font-light text-foreground mt-1">{accessLogs.length}</p>
                      </div>
                      <div className="bg-card border border-border p-4">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Unique Events</p>
                        <p className="text-2xl font-light text-foreground mt-1">{new Set(accessLogs.map(l => l.event_id)).size}</p>
                      </div>
                      <div className="bg-card border border-border p-4">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Mobile</p>
                        <p className="text-2xl font-light text-foreground mt-1">{accessLogs.filter(l => l.device_type === "mobile").length}</p>
                      </div>
                      <div className="bg-card border border-border p-4">
                        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Desktop</p>
                        <p className="text-2xl font-light text-foreground mt-1">{accessLogs.filter(l => l.device_type === "desktop").length}</p>
                      </div>
                    </div>

                    {/* Logs table */}
                    <div className="bg-card border border-border overflow-hidden">
                      <div className="grid grid-cols-4 gap-2 px-4 py-2 border-b border-border bg-background">
                        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Event</p>
                        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">QR Code</p>
                        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Device</p>
                        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Time</p>
                      </div>
                      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                        {accessLogs.map((log) => (
                          <div key={log.id} className="grid grid-cols-4 gap-2 px-4 py-3 hover:bg-background/50 transition-colors">
                            <p className="text-xs text-foreground truncate">{log.events?.name || "—"}</p>
                            <p className="text-xs font-mono text-muted-foreground truncate">{log.qr_code || "—"}</p>
                            <p className="text-xs text-muted-foreground capitalize">{log.device_type || "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.accessed_at).toLocaleDateString()} {new Date(log.accessed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-light text-foreground" style={{ fontFamily: "var(--font-display)" }}>Site Settings</h2>

                <div className="bg-card border border-border p-6 space-y-4">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-primary flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Page Visibility
                  </h3>
                  <p className="text-xs text-muted-foreground">Toggle sections on/off on the main website.</p>

                  {["gallery", "scan", "about", "contact", "video", "testimonials"].map((page) => (
                    <div key={page} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm text-foreground capitalize">{page}</span>
                      <button
                        onClick={() => togglePageVisibility(page)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          pageVisibility[page] ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-primary-foreground transition-all ${
                          pageVisibility[page] ? "left-5" : "left-0.5"
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border p-6 space-y-3">
                  <h3 className="text-xs tracking-[0.2em] uppercase text-primary">Security Info</h3>
                  <ul className="text-xs text-muted-foreground space-y-2">
                    <li className="flex items-center gap-2"><Shield className="w-3 h-3 text-primary" /> Right-click protection on images enabled</li>
                    <li className="flex items-center gap-2"><Shield className="w-3 h-3 text-primary" /> Drag-to-save protection enabled</li>
                    <li className="flex items-center gap-2"><Shield className="w-3 h-3 text-primary" /> Developer tools shortcut blocking enabled</li>
                    <li className="flex items-center gap-2"><Shield className="w-3 h-3 text-primary" /> Download requires unique admin-generated code</li>
                    <li className="flex items-center gap-2"><Shield className="w-3 h-3 text-primary" /> Row-level security on all database tables</li>
                    <li className="flex items-center gap-2"><Shield className="w-3 h-3 text-primary" /> Admin-only write access to all content</li>
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
