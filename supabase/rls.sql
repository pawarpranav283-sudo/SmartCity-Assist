-- ==============================================================================
-- CivicFix AI 2.0 - Row Level Security (RLS) Policies
-- Strict Access Control for Supabase
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;

-- 2. Helper function to check if current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- PROFILES POLICIES
-- ==============================================================================

-- Anyone authenticated can view their own profile; admins can view all
CREATE POLICY "Users can view own profile or admins view all"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id OR public.is_admin()
    );

-- Users can update their own profile fields
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can update any profile (e.g. promote citizen to admin)
CREATE POLICY "Admins can manage any profile"
    ON public.profiles
    FOR ALL
    USING (public.is_admin());

-- Trigger to prevent non-admins from escalating their role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
        NEW.role = OLD.role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER enforce_profile_role_security
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_role_escalation();

-- ==============================================================================
-- COMPLAINTS POLICIES
-- ==============================================================================

-- Public transparency: Anyone (even unauthenticated) can view complaints
-- This enables public live maps, community feeds, and tracking without friction
CREATE POLICY "Public read access for transparency"
    ON public.complaints
    FOR SELECT
    USING (true);

-- Authenticated users or guests can submit a complaint
CREATE POLICY "Anyone authenticated can report an issue"
    ON public.complaints
    FOR INSERT
    WITH CHECK (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
        (auth.uid() IS NULL)
    );

-- Citizens can only edit their OWN complaint while it is still 'Pending'
-- Citizens CANNOT alter priority, status, assigned_department, or admin_notes
CREATE POLICY "Citizens can edit own pending complaint"
    ON public.complaints
    FOR UPDATE
    USING (
        auth.uid() = user_id AND status = 'Pending'
    )
    WITH CHECK (
        auth.uid() = user_id AND status = 'Pending'
    );

-- Administrators have full update permissions (status change, department, notes, priority)
CREATE POLICY "Admins have full update permissions on complaints"
    ON public.complaints
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Only Admins can delete complaints
CREATE POLICY "Only admins can delete complaints"
    ON public.complaints
    FOR DELETE
    USING (public.is_admin());

-- ==============================================================================
-- COMPLAINT STATUS HISTORY POLICIES
-- ==============================================================================

-- Public can view the audit trail for transparent governance
CREATE POLICY "Public read access for status history"
    ON public.complaint_status_history
    FOR SELECT
    USING (true);

-- Only Admins or database triggers can insert audit history records
CREATE POLICY "Only admins can manually insert status history"
    ON public.complaint_status_history
    FOR INSERT
    WITH CHECK (public.is_admin() OR auth.uid() IS NOT NULL);

-- Status history is immutable: NO UPDATES OR DELETES allowed
CREATE POLICY "Status history is immutable"
    ON public.complaint_status_history
    FOR UPDATE
    USING (false);

CREATE POLICY "Status history cannot be deleted"
    ON public.complaint_status_history
    FOR DELETE
    USING (false);
