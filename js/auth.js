/**
 * EvenCard - Módulo de Autenticación con Supabase
 */

const Auth = {
    /**
     * Obtiene la sesión actual
     */
    async getSession() {
        if (!window.sb) return null;
        const { data: { session }, error } = await window.sb.auth.getSession();
        if (error) {
            console.error('Error al obtener sesión:', error);
            return null;
        }
        return session;
    },

    /**
     * Obtiene el usuario autenticado
     */
    async getCurrentUser() {
        const session = await this.getSession();
        return session ? session.user : null;
    },

    /**
     * Obtiene el perfil del usuario desde public.profiles
     */
    async getProfile(userId = null) {
        if (!window.sb) return null;
        const uid = userId || (await this.getCurrentUser())?.id;
        if (!uid) return null;

        const { data, error } = await window.sb
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();

        if (error) {
            console.warn('No se pudo obtener el perfil:', error.message);
            return null;
        }
        return data;
    },

    /**
     * Espera hasta que haya una sesión activa (máx 5 intentos)
     * Necesario porque Supabase puede tardar un momento en propagar el JWT
     * después de signUp con autoconfirm habilitado.
     */
    async waitForSession(maxAttempts = 5, delayMs = 600) {
        for (let i = 0; i < maxAttempts; i++) {
            const session = await this.getSession();
            if (session) return session;
            await new Promise(r => setTimeout(r, delayMs));
        }
        return null;
    },

    /**
     * Registra un nuevo usuario.
     * El trigger handle_new_user (SECURITY DEFINER) se encarga de crear
     * el registro en public.profiles automáticamente al insertar en auth.users.
     * NO hacemos upsert manual para evitar errores de RLS cuando el JWT
     * aún no está propagado al cliente JS.
     */
    async register({ firstName, lastName, phone, email, password }) {
        if (!window.sb) throw new Error('Supabase no está inicializado.');

        const { data, error } = await window.sb.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone || ''
                }
            }
        });

        if (error) throw error;

        // Si el proyecto tiene "Confirm email" activado, data.session será null
        // y el usuario deberá verificar su email antes de iniciar sesión.
        // Si está desactivado, la sesión llega aquí directamente.
        // En cualquier caso, NO intentamos hacer upsert manual: el trigger lo maneja.

        return data;
    },

    /**
     * Inicia sesión con Email y Contraseña
     */
    async login(email, password) {
        if (!window.sb) throw new Error('Supabase no está inicializado.');

        const { data, error } = await window.sb.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    },

    /**
     * Cierra la sesión
     */
    async logout() {
        if (!window.sb) return;
        try {
            await window.sb.auth.signOut();
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        }
        window.location.href = 'login.html';
    },

    /**
     * Actualiza los datos del perfil
     */
    async updateProfile({ firstName, lastName, phone, avatarUrl }) {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('No hay usuario autenticado.');

        const updateData = {
            id: user.id,
            first_name: firstName,
            last_name: lastName,
            phone: phone || ''
        };
        if (avatarUrl) updateData.avatar_url = avatarUrl;

        const { data, error } = await window.sb
            .from('profiles')
            .upsert(updateData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Guard para páginas protegidas (dashboard, crear-invitacion, etc.)
     */
    async requireAuth(redirectTo = 'login.html') {
        const session = await this.getSession();
        if (!session) {
            window.location.href = redirectTo;
            return null;
        }
        return session.user;
    },

    /**
     * Guard para páginas públicas de login/registro (si ya está logueado, ir a dashboard)
     */
    async redirectIfAuth(redirectTo = 'dashboard.html') {
        const session = await this.getSession();
        if (session) {
            window.location.href = redirectTo;
            return session.user;
        }
        return null;
    }
};

window.Auth = Auth;
