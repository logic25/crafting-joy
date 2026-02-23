
-- Feedback table for logging user ideas from chat
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_circle_id UUID REFERENCES public.care_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  original_message TEXT NOT NULL,
  ai_analysis TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'planned', 'declined')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Circle members can view feedback for their circle
CREATE POLICY "Circle members can view feedback"
ON public.feedback FOR SELECT
USING (is_circle_member(care_circle_id));

-- Circle members can insert feedback
CREATE POLICY "Circle members can insert feedback"
ON public.feedback FOR INSERT
WITH CHECK (is_circle_member(care_circle_id) AND user_id = auth.uid());

-- Circle admins can update feedback (change status, add notes)
CREATE POLICY "Circle admins can update feedback"
ON public.feedback FOR UPDATE
USING (is_circle_admin(care_circle_id));

-- Super admins can view all feedback
CREATE POLICY "Super admins can view all feedback"
ON public.feedback FOR SELECT
USING (has_app_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can update all feedback
CREATE POLICY "Super admins can update all feedback"
ON public.feedback FOR UPDATE
USING (has_app_role(auth.uid(), 'super_admin'::app_role));

-- Timestamp trigger
CREATE TRIGGER update_feedback_updated_at
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
