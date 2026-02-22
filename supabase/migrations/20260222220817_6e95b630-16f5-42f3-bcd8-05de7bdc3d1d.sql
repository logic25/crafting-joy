
-- ============================================
-- health_readings: unified table for all vitals
-- ============================================
CREATE TABLE public.health_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_circle_id uuid NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  care_recipient_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('bp', 'weight', 'heart_rate', 'steps', 'sleep', 'glucose', 'spo2', 'temperature')),
  value_primary numeric NOT NULL,
  value_secondary numeric,
  value_tertiary numeric,
  unit text NOT NULL,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'apple_health', 'google_health', 'device')),
  logged_by uuid NOT NULL,
  logged_by_name text NOT NULL,
  notes text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.health_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view health readings"
  ON public.health_readings FOR SELECT
  USING (is_circle_member(care_circle_id));

CREATE POLICY "Circle members can insert health readings"
  ON public.health_readings FOR INSERT
  WITH CHECK (is_circle_member(care_circle_id) AND logged_by = auth.uid());

CREATE POLICY "Super admins can view all health readings"
  ON public.health_readings FOR SELECT
  USING (has_app_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_health_readings_circle_type ON public.health_readings(care_circle_id, type, created_at DESC);

-- ============================================
-- health_alerts: Circle's AI assessments
-- ============================================
CREATE TABLE public.health_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_circle_id uuid NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  reading_id uuid REFERENCES public.health_readings(id) ON DELETE SET NULL,
  severity text NOT NULL CHECK (severity IN ('normal', 'watch', 'attention', 'urgent')),
  title text NOT NULL,
  message text NOT NULL,
  correlations jsonb,
  action_needed text,
  acknowledged_by uuid[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.health_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view health alerts"
  ON public.health_alerts FOR SELECT
  USING (is_circle_member(care_circle_id));

CREATE POLICY "Super admins can view all health alerts"
  ON public.health_alerts FOR SELECT
  USING (has_app_role(auth.uid(), 'super_admin'::app_role));

CREATE INDEX idx_health_alerts_circle ON public.health_alerts(care_circle_id, created_at DESC);

-- ============================================
-- Grant super_admin to erussell25@gmail.com
-- ============================================
INSERT INTO public.user_roles (user_id, role)
VALUES ('661806a3-d19a-4da3-91f4-010668741921', 'super_admin')
ON CONFLICT DO NOTHING;
