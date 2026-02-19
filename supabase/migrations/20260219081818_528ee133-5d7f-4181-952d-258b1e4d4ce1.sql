
-- Enum for care circle member roles
CREATE TYPE public.circle_role AS ENUM ('admin', 'caregiver', 'view-only');

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());

-- Care Circles table
CREATE TABLE public.care_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.care_circles ENABLE ROW LEVEL SECURITY;

-- Care Circle Members table
CREATE TABLE public.care_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_circle_id UUID NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role circle_role NOT NULL DEFAULT 'view-only',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (care_circle_id, user_id)
);

ALTER TABLE public.care_circle_members ENABLE ROW LEVEL SECURITY;

-- Care Recipients table
CREATE TABLE public.care_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_circle_id UUID NOT NULL REFERENCES public.care_circles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date_of_birth DATE,
  medical_conditions TEXT[] DEFAULT '{}',
  allergies JSONB DEFAULT '[]',
  primary_care_doctor TEXT,
  preferred_hospital TEXT,
  preferred_pharmacy TEXT,
  insurance_carrier TEXT,
  insurance_policy_number TEXT,
  insurance_group_number TEXT,
  standing_instructions TEXT[] DEFAULT '{}',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.care_recipients ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_circle_member(_circle_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_circle_members
    WHERE care_circle_id = _circle_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_circle_admin(_circle_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.care_circle_members
    WHERE care_circle_id = _circle_id AND user_id = auth.uid() AND role = 'admin'
  )
$$;

-- RLS Policies for care_circles
CREATE POLICY "Members can view their circles" ON public.care_circles FOR SELECT USING (public.is_circle_member(id));
CREATE POLICY "Authenticated users can create circles" ON public.care_circles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update circles" ON public.care_circles FOR UPDATE USING (public.is_circle_admin(id));
CREATE POLICY "Admins can delete circles" ON public.care_circles FOR DELETE USING (public.is_circle_admin(id));

-- RLS Policies for care_circle_members
CREATE POLICY "Members can view circle members" ON public.care_circle_members FOR SELECT USING (public.is_circle_member(care_circle_id));
CREATE POLICY "Admins can add members" ON public.care_circle_members FOR INSERT TO authenticated WITH CHECK (
  public.is_circle_admin(care_circle_id) OR (user_id = auth.uid())
);
CREATE POLICY "Admins can update members" ON public.care_circle_members FOR UPDATE USING (public.is_circle_admin(care_circle_id));
CREATE POLICY "Admins can remove members" ON public.care_circle_members FOR DELETE USING (public.is_circle_admin(care_circle_id));

-- RLS Policies for care_recipients
CREATE POLICY "Members can view care recipients" ON public.care_recipients FOR SELECT USING (public.is_circle_member(care_circle_id));
CREATE POLICY "Admins can add care recipients" ON public.care_recipients FOR INSERT TO authenticated WITH CHECK (public.is_circle_admin(care_circle_id));
CREATE POLICY "Admins and caregivers can update care recipients" ON public.care_recipients FOR UPDATE USING (public.is_circle_member(care_circle_id));
CREATE POLICY "Admins can delete care recipients" ON public.care_recipients FOR DELETE USING (public.is_circle_admin(care_circle_id));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_care_circles_updated_at BEFORE UPDATE ON public.care_circles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_care_recipients_updated_at BEFORE UPDATE ON public.care_recipients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
