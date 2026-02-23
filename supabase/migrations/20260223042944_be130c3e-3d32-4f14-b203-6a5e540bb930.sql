CREATE POLICY "Circle members can delete health alerts"
ON public.health_alerts
FOR DELETE
USING (is_circle_member(care_circle_id));