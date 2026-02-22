
ALTER TABLE public.health_alerts
  ADD COLUMN model_used text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  ADD COLUMN complexity text NOT NULL DEFAULT 'standard',
  ADD COLUMN input_tokens integer,
  ADD COLUMN output_tokens integer,
  ADD COLUMN response_time_ms integer,
  ADD COLUMN estimated_cost numeric;
