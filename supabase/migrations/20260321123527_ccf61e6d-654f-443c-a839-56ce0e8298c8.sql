
-- Tighten site_settings: only admins can write
DROP POLICY "Authenticated can manage site settings" ON public.site_settings;
CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tighten download_passwords: only admins can insert/update/delete
DROP POLICY "Authenticated can manage download passwords" ON public.download_passwords;
CREATE POLICY "Admins can manage download passwords"
  ON public.download_passwords FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tighten events: only admins can write
DROP POLICY "Authenticated can manage events" ON public.events;
CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tighten photos: only admins can write
DROP POLICY "Authenticated can manage photos" ON public.photos;
CREATE POLICY "Admins can manage photos"
  ON public.photos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tighten persons: only admins can write
DROP POLICY "Authenticated can manage persons" ON public.persons;
CREATE POLICY "Admins can manage persons"
  ON public.persons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Tighten photo_persons: only admins can write
DROP POLICY "Authenticated can manage photo_persons" ON public.photo_persons;
CREATE POLICY "Admins can manage photo_persons"
  ON public.photo_persons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
