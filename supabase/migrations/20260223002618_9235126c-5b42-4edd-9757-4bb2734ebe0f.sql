
-- ══════════════════════════════════════════════════════════
-- Providers (Doctors, Pharmacies, Hospitals)
-- ══════════════════════════════════════════════════════════
CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_circle_id UUID NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'doctor' CHECK (type IN ('doctor', 'clinic', 'hospital', 'pharmacy')),
  phone TEXT,
  fax TEXT,
  email TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  office_hours TEXT,
  portal_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view providers"
ON public.providers FOR SELECT
USING (is_circle_member(care_circle_id));

CREATE POLICY "Circle members can insert providers"
ON public.providers FOR INSERT
WITH CHECK (is_circle_member(care_circle_id));

CREATE POLICY "Circle members can update providers"
ON public.providers FOR UPDATE
USING (is_circle_member(care_circle_id));

CREATE POLICY "Circle admins can delete providers"
ON public.providers FOR DELETE
USING (is_circle_admin(care_circle_id));

CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════
-- Appointments
-- ══════════════════════════════════════════════════════════
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_circle_id UUID NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  care_recipient_id UUID NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  provider_specialty TEXT,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER DEFAULT 30,
  type TEXT NOT NULL DEFAULT 'primary-care' CHECK (type IN ('primary-care', 'specialist', 'lab', 'imaging', 'procedure', 'follow-up')),
  location TEXT,
  purpose TEXT NOT NULL,
  pre_appointment_notes TEXT,
  questions_to_ask TEXT[] DEFAULT '{}',
  assigned_caregiver_id UUID,
  assigned_caregiver_name TEXT,
  coverage_status TEXT NOT NULL DEFAULT 'needs-coverage' CHECK (coverage_status IN ('assigned', 'needs-coverage', 'coverage-requested', 'completed', 'cancelled')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')),
  visit_summary JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view appointments"
ON public.appointments FOR SELECT
USING (is_circle_member(care_circle_id));

CREATE POLICY "Circle members can insert appointments"
ON public.appointments FOR INSERT
WITH CHECK (is_circle_member(care_circle_id) AND created_by = auth.uid());

CREATE POLICY "Circle members can update appointments"
ON public.appointments FOR UPDATE
USING (is_circle_member(care_circle_id));

CREATE POLICY "Circle admins can delete appointments"
ON public.appointments FOR DELETE
USING (is_circle_admin(care_circle_id));

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════
-- Documents
-- ══════════════════════════════════════════════════════════
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_circle_id UUID NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  care_recipient_id UUID,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('lab-results', 'imaging', 'discharge', 'insurance', 'prescriptions', 'referral', 'legal', 'other')),
  uploaded_by UUID NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Circle members can view documents"
ON public.documents FOR SELECT
USING (is_circle_member(care_circle_id));

CREATE POLICY "Circle members can insert documents"
ON public.documents FOR INSERT
WITH CHECK (is_circle_member(care_circle_id) AND uploaded_by = auth.uid());

CREATE POLICY "Circle members can update documents"
ON public.documents FOR UPDATE
USING (is_circle_member(care_circle_id));

CREATE POLICY "Circle admins can delete documents"
ON public.documents FOR DELETE
USING (is_circle_admin(care_circle_id));

-- ══════════════════════════════════════════════════════════
-- Storage bucket for documents
-- ══════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Circle members can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Circle members can view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Circle members can delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Super admin policies
CREATE POLICY "Super admins can view all providers"
ON public.providers FOR SELECT
USING (has_app_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can view all appointments"
ON public.appointments FOR SELECT
USING (has_app_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can view all documents"
ON public.documents FOR SELECT
USING (has_app_role(auth.uid(), 'super_admin'::app_role));
