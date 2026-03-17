-- Run this in Supabase SQL Editor to set mbutha711@gmail.com as admin
-- Admin = employer role (Venture Engine, job shortlisting, etc.)

-- 1. Set admin by email in user_roles
UPDATE public.user_roles ur
SET role = 'employer'::app_role
FROM auth.users u
WHERE ur.user_id = u.id
  AND u.email = 'mbutha711@gmail.com';

-- 2. Set admin by email in profiles
UPDATE public.profiles
SET user_type = 'employer', can_shortlist = true
WHERE id IN (SELECT id FROM auth.users WHERE email = 'mbutha711@gmail.com');

-- 3. Ensure user_roles row exists (if user had no row before)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'employer'::app_role
FROM auth.users u
WHERE u.email = 'mbutha711@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id);
