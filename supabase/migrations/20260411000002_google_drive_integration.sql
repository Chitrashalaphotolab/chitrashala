-- Add Google Drive folder URL to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS drive_folder_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;

-- Table to cache Google Drive photo links per event
CREATE TABLE IF NOT EXISTS public.drive_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  drive_file_id TEXT NOT NULL,
  file_name TEXT,
  thumbnail_url TEXT,
  view_url TEXT,
  direct_url TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, drive_file_id)
);

ALTER TABLE public.drive_photos ENABLE ROW LEVEL SECURITY;

-- Public can view drive photos for public events
CREATE POLICY "Drive photos viewable for public events"
  ON public.drive_photos FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.events 
      WHERE events.id = drive_photos.event_id 
      AND events.is_public = true
    )
  );

-- Admins can manage drive photos
CREATE POLICY "Admins can manage drive photos"
  ON public.drive_photos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_drive_photos_event ON public.drive_photos(event_id);
