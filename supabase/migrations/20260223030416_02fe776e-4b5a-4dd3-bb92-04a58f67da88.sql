
-- ============================================================
-- 1. MEDICATIONS TABLE
-- ============================================================
CREATE TABLE public.medications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_circle_id uuid NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  care_recipient_id uuid NOT NULL REFERENCES public.care_recipients(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text,
  frequency text,
  instructions text,
  purpose text,
  prescriber text,
  pharmacy text,
  quantity text,
  refills_remaining integer,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  added_by uuid NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view medications"
  ON public.medications FOR SELECT
  USING (is_circle_member(care_circle_id));

CREATE POLICY "Circle members can insert medications"
  ON public.medications FOR INSERT
  WITH CHECK (is_circle_member(care_circle_id) AND added_by = auth.uid());

CREATE POLICY "Circle members can update medications"
  ON public.medications FOR UPDATE
  USING (is_circle_member(care_circle_id));

CREATE POLICY "Circle admins can delete medications"
  ON public.medications FOR DELETE
  USING (is_circle_admin(care_circle_id));

CREATE POLICY "Super admins can view all medications"
  ON public.medications FOR SELECT
  USING (has_app_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. CHAT_MESSAGES TABLE
-- ============================================================
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_circle_id uuid NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_name text NOT NULL,
  content text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view chat messages"
  ON public.chat_messages FOR SELECT
  USING (is_circle_member(care_circle_id));

CREATE POLICY "Circle members can insert chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (is_circle_member(care_circle_id));

CREATE POLICY "Super admins can view all chat messages"
  ON public.chat_messages FOR SELECT
  USING (has_app_role(auth.uid(), 'super_admin'::app_role));
