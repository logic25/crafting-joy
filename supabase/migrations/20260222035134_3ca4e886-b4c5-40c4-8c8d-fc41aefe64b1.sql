
-- Fix: Allow circle creators to also view their circles (needed for INSERT...RETURNING)
DROP POLICY "Members can view their circles" ON public.care_circles;
CREATE POLICY "Members or creator can view circles"
  ON public.care_circles
  FOR SELECT
  TO authenticated
  USING (is_circle_member(id) OR created_by = auth.uid());
