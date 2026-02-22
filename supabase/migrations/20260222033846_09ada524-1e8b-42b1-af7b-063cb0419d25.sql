
-- Drop the restrictive INSERT policy and recreate as permissive
DROP POLICY "Authenticated users can create circles" ON public.care_circles;
CREATE POLICY "Authenticated users can create circles"
  ON public.care_circles
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Also fix care_circle_members INSERT policy
DROP POLICY "Admins can add members" ON public.care_circle_members;
CREATE POLICY "Admins can add members"
  ON public.care_circle_members
  FOR INSERT
  TO authenticated
  WITH CHECK (is_circle_admin(care_circle_id) OR (user_id = auth.uid()));

-- Fix care_recipients INSERT policy
DROP POLICY "Admins can add care recipients" ON public.care_recipients;
CREATE POLICY "Admins can add care recipients"
  ON public.care_recipients
  FOR INSERT
  TO authenticated
  WITH CHECK (is_circle_admin(care_circle_id));

-- Fix SELECT policies to be permissive
DROP POLICY "Members can view their circles" ON public.care_circles;
CREATE POLICY "Members can view their circles"
  ON public.care_circles
  FOR SELECT
  TO authenticated
  USING (is_circle_member(id));

DROP POLICY "Members can view circle members" ON public.care_circle_members;
CREATE POLICY "Members can view circle members"
  ON public.care_circle_members
  FOR SELECT
  TO authenticated
  USING (is_circle_member(care_circle_id));

DROP POLICY "Members can view care recipients" ON public.care_recipients;
CREATE POLICY "Members can view care recipients"
  ON public.care_recipients
  FOR SELECT
  TO authenticated
  USING (is_circle_member(care_circle_id));

-- Fix UPDATE policies
DROP POLICY "Admins can update circles" ON public.care_circles;
CREATE POLICY "Admins can update circles"
  ON public.care_circles
  FOR UPDATE
  TO authenticated
  USING (is_circle_admin(id));

DROP POLICY "Admins can update members" ON public.care_circle_members;
CREATE POLICY "Admins can update members"
  ON public.care_circle_members
  FOR UPDATE
  TO authenticated
  USING (is_circle_admin(care_circle_id));

DROP POLICY "Admins and caregivers can update care recipients" ON public.care_recipients;
CREATE POLICY "Admins and caregivers can update care recipients"
  ON public.care_recipients
  FOR UPDATE
  TO authenticated
  USING (is_circle_member(care_circle_id));

-- Fix DELETE policies
DROP POLICY "Admins can delete circles" ON public.care_circles;
CREATE POLICY "Admins can delete circles"
  ON public.care_circles
  FOR DELETE
  TO authenticated
  USING (is_circle_admin(id));

DROP POLICY "Admins can remove members" ON public.care_circle_members;
CREATE POLICY "Admins can remove members"
  ON public.care_circle_members
  FOR DELETE
  TO authenticated
  USING (is_circle_admin(care_circle_id));

DROP POLICY "Admins can delete care recipients" ON public.care_recipients;
CREATE POLICY "Admins can delete care recipients"
  ON public.care_recipients
  FOR DELETE
  TO authenticated
  USING (is_circle_admin(care_circle_id));

-- Fix profiles policies
DROP POLICY "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

DROP POLICY "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
