-- Enhance qr_access_logs with more details
ALTER TABLE public.qr_access_logs ADD COLUMN IF NOT EXISTS visitor_name TEXT;
ALTER TABLE public.qr_access_logs ADD COLUMN IF NOT EXISTS device_type TEXT;
ALTER TABLE public.qr_access_logs ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Photo access log (who viewed/downloaded which photos)
CREATE TABLE IF NOT EXISTS public.photo_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'download')),
  accessed_at timestamptz NOT NULL DEFAULT now(),
  user_agent TEXT,
  photos_count integer DEFAULT 0
);

ALTER TABLE public.photo_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log photo access"
  ON public.photo_access_logs FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can view photo access logs"
  ON public.photo_access_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_photo_access_event ON public.photo_access_logs(event_id);
CREATE INDEX idx_qr_access_event ON public.qr_access_logs(event_id);
