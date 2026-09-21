/**
 * EvenCard - Gestión de Almacenamiento con Supabase Storage
 */

const Storage = {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5 Megabytes

    /**
     * Valida un archivo antes de la subida
     */
    validateFile(file) {
        if (!file) {
            throw new Error('No se seleccionó ningún archivo.');
        }
        if (!this.ALLOWED_TYPES.includes(file.type)) {
            throw new Error(`Formato no permitido (${file.type}). Usa JPG, PNG o WEBP.`);
        }
        if (file.size > this.MAX_FILE_SIZE) {
            throw new Error(`El archivo excede el tamaño máximo permitido de 5MB.`);
        }
        return true;
    },

    /**
     * Sube un archivo a un bucket específico en la carpeta del usuario
     * @param {string} bucketName - Nombre del bucket
     * @param {File} file - Archivo del input
     * @param {string} [subfolder='general'] - Subcarpeta opcional (ej: invitation_id)
     */
    async uploadImage(bucketName, file, subfolder = 'general') {
        if (!window.sb) throw new Error('Supabase no está disponible.');
        this.validateFile(file);

        const user = await window.Auth.getCurrentUser();
        if (!user) throw new Error('Debes iniciar sesión para subir archivos.');

        const ext = file.name.split('.').pop().toLowerCase();
        const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const filePath = `${user.id}/${subfolder}/${cleanName}`;

        const { data, error } = await window.sb.storage
            .from(bucketName)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Error al subir a storage:', error);
            throw new Error(error.message || 'Error al subir la imagen.');
        }

        // Obtener la URL pública del bucket
        const { data: publicData } = window.sb.storage
            .from(bucketName)
            .getPublicUrl(data.path);

        return {
            path: data.path,
            publicUrl: publicData.publicUrl
        };
    },

    /**
     * Elimina un archivo del storage
     */
    async deleteFile(bucketName, filePath) {
        if (!window.sb || !filePath) return false;
        try {
            const { error } = await window.sb.storage
                .from(bucketName)
                .remove([filePath]);
            if (error) throw error;
            return true;
        } catch (err) {
            console.warn('No se pudo eliminar el archivo de storage:', err);
            return false;
        }
    }
};

window.Storage = Storage;
