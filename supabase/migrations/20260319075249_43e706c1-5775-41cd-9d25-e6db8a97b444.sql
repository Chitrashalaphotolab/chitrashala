-- Events table (weddings, photoshoots, etc.)
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  event_date DATE,
  location TEXT,
  category TEXT NOT NULL DEFAULT 'wedding',
  cover_image_url TEXT,
  description TEXT,
  qr_code TEXT UNIQUE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Persons table (people tagged in photos)
CREATE TABLE public.persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Photos table
CREATE TABLE public.photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Person-Photo junction table
CREATE TABLE public.photo_persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  UNIQUE(photo_id, person_id)
);

-- QR access logs
CREATE TABLE public.qr_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_access_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for events marked as public
CREATE POLICY "Public events are viewable by everyone" ON public.events FOR SELECT USING (is_public = true);
CREATE POLICY "All events viewable by authenticated" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage events" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Photos: public if event is public, all for authenticated
CREATE POLICY "Photos of public events are viewable" ON public.photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = photos.event_id AND events.is_public = true)
  OR event_id IS NULL
);
CREATE POLICY "All photos viewable by authenticated" ON public.photos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage photos" ON public.photos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Persons: public read
CREATE POLICY "Persons are viewable by everyone" ON public.persons FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage persons" ON public.persons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Photo_persons: public read
CREATE POLICY "Photo persons are viewable by everyone" ON public.photo_persons FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage photo_persons" ON public.photo_persons FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- QR access logs: insert for everyone, read for authenticated
CREATE POLICY "Anyone can log QR access" ON public.qr_access_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can view QR logs" ON public.qr_access_logs FOR SELECT TO authenticated USING (true);

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

CREATE POLICY "Photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Authenticated can upload photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');
CREATE POLICY "Authenticated can update photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'photos');
CREATE POLICY "Authenticated can delete photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos');

-- Indexes
CREATE INDEX idx_photos_event ON public.photos(event_id);
CREATE INDEX idx_photos_category ON public.photos(category);
CREATE INDEX idx_photo_persons_photo ON public.photo_persons(photo_id);
CREATE INDEX idx_photo_persons_person ON public.photo_persons(person_id);
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_qr ON public.events(qr_code);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();