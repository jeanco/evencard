/**
 * EvenCard - Inicialización de Supabase Client
 */

(function () {
    if (typeof supabase === 'undefined') {
        console.error('El SDK de Supabase (@supabase/supabase-js) no está cargado.');
        return;
    }

    const { createClient } = supabase;
    // Usamos la anon key JWT para compatibilidad total con headers Auth y Storage de supabase-js v2
    const apiKey = window.CONFIG.SUPABASE_JWT_KEY || window.CONFIG.SUPABASE_ANON_KEY;
    
    try {
        const client = createClient(window.CONFIG.SUPABASE_URL, apiKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        window.sb = client;
        console.log('✅ Supabase Client inicializado correctamente para', window.CONFIG.APP_NAME);
    } catch (err) {
        console.error('Error inicializando Supabase:', err);
    }
})();
