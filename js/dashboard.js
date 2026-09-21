/**
 * EvenCard - Lógica del Dashboard de Usuario
 */

let allInvitations = [];
let currentFilter = 'todos';
let currentSearch = '';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Proteger ruta
    const user = await window.Auth.requireAuth('login.html');
    if (!user) return;

    // 2. Cargar perfil y actualizar UI
    const profile = await window.Auth.getProfile(user.id);
    const displayName = profile?.first_name || user.email.split('@')[0];
    const greetingEl = document.getElementById('user-greeting');
    if (greetingEl) {
        greetingEl.textContent = displayName;
    }
    const userEmailEl = document.getElementById('user-email');
    if (userEmailEl) {
        userEmailEl.textContent = user.email;
    }

    // 3. Cargar invitaciones
    await loadInvitations();

    // 4. Setup de eventos
    setupEventListeners();
});

async function loadInvitations() {
    const listContainer = document.getElementById('invitations-container');
    const loadingEl = document.getElementById('dashboard-loading');
    const emptyEl = document.getElementById('dashboard-empty');

    try {
        if (loadingEl) loadingEl.classList.remove('d-none');
        if (emptyEl) emptyEl.classList.add('d-none');
        if (listContainer) listContainer.innerHTML = '';

        allInvitations = await window.InvitationService.getUserInvitations();
        updateStats(allInvitations);
        renderFilteredInvitations();
    } catch (err) {
        console.error('Error al cargar invitaciones:', err);
        window.Utils.showToast('No se pudieron cargar las invitaciones.', 'danger');
    } finally {
        if (loadingEl) loadingEl.classList.add('d-none');
    }
}

function updateStats(invitations) {
    const total = invitations.length;
    const published = invitations.filter(i => i.status === 'publicada').length;
    let totalViews = 0;
    let totalRsvps = 0;

    invitations.forEach(inv => {
        // Supabase devuelve el aggregate count como [{count: 'N'}]
        const viewsArr = inv.invitation_views;
        if (Array.isArray(viewsArr) && viewsArr.length > 0) {
            totalViews += parseInt(viewsArr[0].count, 10) || 0;
        }
        const rsvpsArr = inv.invitation_rsvps;
        if (Array.isArray(rsvpsArr) && rsvpsArr.length > 0) {
            totalRsvps += parseInt(rsvpsArr[0].count, 10) || 0;
        }
    });

    const statTotalEl = document.getElementById('stat-total');
    const statPublishedEl = document.getElementById('stat-published');
    const statViewsEl = document.getElementById('stat-views');
    const statRsvpsEl = document.getElementById('stat-rsvps');

    if (statTotalEl) statTotalEl.textContent = total;
    if (statPublishedEl) statPublishedEl.textContent = published;
    if (statViewsEl) statViewsEl.textContent = totalViews;
    if (statRsvpsEl) statRsvpsEl.textContent = totalRsvps;
}

function renderFilteredInvitations() {
    const listContainer = document.getElementById('invitations-container');
    const emptyEl = document.getElementById('dashboard-empty');
    if (!listContainer) return;

    let filtered = allInvitations.filter(inv => {
        const matchesFilter = currentFilter === 'todos' || inv.status === currentFilter;
        const matchesSearch = !currentSearch ||
            inv.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            inv.event_type.toLowerCase().includes(currentSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        listContainer.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('d-none');
        return;
    }

    if (emptyEl) emptyEl.classList.add('d-none');

    const typeIcons = {
        boda: 'bi-heart-fill text-danger',
        cumpleanos: 'bi-cake2-fill text-warning',
        quince_anos: 'bi-gem text-info',
        bautizo: 'bi-droplet-fill text-primary',
        baby_shower: 'bi-balloon-heart-fill text-pink',
        primera_comunion: 'bi-sun-fill text-warning',
        aniversario: 'bi-stars text-purple',
        empresarial: 'bi-briefcase-fill text-secondary',
        otro: 'bi-calendar-event-fill text-primary'
    };

    const typeLabels = {
        boda: 'Boda',
        cumpleanos: 'Cumpleaños',
        quince_anos: 'Quince Años',
        bautizo: 'Bautizo',
        baby_shower: 'Baby Shower',
        primera_comunion: 'Primera Comunión',
        aniversario: 'Aniversario',
        empresarial: 'Empresarial',
        otro: 'Evento Especial'
    };

    const statusBadges = {
        borrador: '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1"><i class="bi bi-pencil-fill me-1"></i> Borrador</span>',
        publicada: '<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1"><i class="bi bi-check-circle-fill me-1"></i> Publicada</span>',
        finalizada: '<span class="badge bg-dark-subtle text-dark border border-dark-subtle px-2 py-1"><i class="bi bi-flag-fill me-1"></i> Finalizada</span>'
    };

    listContainer.innerHTML = filtered.map(inv => {
        const viewsCount = parseInt(inv.invitation_views?.[0]?.count, 10) || 0;
        const rsvpsCount = parseInt(inv.invitation_rsvps?.[0]?.count, 10) || 0;
        const coverImg = inv.cover_image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80';
        const publicUrl = window.CONFIG.PUBLIC_INVITATION_BASE_URL + inv.slug;
        const formattedDate = window.Utils.formatDateShort(inv.event_date);

        return `
            <div class="col-12 col-md-6 col-lg-4 mb-4">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden invitation-dashboard-card transition">
                    <!-- Imagen de portada con badge de estado -->
                    <div class="position-relative card-cover-wrap" style="height: 180px; overflow: hidden;">
                        <img src="${coverImg}" class="w-100 h-100 object-fit-cover card-cover-img" alt="${inv.title}">
                        <div class="position-absolute top-0 start-0 m-3">
                            ${statusBadges[inv.status] || statusBadges.borrador}
                        </div>
                        <div class="position-absolute bottom-0 start-0 end-0 p-3 bg-gradient-to-t text-white">
                            <span class="badge bg-dark bg-opacity-75 rounded-pill px-3 py-1 small">
                                <i class="bi ${typeIcons[inv.event_type] || typeIcons.otro} me-1"></i>
                                ${typeLabels[inv.event_type] || 'Evento'}
                            </span>
                        </div>
                    </div>

                    <!-- Contenido -->
                    <div class="card-body p-4 d-flex flex-column justify-content-between">
                        <div>
                            <h5 class="card-title fw-bold text-dark mb-1 text-truncate" title="${inv.title}">
                                ${inv.title}
                            </h5>
                            <p class="text-secondary small mb-3">
                                <i class="bi bi-calendar3 me-1 text-primary"></i> ${formattedDate}
                                ${inv.event_time ? ` · <i class="bi bi-clock me-1 text-primary"></i> ${window.Utils.formatTime(inv.event_time)}` : ''}
                            </p>
                        </div>

                        <!-- Métricas Rápidas -->
                        <div class="d-flex justify-content-between align-items-center py-2 px-3 bg-light rounded-3 mb-3">
                            <div class="text-center">
                                <span class="d-block small text-muted">Visitas</span>
                                <strong class="text-dark"><i class="bi bi-eye text-primary me-1"></i>${viewsCount}</strong>
                            </div>
                            <div class="vr opacity-25"></div>
                            <div class="text-center px-2 py-1 rounded-2" style="cursor: pointer; transition: background 0.2s;" 
                                 onclick="openRsvpModal('${inv.id}', '${inv.title.replace(/'/g, "\\'")}')" 
                                 title="Ver lista de confirmaciones">
                                <span class="d-block small text-muted">RSVPs</span>
                                <strong class="text-success"><i class="bi bi-person-check-fill text-success me-1"></i>${rsvpsCount} <i class="bi bi-box-arrow-up-right" style="font-size: 0.7rem;"></i></strong>
                            </div>
                            <div class="vr opacity-25"></div>
                            <div class="text-center">
                                <span class="d-block small text-muted">Plantilla</span>
                                <strong class="text-capitalize text-dark small">${inv.template_id || 'Elegante'}</strong>
                            </div>
                        </div>

                        <!-- Acciones -->
                        <div class="d-flex gap-2">
                            <a href="${inv.status === 'publicada' ? publicUrl : `editar-invitacion.html?id=${inv.id}`}" 
                               class="btn btn-sm btn-outline-primary rounded-3 flex-grow-1" 
                               ${inv.status === 'publicada' ? 'target="_blank"' : ''}>
                                <i class="bi ${inv.status === 'publicada' ? 'bi-box-arrow-up-right' : 'bi-pencil-square'} me-1"></i>
                                ${inv.status === 'publicada' ? 'Ver Pública' : 'Editar'}
                            </a>

                            <div class="dropdown">
                                <button class="btn btn-sm btn-light rounded-3 px-3" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                                    <li>
                                        <button class="dropdown-item py-2 fw-semibold text-success" onclick="openRsvpModal('${inv.id}', '${inv.title.replace(/'/g, "\\'")}')">
                                            <i class="bi bi-people-fill me-2 text-success"></i> Ver Confirmaciones (${rsvpsCount})
                                        </button>
                                    </li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                        <a class="dropdown-item py-2" href="editar-invitacion.html?id=${inv.id}">
                                            <i class="bi bi-pencil me-2 text-primary"></i> Editar contenido
                                        </a>
                                    </li>
                                    <li>
                                        <button class="dropdown-item py-2" onclick="openShareModal('${inv.title}', '${publicUrl}', '${inv.status}')">
                                            <i class="bi bi-share me-2 text-primary"></i> Compartir enlace
                                        </button>
                                    </li>
                                    <li>
                                        <button class="dropdown-item py-2" onclick="handleDuplicate('${inv.id}')">
                                            <i class="bi bi-copy me-2 text-info"></i> Duplicar invitación
                                        </button>
                                    </li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                        <button class="dropdown-item py-2 text-danger" onclick="handleDelete('${inv.id}', '${inv.title}')">
                                            <i class="bi bi-trash3 me-2"></i> Eliminar
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupEventListeners() {
    // Filtros de estado
    document.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active', 'btn-primary'));
            document.querySelectorAll('.filter-pill').forEach(b => b.classList.add('btn-light'));
            e.currentTarget.classList.add('active', 'btn-primary');
            e.currentTarget.classList.remove('btn-light');
            currentFilter = e.currentTarget.dataset.filter;
            renderFilteredInvitations();
        });
    });

    // Buscador
    const searchInput = document.getElementById('search-invitations');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderFilteredInvitations();
        });
    }

    // Clic en la tarjeta de estadísticas de Confirmaciones del encabezado
    const statRsvpsCard = document.getElementById('card-stat-rsvps');
    if (statRsvpsCard) {
        statRsvpsCard.addEventListener('click', () => {
            if (allInvitations.length > 0) {
                // Abre las confirmaciones de la primera o más reciente invitación
                const targetInv = allInvitations[0];
                window.openRsvpModal(targetInv.id, targetInv.title);
            } else {
                window.Utils.showToast('Primero crea una invitación para recibir confirmaciones.', 'info');
            }
        });
    }

    // Botón logout
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => window.Auth.logout());
    }
}

// Variables de estado del modal de confirmaciones
let currentRsvpsData = [];
let currentRsvpInvitationTitle = '';

// Abrir modal de lista de confirmaciones (RSVPs)
window.openRsvpModal = async function(invitationId, title) {
    const modalEl = document.getElementById('rsvpModal');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    currentRsvpInvitationTitle = title || 'Invitación';
    const subtitleEl = document.getElementById('rsvp-modal-subtitle');
    const labelEl = document.getElementById('rsvpModalLabel');
    if (labelEl) {
        labelEl.innerHTML = `
            <span class="p-2 bg-success-subtle text-success rounded-3 d-inline-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                <i class="bi bi-people-fill fs-5"></i>
            </span>
            Confirmaciones — ${title}
        `;
    }
    if (subtitleEl) subtitleEl.textContent = 'Consultando respuestas recibidas...';

    const loadingEl = document.getElementById('rsvp-modal-loading');
    const emptyEl = document.getElementById('rsvp-modal-empty');
    const tableContainer = document.getElementById('rsvp-table-container');
    const tbody = document.getElementById('rsvp-modal-tbody');
    const btnExport = document.getElementById('btn-export-rsvps');

    if (loadingEl) loadingEl.classList.remove('d-none');
    if (emptyEl) emptyEl.classList.add('d-none');
    if (tableContainer) tableContainer.classList.add('d-none');
    if (btnExport) btnExport.classList.add('d-none');
    if (tbody) tbody.innerHTML = '';

    try {
        const rsvps = await window.InvitationService.getInvitationRsvps(invitationId);
        currentRsvpsData = rsvps;

        if (loadingEl) loadingEl.classList.add('d-none');

        const totalGuests = rsvps.length;
        const totalPasses = rsvps.reduce((acc, r) => acc + (parseInt(r.num_guests, 10) || 1), 0);
        const attendingCount = rsvps.filter(r => r.attending !== false).length;
        const attendingPercent = totalGuests > 0 ? Math.round((attendingCount / totalGuests) * 100) : 0;

        const countEl = document.getElementById('rsvp-modal-count');
        const passesEl = document.getElementById('rsvp-modal-passes');
        const attendingEl = document.getElementById('rsvp-modal-attending');
        if (countEl) countEl.textContent = totalGuests;
        if (passesEl) passesEl.textContent = totalPasses;
        if (attendingEl) attendingEl.textContent = `${attendingPercent}%`;
        if (subtitleEl) subtitleEl.textContent = `${totalGuests} confirmación(es) registrada(s) · ${totalPasses} persona(s) en total`;

        if (rsvps.length === 0) {
            if (emptyEl) emptyEl.classList.remove('d-none');
            return;
        }

        if (btnExport) btnExport.classList.remove('d-none');
        if (tableContainer) tableContainer.classList.remove('d-none');

        if (tbody) {
            tbody.innerHTML = rsvps.map(r => {
                const dateStr = r.created_at ? new Date(r.created_at).toLocaleString('es-ES', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                }) : 'Reciente';

                const phoneClean = (r.phone || '').replace(/[^0-9]/g, '');
                const waLink = phoneClean ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(`¡Hola ${r.guest_name}! Gracias por confirmar tu asistencia a nuestro evento.`)}` : null;

                return `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center gap-2">
                                <div class="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center" style="width: 36px; height: 36px; font-size: 0.9rem;">
                                    ${(r.guest_name || 'I').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <strong class="d-block text-dark text-capitalize">${r.guest_name}</strong>
                                    ${r.email ? `<small class="text-muted d-block">${r.email}</small>` : ''}
                                </div>
                            </div>
                        </td>
                        <td>
                            <span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1 fw-semibold">
                                <i class="bi bi-person-check-fill me-1"></i>${r.num_guests || 1} pase(s)
                            </span>
                        </td>
                        <td>
                            ${r.phone ? `
                                <div class="d-flex align-items-center gap-2">
                                    <span class="small text-secondary font-monospace">${r.phone}</span>
                                    ${waLink ? `
                                        <a href="${waLink}" target="_blank" class="btn btn-sm btn-outline-success py-0 px-2 rounded-pill" title="Escribir por WhatsApp">
                                            <i class="bi bi-whatsapp me-1"></i>Chat
                                        </a>
                                    ` : ''}
                                </div>
                            ` : '<span class="text-muted small">No especificado</span>'}
                        </td>
                        <td style="max-width: 240px;">
                            ${r.notes ? `<small class="text-dark fst-italic">"${r.notes}"</small>` : '<span class="text-muted small">—</span>'}
                        </td>
                        <td>
                            <small class="text-muted">${dateStr}</small>
                        </td>
                    </tr>
                `;
            }).join('');
        }

    } catch (err) {
        console.error('Error al cargar confirmaciones:', err);
        if (loadingEl) loadingEl.classList.add('d-none');
        window.Utils.showToast('No se pudieron cargar las confirmaciones.', 'danger');
    }
};

// Exportar confirmaciones a formato CSV (Excel)
window.exportCurrentRsvps = function() {
    if (!currentRsvpsData || currentRsvpsData.length === 0) {
        window.Utils.showToast('No hay confirmaciones para exportar.', 'warning');
        return;
    }

    const headers = ['Nombre del Invitado', 'Pases', 'Telefono', 'Email', 'Asistira', 'Mensaje / Notas', 'Fecha de Registro'];
    const rows = currentRsvpsData.map(r => [
        `"${(r.guest_name || '').replace(/"/g, '""')}"`,
        r.num_guests || 1,
        `"${(r.phone || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        r.attending !== false ? 'Sí' : 'No',
        `"${(r.notes || '').replace(/"/g, '""')}"`,
        `"${r.created_at || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeTitle = (currentRsvpInvitationTitle || 'confirmaciones').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.setAttribute('download', `confirmaciones_${safeTitle}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.Utils.showToast('Archivo CSV descargado con éxito.', 'success');
};

// Modal de compartir
window.openShareModal = function (title, url, status) {
    const modalEl = document.getElementById('shareModal');
    if (!modalEl) return;

    const modalTitle = document.getElementById('share-modal-title');
    const inputUrl = document.getElementById('share-modal-url');
    const btnWhatsapp = document.getElementById('share-modal-wa');
    const qrContainer = document.getElementById('share-modal-qr');
    const statusNotice = document.getElementById('share-status-notice');

    if (modalTitle) modalTitle.textContent = title;
    if (inputUrl) inputUrl.value = url;

    if (statusNotice) {
        if (status !== 'publicada') {
            statusNotice.classList.remove('d-none');
        } else {
            statusNotice.classList.add('d-none');
        }
    }

    if (btnWhatsapp) {
        const waMsg = `¡Hola! Te invito a compartir conmigo este momento especial: ${title} 🎉. Puedes ver todos los detalles y confirmar tu asistencia aquí: ${url}`;
        btnWhatsapp.href = window.Utils.generateWhatsAppUrl(waMsg);
    }

    // Generar código QR usando la API pública segura de QR
    if (qrContainer) {
        qrContainer.innerHTML = `
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}" 
                 alt="Código QR" 
                 class="img-fluid rounded-3 border p-2 bg-white shadow-sm" style="max-width: 180px;">
        `;
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
};

window.handleDuplicate = async function (id) {
    try {
        window.Utils.showToast('Duplicando invitación...', 'info');
        await window.InvitationService.duplicateInvitation(id);
        window.Utils.showToast('Invitación duplicada correctamente.', 'success');
        await loadInvitations();
    } catch (err) {
        console.error('Error al duplicar:', err);
        window.Utils.showToast('Error al duplicar la invitación.', 'danger');
    }
};

window.handleDelete = async function (id, title) {
    if (!confirm(`¿Estás seguro de que deseas eliminar la invitación "${title}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        window.Utils.showToast('Eliminando invitación...', 'info');
        await window.InvitationService.deleteInvitation(id);
        window.Utils.showToast('Invitación eliminada.', 'success');
        await loadInvitations();
    } catch (err) {
        console.error('Error al eliminar:', err);
        window.Utils.showToast('Error al eliminar la invitación.', 'danger');
    }
};
