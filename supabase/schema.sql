-- ==============================================================================
-- EVENCARD: ESQUEMA DE BASE DE DATOS POSTGRESQL PARA SUPABASE
-- Plataforma de Invitaciones Digitales
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA: profiles (Perfiles de usuarios vinculados a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. TABLA: invitations (Invitaciones principales)
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL DEFAULT 'otro',
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'publicada', 'finalizada')),
    description TEXT,
    event_date DATE,
    event_time TIME,
    cover_image TEXT,
    banner_image TEXT,
    logo_image TEXT,
    primary_color TEXT DEFAULT '#6C63FF',
    secondary_color TEXT DEFAULT '#F8FAFC',
    template_id TEXT DEFAULT 'elegante' CHECK (template_id IN ('elegante', 'romantica', 'moderna', 'floral', 'minimalista')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    published_at TIMESTAMPTZ
);

-- 4. TABLA: invitation_people (Personas clave: agasajados, novios, padres, padrinos)
CREATE TABLE IF NOT EXISTS public.invitation_people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g. novia, novio, padre, madre, padrino, madrina, agasajado, cumpleanero
    name TEXT NOT NULL,
    role TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. TABLA: invitation_locations (Ubicación del evento)
CREATE TABLE IF NOT EXISTS public.invitation_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
    place_name TEXT,
    address TEXT,
    reference TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    map_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. TABLA: invitation_gallery (Galería de fotografías)
CREATE TABLE IF NOT EXISTS public.invitation_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. TABLA: invitation_schedule (Cronograma o programa del evento)
CREATE TABLE IF NOT EXISTS public.invitation_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_time TIME,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. TABLA: invitation_settings (Configuración y secciones visibles)
CREATE TABLE IF NOT EXISTS public.invitation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL UNIQUE REFERENCES public.invitations(id) ON DELETE CASCADE,
    show_countdown BOOLEAN DEFAULT true,
    show_gallery BOOLEAN DEFAULT true,
    show_location BOOLEAN DEFAULT true,
    show_schedule BOOLEAN DEFAULT true,
    show_parents BOOLEAN DEFAULT true,
    show_confirmation BOOLEAN DEFAULT true,
    show_music BOOLEAN DEFAULT false,
    show_share BOOLEAN DEFAULT true,
    music_url TEXT,
    gift_registry_info TEXT,
    dress_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. TABLA: invitation_views (Métricas y visitas)
CREATE TABLE IF NOT EXISTS public.invitation_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
    visitor_id TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. TABLA: invitation_rsvps (Confirmaciones de asistencia)
CREATE TABLE IF NOT EXISTS public.invitation_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    num_guests INTEGER DEFAULT 1,
    attending BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_invitations_user_id ON public.invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON public.invitations(slug);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_event_date ON public.invitations(event_date);
CREATE INDEX IF NOT EXISTS idx_invitation_people_invitation_id ON public.invitation_people(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_locations_invitation_id ON public.invitation_locations(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_gallery_invitation_id ON public.invitation_gallery(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_schedule_invitation_id ON public.invitation_schedule(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_views_invitation_id ON public.invitation_views(invitation_id);
CREATE INDEX IF NOT EXISTS idx_invitation_rsvps_invitation_id ON public.invitation_rsvps(invitation_id);

-- ==============================================================================
-- TRIGGERS Y FUNCIONES AUTOMÁTICAS
-- ==============================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de actualización de fecha
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_invitations_updated_at ON public.invitations;
CREATE TRIGGER trigger_invitations_updated_at
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_invitation_settings_updated_at ON public.invitation_settings;
CREATE TRIGGER trigger_invitation_settings_updated_at
    BEFORE UPDATE ON public.invitation_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Función y trigger para crear perfil automáticamente al registrarse en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, phone, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_rsvps ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para profiles
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden ver su propio perfil"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden insertar su propio perfil"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. Políticas para invitations
DROP POLICY IF EXISTS "Usuarios gestionan sus propias invitaciones" ON public.invitations;
CREATE POLICY "Usuarios gestionan sus propias invitaciones"
    ON public.invitations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Cualquiera puede consultar invitaciones publicadas" ON public.invitations;
CREATE POLICY "Cualquiera puede consultar invitaciones publicadas"
    ON public.invitations FOR SELECT
    USING (status = 'publicada');

-- 3. Políticas para tablas secundarias asociadas a la invitación
-- (invitation_people, invitation_locations, invitation_gallery, invitation_schedule, invitation_settings)

-- invitation_people
DROP POLICY IF EXISTS "Propietarios gestionan personas de invitacion" ON public.invitation_people;
CREATE POLICY "Propietarios gestionan personas de invitacion"
    ON public.invitation_people FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_people.invitation_id
            AND invitations.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_people.invitation_id
            AND invitations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Publico puede ver personas de invitacion publicada" ON public.invitation_people;
CREATE POLICY "Publico puede ver personas de invitacion publicada"
    ON public.invitation_people FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_people.invitation_id
            AND invitations.status = 'publicada'
        )
    );

-- invitation_locations
DROP POLICY IF EXISTS "Propietarios gestionan ubicaciones" ON public.invitation_locations;
CREATE POLICY "Propietarios gestionan ubicaciones"
    ON public.invitation_locations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_locations.invitation_id
            AND invitations.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_locations.invitation_id
            AND invitations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Publico puede ver ubicacion de invitacion publicada" ON public.invitation_locations;
CREATE POLICY "Publico puede ver ubicacion de invitacion publicada"
    ON public.invitation_locations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_locations.invitation_id
            AND invitations.status = 'publicada'
        )
    );

-- invitation_gallery
DROP POLICY IF EXISTS "Propietarios gestionan galeria" ON public.invitation_gallery;
CREATE POLICY "Propietarios gestionan galeria"
    ON public.invitation_gallery FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_gallery.invitation_id
            AND invitations.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_gallery.invitation_id
            AND invitations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Publico puede ver fotos de invitacion publicada" ON public.invitation_gallery;
CREATE POLICY "Publico puede ver fotos de invitacion publicada"
    ON public.invitation_gallery FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_gallery.invitation_id
            AND invitations.status = 'publicada'
        )
    );

-- invitation_schedule
DROP POLICY IF EXISTS "Propietarios gestionan itinerario" ON public.invitation_schedule;
CREATE POLICY "Propietarios gestionan itinerario"
    ON public.invitation_schedule FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_schedule.invitation_id
            AND invitations.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_schedule.invitation_id
            AND invitations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Publico puede ver itinerario de invitacion publicada" ON public.invitation_schedule;
CREATE POLICY "Publico puede ver itinerario de invitacion publicada"
    ON public.invitation_schedule FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_schedule.invitation_id
            AND invitations.status = 'publicada'
        )
    );

-- invitation_settings
DROP POLICY IF EXISTS "Propietarios gestionan configuracion" ON public.invitation_settings;
CREATE POLICY "Propietarios gestionan configuracion"
    ON public.invitation_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_settings.invitation_id
            AND invitations.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_settings.invitation_id
            AND invitations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Publico puede ver configuracion de invitacion publicada" ON public.invitation_settings;
CREATE POLICY "Publico puede ver configuracion de invitacion publicada"
    ON public.invitation_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_settings.invitation_id
            AND invitations.status = 'publicada'
        )
    );

-- 4. invitation_views
DROP POLICY IF EXISTS "Cualquiera puede registrar una visita" ON public.invitation_views;
CREATE POLICY "Cualquiera puede registrar una visita"
    ON public.invitation_views FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_views.invitation_id
            AND invitations.status = 'publicada'
        )
    );

DROP POLICY IF EXISTS "Propietarios pueden consultar visitas de sus invitaciones" ON public.invitation_views;
CREATE POLICY "Propietarios pueden consultar visitas de sus invitaciones"
    ON public.invitation_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_views.invitation_id
            AND invitations.user_id = auth.uid()
        )
    );

-- 5. invitation_rsvps
DROP POLICY IF EXISTS "Cualquiera puede confirmar asistencia a invitacion publicada" ON public.invitation_rsvps;
CREATE POLICY "Cualquiera puede confirmar asistencia a invitacion publicada"
    ON public.invitation_rsvps FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_rsvps.invitation_id
            AND invitations.status = 'publicada'
        )
    );

DROP POLICY IF EXISTS "Propietarios pueden ver confirmaciones de sus invitaciones" ON public.invitation_rsvps;
CREATE POLICY "Propietarios pueden ver confirmaciones de sus invitaciones"
    ON public.invitation_rsvps FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invitations
            WHERE invitations.id = invitation_rsvps.invitation_id
            AND invitations.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- BUCKETS DE ALMACENAMIENTO (SUPABASE STORAGE)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('invitation-covers', 'invitation-covers', true),
    ('invitation-banners', 'invitation-banners', true),
    ('invitation-gallery', 'invitation-gallery', true),
    ('invitation-logos', 'invitation-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para objetos
DROP POLICY IF EXISTS "Acceso publico de lectura a buckets de evencard" ON storage.objects;
CREATE POLICY "Acceso publico de lectura a buckets de evencard"
    ON storage.objects FOR SELECT
    USING (bucket_id IN ('avatars', 'invitation-covers', 'invitation-banners', 'invitation-gallery', 'invitation-logos'));

DROP POLICY IF EXISTS "Usuarios autenticados pueden subir archivos a sus carpetas" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden subir archivos a sus carpetas"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id IN ('avatars', 'invitation-covers', 'invitation-banners', 'invitation-gallery', 'invitation-logos')
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar sus archivos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden actualizar sus archivos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id IN ('avatars', 'invitation-covers', 'invitation-banners', 'invitation-gallery', 'invitation-logos')
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar sus archivos" ON storage.objects;
CREATE POLICY "Usuarios autenticados pueden eliminar sus archivos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id IN ('avatars', 'invitation-covers', 'invitation-banners', 'invitation-gallery', 'invitation-logos')
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
