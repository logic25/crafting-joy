
-- Fix the permissive INSERT policy on care_circles
DROP POLICY "Authenticated users can create circles" ON public.care_circles;
CREATE POLICY "Authenticated users can create circles" ON public.care_circles FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
