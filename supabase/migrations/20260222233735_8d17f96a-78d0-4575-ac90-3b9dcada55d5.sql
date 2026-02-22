
-- Audit log table for tracking access to sensitive health data
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  care_circle_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by circle and time
CREATE INDEX idx_audit_logs_circle_time ON public.audit_logs (care_circle_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON public.audit_logs (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only circle admins can view audit logs for their circle
CREATE POLICY "Circle admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (is_circle_admin(care_circle_id));

-- Any authenticated user can insert their own audit log entries
CREATE POLICY "Users can insert own audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Super admins can view all audit logs
CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_app_role(auth.uid(), 'super_admin'::app_role));

-- No one can update or delete audit logs (immutable)
