/**
 * EvenCard - Manejador de Galería Fotográfica
 */

class GalleryManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.items = []; // { id, imageUrl, storagePath, file, sortOrder }
    }

    setItems(items) {
        this.items = items.map((item, index) => ({
            ...item,
            sortOrder: item.sort_order !== undefined ? item.sort_order : index
        }));
        this.render();
    }

    getItems() {
        return this.items;
    }

    addFiles(files) {
        const fileList = Array.from(files);
        fileList.forEach(file => {
            try {
                window.Storage.validateFile(file);
                const localUrl = URL.createObjectURL(file);
                this.items.push({
                    id: 'temp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
                    imageUrl: localUrl,
                    storagePath: null,
                    file: file,
                    sortOrder: this.items.length
                });
            } catch (err) {
                window.Utils.showToast(err.message, 'warning');
            }
        });
        this.render();
    }

    removeItem(index) {
        const removed = this.items.splice(index, 1)[0];
        if (removed && removed.imageUrl && removed.imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(removed.imageUrl);
        }
        // Reindexar sortOrder
        this.items.forEach((it, idx) => it.sortOrder = idx);
        this.render();
    }

    moveItem(fromIndex, toIndex) {
        if (toIndex < 0 || toIndex >= this.items.length) return;
        const item = this.items.splice(fromIndex, 1)[0];
        this.items.splice(toIndex, 0, item);
        this.items.forEach((it, idx) => it.sortOrder = idx);
        this.render();
    }

    render() {
        if (!this.container) return;
        if (this.items.length === 0) {
            this.container.innerHTML = `
                <div class="col-12 text-center py-4 text-muted border border-dashed rounded-3">
                    <i class="bi bi-images fs-1 text-secondary opacity-50 mb-2 d-block"></i>
                    <p class="mb-0">No hay fotografías añadidas aún. ¡Selecciona varias fotos para tu galería!</p>
                </div>
            `;
            return;
        }

        this.container.innerHTML = this.items.map((item, index) => `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="gallery-preview-card card border-0 shadow-sm rounded-3 overflow-hidden position-relative group">
                    <img src="${item.imageUrl}" class="card-img-top object-fit-cover" style="height: 140px;" alt="Foto ${index + 1}">
                    <div class="gallery-card-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column justify-content-between p-2 bg-dark bg-opacity-50 opacity-0 transition">
                        <div class="d-flex justify-content-between">
                            <span class="badge bg-dark bg-opacity-75 text-white">#${index + 1}</span>
                            <button type="button" class="btn btn-sm btn-danger rounded-circle p-1 lh-1" onclick="window.galleryManager.removeItem(${index})" title="Eliminar">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                        <div class="d-flex justify-content-center gap-1">
                            <button type="button" class="btn btn-sm btn-light py-0 px-2" onclick="window.galleryManager.moveItem(${index}, ${index - 1})" ${index === 0 ? 'disabled' : ''} title="Mover a la izquierda">
                                <i class="bi bi-arrow-left"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-light py-0 px-2" onclick="window.galleryManager.moveItem(${index}, ${index + 1})" ${index === this.items.length - 1 ? 'disabled' : ''} title="Mover a la derecha">
                                <i class="bi bi-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Sube las imágenes pendientes a Supabase Storage y retorna la lista final
     */
    async uploadPending(invitationId, onProgress) {
        const finalGallery = [];
        const total = this.items.length;

        for (let i = 0; i < total; i++) {
            const item = this.items[i];
            if (item.file) {
                if (onProgress) onProgress(i + 1, total);
                const uploaded = await window.Storage.uploadImage(
                    window.CONFIG.BUCKETS.GALLERY,
                    item.file,
                    invitationId
                );
                finalGallery.push({
                    invitation_id: invitationId,
                    image_url: uploaded.publicUrl,
                    storage_path: uploaded.path,
                    sort_order: i
                });
            } else {
                finalGallery.push({
                    invitation_id: invitationId,
                    image_url: item.imageUrl,
                    storage_path: item.storagePath || '',
                    sort_order: i
                });
            }
        }
        return finalGallery;
    }
}

window.GalleryManager = GalleryManager;
