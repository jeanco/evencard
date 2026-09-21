/**
 * EvenCard - Utilidades y Helpers Generales
 */

const Utils = {
    /**
     * Muestra una notificación Toast de Bootstrap
     * @param {string} message - Mensaje a mostrar
     * @param {'success'|'danger'|'warning'|'info'} type - Tipo de notificación
     * @param {string} [title] - Título opcional
     */
    showToast(message, type = 'success', title = '') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            container.style.zIndex = '1090';
            document.body.appendChild(container);
        }

        const toastId = 'toast-' + Date.now();
        const icons = {
            success: 'bi-check-circle-fill text-success',
            danger: 'bi-exclamation-triangle-fill text-danger',
            warning: 'bi-exclamation-circle-fill text-warning',
            info: 'bi-info-circle-fill text-primary'
        };

        const toastEl = document.createElement('div');
        toastEl.id = toastId;
        toastEl.className = 'toast align-items-center shadow-lg border-0';
        toastEl.setAttribute('role', 'alert');
        toastEl.setAttribute('aria-live', 'assertive');
        toastEl.setAttribute('aria-atomic', 'true');

        toastEl.innerHTML = `
            <div class="d-flex align-items-center p-2 bg-white rounded-3 border-start border-4 border-${type}">
                <div class="toast-icon me-2 fs-5">
                    <i class="bi ${icons[type] || icons.info}"></i>
                </div>
                <div class="toast-body p-0 flex-grow-1">
                    ${title ? `<strong class="d-block text-dark">${title}</strong>` : ''}
                    <span class="text-secondary small">${message}</span>
                </div>
                <button type="button" class="btn-close ms-2 me-1" data-bs-dismiss="toast" aria-label="Cerrar"></button>
            </div>
        `;

        container.appendChild(toastEl);

        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            const bsToast = new bootstrap.Toast(toastEl, { delay: 4500 });
            bsToast.show();
            toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
        } else {
            setTimeout(() => toastEl.remove(), 4500);
        }
    },

    /**
     * Convierte un texto a slug limpio y amigable para URL
     */
    generateSlug(text) {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '') || ('invitacion-' + Math.random().toString(36).substring(2, 8));
    },

    /**
     * Formatea una fecha YYYY-MM-DD a formato amigable en español
     */
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const parts = dateString.split('-');
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    },

    /**
     * Formatea fecha corta (ej: 25 Oct 2026)
     */
    formatDateShort(dateString) {
        if (!dateString) return 'Sin fecha';
        try {
            const parts = dateString.split('-');
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    },

    /**
     * Formatea hora HH:MM:SS a formato 12 horas con AM/PM
     */
    formatTime(timeString) {
        if (!timeString) return '';
        try {
            const [hours, minutes] = timeString.split(':');
            const h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${h12}:${minutes} ${ampm}`;
        } catch {
            return timeString;
        }
    },

    /**
     * Copia texto al portapapeles y notifica
     */
    async copyToClipboard(text, message = 'Enlace copiado al portapapeles') {
        try {
            await navigator.clipboard.writeText(text);
            Utils.showToast(message, 'success');
            return true;
        } catch {
            // Fallback
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            Utils.showToast(message, 'success');
            return true;
        }
    },

    /**
     * Genera URL directa de compartir a WhatsApp
     */
    generateWhatsAppUrl(text, phone = '') {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const encodedText = encodeURIComponent(text);
        if (cleanPhone) {
            return `https://wa.me/${cleanPhone}?text=${encodedText}`;
        }
        return `https://wa.me/?text=${encodedText}`;
    },

    /**
     * Helper para estado de carga en botones
     */
    setLoadingButton(button, isLoading, loadingText = 'Guardando...') {
        if (!button) return;
        if (isLoading) {
            button.dataset.originalHtml = button.innerHTML;
            button.disabled = true;
            button.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ${loadingText}
            `;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalHtml || button.innerHTML;
        }
    },

    /**
     * Formatea bytes a tamaño legible
     */
    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
};

window.Utils = Utils;
