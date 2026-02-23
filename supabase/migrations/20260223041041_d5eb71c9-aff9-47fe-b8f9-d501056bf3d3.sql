-- Add telehealth_url column to appointments
ALTER TABLE public.appointments ADD COLUMN telehealth_url text DEFAULT NULL;