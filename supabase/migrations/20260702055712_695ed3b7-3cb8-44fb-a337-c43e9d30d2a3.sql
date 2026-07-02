-- Restore EXECUTE on is_admin(text) for authenticated so that RLS policies
-- on profiles (and any other tables) that call public.is_admin(...) work
-- when the profile is fetched right after login. Without this, the profile
-- query fails with 42501 and the app treats the user as signed-out and
-- redirects to /login in a loop.
GRANT EXECUTE ON FUNCTION public.is_admin(text) TO authenticated;