/**
 * EvenCard - Servicio y Modelo de Datos de Invitaciones
 */

const InvitationService = {
    /**
     * Obtiene todas las invitaciones del usuario actual con conteo de visitas y confirmaciones
     */
    async getUserInvitations() {
        if (!window.sb) throw new Error('Supabase no inicializado.');
        const user = await window.Auth.getCurrentUser();
        if (!user) throw new Error('Usuario no autenticado.');

        const { data, error } = await window.sb
            .from('invitations')
            .select(`
                *,
                invitation_views(count),
                invitation_rsvps(count)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Obtiene la lista completa de confirmaciones (RSVPs) de una invitación
     */
    async getInvitationRsvps(invitationId) {
        if (!window.sb || !invitationId) return [];
        const { data, error } = await window.sb
            .from('invitation_rsvps')
            .select('*')
            .eq('invitation_id', invitationId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error al obtener RSVPs:', error);
            throw error;
        }
        return data || [];
    },

    /**
     * Obtiene una invitación por su ID junto con todas sus tablas secundarias
     */
    async getInvitationById(id) {
        if (!window.sb || !id) return null;

        const { data: invitation, error } = await window.sb
            .from('invitations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Consultar tablas secundarias en paralelo
        const [peopleRes, locationRes, galleryRes, scheduleRes, settingsRes] = await Promise.all([
            window.sb.from('invitation_people').select('*').eq('invitation_id', id).order('created_at', { ascending: true }),
            window.sb.from('invitation_locations').select('*').eq('invitation_id', id).maybeSingle(),
            window.sb.from('invitation_gallery').select('*').eq('invitation_id', id).order('sort_order', { ascending: true }),
            window.sb.from('invitation_schedule').select('*').eq('invitation_id', id).order('sort_order', { ascending: true }),
            window.sb.from('invitation_settings').select('*').eq('invitation_id', id).maybeSingle()
        ]);

        return {
            ...invitation,
            people: peopleRes.data || [],
            location: locationRes.data || null,
            gallery: galleryRes.data || [],
            schedule: scheduleRes.data || [],
            settings: settingsRes.data || null
        };
    },

    /**
     * Obtiene una invitación por su Slug para la vista pública
     */
    async getInvitationBySlug(slug) {
        if (!window.sb || !slug) return null;

        const { data: invitation, error } = await window.sb
            .from('invitations')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            console.error('No se encontró la invitación con slug:', slug, error);
            return null;
        }

        const id = invitation.id;
        const [peopleRes, locationRes, galleryRes, scheduleRes, settingsRes] = await Promise.all([
            window.sb.from('invitation_people').select('*').eq('invitation_id', id).order('created_at', { ascending: true }),
            window.sb.from('invitation_locations').select('*').eq('invitation_id', id).maybeSingle(),
            window.sb.from('invitation_gallery').select('*').eq('invitation_id', id).order('sort_order', { ascending: true }),
            window.sb.from('invitation_schedule').select('*').eq('invitation_id', id).order('sort_order', { ascending: true }),
            window.sb.from('invitation_settings').select('*').eq('invitation_id', id).maybeSingle()
        ]);

        return {
            ...invitation,
            people: peopleRes.data || [],
            location: locationRes.data || null,
            gallery: galleryRes.data || [],
            schedule: scheduleRes.data || [],
            settings: settingsRes.data || null
        };
    },

    /**
     * Guarda o actualiza una invitación completa con sus relaciones
     */
    async saveInvitation(payload, existingId = null) {
        const user = await window.Auth.getCurrentUser();
        if (!user) throw new Error('Debes iniciar sesión.');

        const mainData = {
            user_id: user.id,
            event_type: payload.event_type || 'otro',
            title: payload.title,
            slug: payload.slug,
            status: payload.status || 'borrador',
            description: payload.description || '',
            event_date: payload.event_date || null,
            event_time: payload.event_time || null,
            cover_image: payload.cover_image || null,
            banner_image: payload.banner_image || null,
            logo_image: payload.logo_image || null,
            primary_color: payload.primary_color || '#6C63FF',
            secondary_color: payload.secondary_color || '#F8FAFC',
            template_id: payload.template_id || 'elegante'
        };

        let invitationId = existingId;

        if (existingId) {
            const { error: updErr } = await window.sb
                .from('invitations')
                .update(mainData)
                .eq('id', existingId);
            if (updErr) throw updErr;
        } else {
            const { data: newInv, error: insErr } = await window.sb
                .from('invitations')
                .insert(mainData)
                .select()
                .single();
            if (insErr) throw insErr;
            invitationId = newInv.id;
        }

        // Sincronizar personas clave
        if (payload.people && Array.isArray(payload.people)) {
            await window.sb.from('invitation_people').delete().eq('invitation_id', invitationId);
            if (payload.people.length > 0) {
                const peopleToInsert = payload.people.map(p => ({
                    invitation_id: invitationId,
                    type: p.type || 'agasajado',
                    name: p.name,
                    role: p.role || ''
                }));
                await window.sb.from('invitation_people').insert(peopleToInsert);
            }
        }

        // Sincronizar ubicación
        if (payload.location) {
            const locData = {
                invitation_id: invitationId,
                place_name: payload.location.place_name || '',
                address: payload.location.address || '',
                reference: payload.location.reference || '',
                latitude: payload.location.latitude ? parseFloat(payload.location.latitude) : null,
                longitude: payload.location.longitude ? parseFloat(payload.location.longitude) : null,
                map_url: payload.location.map_url || ''
            };

            const { data: existingLoc } = await window.sb
                .from('invitation_locations')
                .select('id')
                .eq('invitation_id', invitationId)
                .maybeSingle();

            if (existingLoc) {
                await window.sb.from('invitation_locations').update(locData).eq('id', existingLoc.id);
            } else {
                await window.sb.from('invitation_locations').insert(locData);
            }
        }

        // Sincronizar galería de fotos
        if (payload.gallery && Array.isArray(payload.gallery)) {
            await window.sb.from('invitation_gallery').delete().eq('invitation_id', invitationId);
            if (payload.gallery.length > 0) {
                const galleryToInsert = payload.gallery.map((g, idx) => ({
                    invitation_id: invitationId,
                    image_url: g.image_url,
                    storage_path: g.storage_path || '',
                    sort_order: idx
                }));
                await window.sb.from('invitation_gallery').insert(galleryToInsert);
            }
        }

        // Sincronizar cronograma
        if (payload.schedule && Array.isArray(payload.schedule)) {
            await window.sb.from('invitation_schedule').delete().eq('invitation_id', invitationId);
            if (payload.schedule.length > 0) {
                const scheduleToInsert = payload.schedule.map((s, idx) => ({
                    invitation_id: invitationId,
                    title: s.title,
                    description: s.description || '',
                    event_time: s.event_time || null,
                    sort_order: idx
                }));
                await window.sb.from('invitation_schedule').insert(scheduleToInsert);
            }
        }

        // Sincronizar configuraciones y toggles
        const settingsData = {
            invitation_id: invitationId,
            show_countdown: payload.settings?.show_countdown ?? true,
            show_gallery: payload.settings?.show_gallery ?? true,
            show_location: payload.settings?.show_location ?? true,
            show_schedule: payload.settings?.show_schedule ?? true,
            show_parents: payload.settings?.show_parents ?? true,
            show_confirmation: payload.settings?.show_confirmation ?? true,
            show_music: payload.settings?.show_music ?? false,
            show_share: payload.settings?.show_share ?? true,
            music_url: payload.settings?.music_url || null,
            gift_registry_info: payload.settings?.gift_registry_info || null,
            dress_code: payload.settings?.dress_code || null
        };

        await window.sb.from('invitation_settings').upsert(settingsData, { onConflict: 'invitation_id' });

        return invitationId;
    },

    /**
     * Publica una invitación
     */
    async publishInvitation(id) {
        if (!window.sb || !id) throw new Error('ID no provisto.');
        const { data, error } = await window.sb
            .from('invitations')
            .update({
                status: 'publicada',
                published_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Elimina una invitación
     */
    async deleteInvitation(id) {
        if (!window.sb || !id) return;
        const { error } = await window.sb
            .from('invitations')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Duplica una invitación existente
     */
    async duplicateInvitation(id) {
        const full = await this.getInvitationById(id);
        if (!full) throw new Error('Invitación no encontrada.');

        const newSlug = window.Utils.generateSlug(full.title + '-copia-' + Math.random().toString(36).substring(2, 6));
        const newTitle = full.title + ' (Copia)';

        const clonePayload = {
            ...full,
            title: newTitle,
            slug: newSlug,
            status: 'borrador',
            people: full.people.map(({ id, invitation_id, created_at, ...rest }) => rest),
            location: full.location ? (({ id, invitation_id, created_at, ...rest }) => rest)(full.location) : null,
            gallery: full.gallery.map(({ id, invitation_id, created_at, ...rest }) => rest),
            schedule: full.schedule.map(({ id, invitation_id, created_at, ...rest }) => rest),
            settings: full.settings ? (({ id, invitation_id, created_at, updated_at, ...rest }) => rest)(full.settings) : null
        };

        delete clonePayload.id;
        delete clonePayload.created_at;
        delete clonePayload.updated_at;
        delete clonePayload.published_at;

        return await this.saveInvitation(clonePayload, null);
    },

    /**
     * Registra una visita en una invitación pública
     */
    async registerView(invitationId) {
        if (!window.sb || !invitationId) return;
        try {
            const visitorId = localStorage.getItem('evencard_vid') || ('v_' + Math.random().toString(36).substring(2, 12));
            localStorage.setItem('evencard_vid', visitorId);

            await window.sb.from('invitation_views').insert({
                invitation_id: invitationId,
                visitor_id: visitorId,
                user_agent: navigator.userAgent ? navigator.userAgent.substring(0, 150) : '',
                referrer: document.referrer ? document.referrer.substring(0, 150) : ''
            });
        } catch (err) {
            console.warn('Registro de visita silencioso:', err);
        }
    },

    /**
     * Registra una confirmación de asistencia (RSVP)
     */
    async submitRsvp(invitationId, rsvpData) {
        if (!window.sb || !invitationId) throw new Error('Invitación no válida.');

        const { data, error } = await window.sb
            .from('invitation_rsvps')
            .insert({
                invitation_id: invitationId,
                guest_name: rsvpData.guest_name,
                phone: rsvpData.phone || '',
                email: rsvpData.email || '',
                num_guests: parseInt(rsvpData.num_guests, 10) || 1,
                attending: rsvpData.attending !== false,
                notes: rsvpData.notes || ''
            });

        if (error) {
            console.error('Error en Supabase submitRsvp:', error);
            throw error;
        }
        return { success: true };
    }
};

window.InvitationService = InvitationService;
