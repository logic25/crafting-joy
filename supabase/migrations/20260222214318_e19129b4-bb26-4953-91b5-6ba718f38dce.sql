
-- App-level role enum (separate from circle roles)
CREATE TYPE public.app_role AS ENUM ('super_admin');

-- App-level user roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check app-level roles
CREATE OR REPLACE FUNCTION public.has_app_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Only super admins can view user_roles
CREATE POLICY "Super admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_app_role(auth.uid(), 'super_admin'));

-- Only super admins can manage roles
CREATE POLICY "Super admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_app_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_app_role(auth.uid(), 'super_admin'));

-- Allow super admins to view ALL profiles (for admin dashboard)
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_app_role(auth.uid(), 'super_admin'));

-- Allow super admins to view ALL care circles
CREATE POLICY "Super admins can view all circles"
ON public.care_circles
FOR SELECT
TO authenticated
USING (public.has_app_role(auth.uid(), 'super_admin'));

-- Allow super admins to view ALL care circle members
CREATE POLICY "Super admins can view all circle members"
ON public.care_circle_members
FOR SELECT
TO authenticated
USING (public.has_app_role(auth.uid(), 'super_admin'));

-- Allow super admins to view ALL care recipients
CREATE POLICY "Super admins can view all care recipients"
ON public.care_recipients
FOR SELECT
TO authenticated
USING (public.has_app_role(auth.uid(), 'super_admin'));
