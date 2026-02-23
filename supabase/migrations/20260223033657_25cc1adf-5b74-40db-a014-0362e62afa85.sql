
-- 1. notification_preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_reminders boolean NOT NULL DEFAULT true,
  refill_reminders boolean NOT NULL DEFAULT true,
  coverage_requests boolean NOT NULL DEFAULT true,
  family_updates boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON public.notification_preferences FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. roadmap_items table
CREATE TABLE public.roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'backlog',
  category text,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view roadmap" ON public.roadmap_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can insert roadmap items" ON public.roadmap_items FOR INSERT WITH CHECK (has_app_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can update roadmap items" ON public.roadmap_items FOR UPDATE USING (has_app_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can delete roadmap items" ON public.roadmap_items FOR DELETE USING (has_app_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_roadmap_items_updated_at
  BEFORE UPDATE ON public.roadmap_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed roadmap items
INSERT INTO public.roadmap_items (title, description, status, category, priority) VALUES
  ('Push notifications and reminders', 'Send push notifications for appointments, medication reminders, and coverage requests', 'planned', 'Notifications', 1),
  ('Google Calendar sync', 'Two-way sync appointments with Google Calendar', 'planned', 'Integrations', 2),
  ('SMS family invites', 'Invite family members to the care circle via SMS', 'planned', 'Family', 3),
  ('Document camera scan (OCR)', 'Scan paper documents using device camera with OCR text extraction', 'planned', 'Documents', 4),
  ('Export care report as PDF', 'Generate a comprehensive PDF report of care activity, medications, and health readings', 'planned', 'Documents', 5),
  ('Medication refill alerts', 'Automatic alerts when medication refills are running low based on quantity and frequency', 'planned', 'Medications', 6),
  ('Fax to doctor''s office', 'Send documents directly to providers via eFax integration', 'planned', 'Integrations', 7),
  ('Medication interaction checker', 'AI-powered check for dangerous drug interactions across the medication list', 'planned', 'AI', 8),
  ('Telehealth appointment links', 'Add video call links to appointments and join telehealth visits from the app', 'planned', 'Appointments', 9),
  ('Voice notes in chat', 'Record and send voice messages in the care circle chat', 'backlog', 'Chat', 10),
  ('Apple Watch integration', 'Sync health data from Apple Watch including heart rate, steps, and fall detection', 'backlog', 'Health', 11),
  ('Caregiver shift scheduling', 'Create and manage caregiver shift schedules with handoff notes', 'backlog', 'Family', 12),
  ('Insurance claims tracker', 'Track insurance claims, EOBs, and reimbursement status', 'backlog', 'Documents', 13),
  ('Symptom diary with photo', 'Log symptoms with photos, severity ratings, and trend tracking', 'backlog', 'Health', 14),
  ('Multi-language support', 'Support for Spanish, Chinese, and other languages for diverse families', 'backlog', 'Accessibility', 15);
