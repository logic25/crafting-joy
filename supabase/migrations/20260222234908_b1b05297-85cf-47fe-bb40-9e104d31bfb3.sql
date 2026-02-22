
-- Create app_settings table for storing application-wide settings like the access code
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can read settings
CREATE POLICY "Super admins can view settings"
ON public.app_settings FOR SELECT
USING (has_app_role(auth.uid(), 'super_admin'::app_role));

-- Only super admins can update settings
CREATE POLICY "Super admins can update settings"
ON public.app_settings FOR UPDATE
USING (has_app_role(auth.uid(), 'super_admin'::app_role));

-- Only super admins can insert settings
CREATE POLICY "Super admins can insert settings"
ON public.app_settings FOR INSERT
WITH CHECK (has_app_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with initial access code (you can change this from the admin panel)
INSERT INTO public.app_settings (key, value) VALUES ('access_code', 'carecircle2025');
