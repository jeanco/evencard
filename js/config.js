/**
 * EvenCard - Configuración Global
 */

const CONFIG = {
    SUPABASE_URL: 'https://mfsdvlkphptgtssahpbr.supabase.co',
    // Clave anónima pública de Supabase
    SUPABASE_ANON_KEY: 'sb_publishable_CwBDx-RKCjqw4QfhqnmIgQ_WQSC472A',
    // Clave JWT anónima de compatibilidad
    SUPABASE_JWT_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mc2R2bGtwaHB0Z3Rzc2FocGJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMTk2MzYsImV4cCI6MjEwNTU5NTYzNn0.tANm5QuIhXK5xGLwQAU9PiuBKWYUlbsvseF4K0Wys48',
    
    // Buckets de almacenamiento
    BUCKETS: {
        AVATARS: 'avatars',
        COVERS: 'invitation-covers',
        BANNERS: 'invitation-banners',
        GALLERY: 'invitation-gallery',
        LOGOS: 'invitation-logos'
    },

    // Nombre de la app y rutas base
    APP_NAME: 'EvenCard',
    PUBLIC_INVITATION_BASE_URL: window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) + 'vista-invitacion.html?slug='
};

// Exponer globalmente
window.CONFIG = CONFIG;
