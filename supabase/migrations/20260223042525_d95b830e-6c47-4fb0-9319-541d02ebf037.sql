CREATE POLICY "Circle members can delete health readings"
ON public.health_readings
FOR DELETE
USING (is_circle_member(care_circle_id));