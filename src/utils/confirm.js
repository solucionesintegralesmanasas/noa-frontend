// Confirmaciones con SweetAlert2 cargado de forma diferida.
// Se usa `import()` para no sumar SweetAlert2 al arranque de la aplicación.
let SwalPromise = null;

/**
 * Obtiene la instancia de SweetAlert2 cargada de forma diferida.
 * @returns {Promise<any>}
 */
export async function getSwal() {
    if (!SwalPromise) {
        SwalPromise = import('sweetalert2').then(({ default: Swal }) => Swal);
    }
    return SwalPromise;
}

/**
 * Cierra cualquier modal de SweetAlert2 abierto actualmente.
 */
export async function closeSwal() {
    try {
        const Swal = await getSwal();
        Swal.close();
    } catch {
        // Ignorar si no está abierto
    }
}

/**
 * Muestra un modal de carga con spinner y sin cierre al hacer clic fuera.
 * @param {{title?: string, text?: string}} options
 * @returns {Promise<any>}
 */
export async function showLoadingModal({ title = 'Cargando...', text = 'Por favor espera...' } = {}) {
    const Swal = await getSwal();
    return Swal.fire({
        title,
        text,
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}

/**
 * Pregunta al usuario qué hacer con cambios sin guardar.
 * @returns {Promise<'save'|'discard'|'cancel'>}
 */
export async function confirmUnsavedChanges() {
    try {
        const Swal = await getSwal();
        const result = await Swal.fire({
            title: 'Tienes cambios sin guardar',
            text: 'Puedes guardarlos antes de continuar o salir sin guardar.',
            icon: 'warning',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Guardar y continuar',
            denyButtonText: 'Salir sin guardar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2c7be5',
            denyButtonColor: '#e63757',
            reverseButtons: true,
        });

        if (result.isConfirmed) return 'save';
        if (result.isDenied) return 'discard';
        return 'cancel';
    } catch {
        // Si SweetAlert2 no está disponible, no bloqueamos la navegación.
        return 'discard';
    }
}

/**
 * Confirmación genérica con SweetAlert2.
 * @param {{title: string, text?: string, confirmText?: string, icon?: string}} options
 * @returns {Promise<boolean>}
 */
export async function confirmAction({ title, text = '', confirmText = 'Sí, continuar', icon = 'question' }) {
    try {
        const Swal = await getSwal();
        const result = await Swal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2c7be5',
            cancelButtonColor: '#748194',
            reverseButtons: true,
            focusCancel: true,
        });

        return Boolean(result.isConfirmed);
    } catch {
        return window.confirm(`${title}\n\n${text}`);
    }
}

/**
 * Pregunta confirmación antes de cerrar la sesión activa.
 * @returns {Promise<boolean>} true si el usuario confirma el cierre de sesión
 */
export async function confirmLogout() {
    try {
        const Swal = await getSwal();
        const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro de que deseas salir de tu cuenta?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, salir',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#e63757',
            cancelButtonColor: '#748194',
            reverseButtons: true,
        });

        return Boolean(result.isConfirmed);
    } catch {
        // En caso de fallo o fallback, usar confirm nativo del navegador
        return window.confirm('¿Estás seguro de que deseas cerrar sesión?');
    }
}

/**
 * Muestra un modal de diálogo de SweetAlert2 importado de forma diferida.
 * @param {object} options
 * @returns {Promise<any>}
 */
export async function showSwalModal(options) {
    const Swal = await getSwal();
    return Swal.fire(options);
}
