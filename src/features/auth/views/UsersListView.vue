<template>
    <BasePageHeader
        title="Gestión de Usuarios"
        description="Administra los usuarios del sistema y sus roles de acceso."
        icon="fad fa-users text-primary"
        :show-refresh="true"
        :loading="store.loading"
        :breadcrumbs="[{ label: 'Seguridad' }, { label: 'Usuarios' }]"
        @refresh="store.fetchItems()"
    />

    <!-- LISTADO: toolbar + tabla + paginador en una sola tarjeta -->
    <div class="card border-0 shadow-sm noa-list-card fade-in-up" style="animation-delay: 0.1s;">
        <div class="noa-list-toolbar">
            <div class="noa-search">
                <i class="fal fa-search noa-search__icon" aria-hidden="true" />
                <input id="f-users-busqueda" v-model="searchQuery" class="noa-search__input" type="search"
                    placeholder="Buscar por nombre o email..." aria-label="Buscar usuario" @input="onSearchInput" />
                <button v-if="searchQuery" class="noa-search__clear" type="button"
                    title="Limpiar búsqueda" aria-label="Limpiar búsqueda" @click="clearSearch">
                    <i class="fal fa-times" aria-hidden="true" />
                </button>
            </div>

            <span v-if="!isViewLoading && !store.loading" class="noa-results">
                <i class="fas fa-filter" aria-hidden="true" />
                {{ store.pagination.totalItems }} usuario{{ store.pagination.totalItems !== 1 ? 's' : '' }}
                <template v-if="store.search"> para "{{ store.search }}"</template>
            </span>
        </div>

        <!-- SKELETON -->
        <div v-if="isViewLoading" class="card-body p-0">
            <div class="table-responsive scrollbar">
                <table class="table table-sm mb-0">
                    <thead>
                        <tr>
                            <th v-for="w in ['40%', '35%', '12%', '13%']" :key="w" style="padding:12px 8px">
                                <div class="skeleton-text" :style="`height:16px;width:${w}`" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="n in store.pagination.itemsPerPage" :key="`sk-${n}`">
                            <td><div class="skeleton-text" style="height:18px;width:75%" /></td>
                            <td><div class="skeleton-text" style="height:18px;width:60%" /></td>
                            <td><div class="skeleton-badge mx-auto" style="height:20px;width:60px" /></td>
                            <td>
                                <div class="d-flex justify-content-end gap-1">
                                    <div v-for="i in 2" :key="i" class="skeleton-icon" style="height:28px;width:28px" />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- DATATABLE (Paginación Server-Side) -->
        <div v-else class="card-body p-0">
            <div class="table-responsive scrollbar">
                <DataTable :value="store.items" lazy :paginator="false" :rows="store.pagination.itemsPerPage"
                    :totalRecords="store.pagination.totalItems"
                    :first="(store.pagination.currentPage - 1) * store.pagination.itemsPerPage"
                    :loading="store.loading" responsiveLayout="scroll" tableStyle="min-width: 48rem"
                    class="table table-sm mb-0 professional-table noa-table-fixed"
                    emptyMessage="No se encontraron usuarios"
                    :sortField="store.sortField" :sortOrder="store.sortOrder" @sort="handleSort">
                    <Column field="email" header="Correo" sortable style="width: 40%;">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center gap-2">
                                <i class="fad fa-envelope text-primary" style="font-size:13px" aria-hidden="true" />
                                <span class="text-dark text-break fw-medium" :title="data.email" style="font-size:.85rem">{{ data.email || '—' }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column header="Rol" style="width: 35%;">
                        <template #body="{ data }">
                            <div v-if="!data.roles || data.roles.length === 0" class="text-muted small">
                                <i class="fad fa-ban me-1" aria-hidden="true" />Sin rol asignado
                            </div>
                            <div v-else class="d-flex flex-wrap gap-1">
                                <span v-for="role in data.roles" :key="role" class="badge rounded-pill d-inline-flex align-items-center gap-1 role-badge" :class="roleBadgeClass(role)" style="font-size:.72rem;padding: .4em .65em;">
                                    <i :class="roleIcon(role)" style="font-size:.7rem" aria-hidden="true" />
                                    {{ role }}
                                    <button v-if="puedeGestionarUsuario(data)" type="button" class="btn-close btn-close-white ms-1" style="font-size:.55rem;width:.7em;height:.7em;opacity:.8" title="Quitar rol" :aria-label="`Quitar rol ${role}`" @click="confirmRemoveRole(data, role)" />
                                </span>
                            </div>
                        </template>
                    </Column>
                    <Column field="status" header="Estado" sortable class="text-center" header-class="text-center" style="width: 12%;">
                        <template #body="{ data }">
                            <span class="noa-status" :class="data.status ? 'noa-status--success' : 'noa-status--muted'">
                                {{ data.status ? 'Activo' : 'Inactivo' }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Acciones" class="noa-col-actions" header-class="noa-col-actions" style="width: 13%;">
                        <template #body="{ data }">
                            <RowActions :actions="accionesDe(data)" :row-label="data.name || data.email || 'usuario'" />
                        </template>
                    </Column>
                    <!-- Empty state -->
                    <template #empty>
                        <div class="text-center py-5">
                            <i class="fad fa-users fs-1 text-muted opacity-50 mb-3 d-block" aria-hidden="true" />
                            <h6 class="text-muted mb-1 fw-medium">No se encontraron usuarios</h6>
                            <p class="text-muted small mb-0">No hay usuarios registrados con los criterios actuales</p>
                        </div>
                    </template>
                    <template #loading>
                        <NoaTableSpinner message="Cargando usuarios..." />
                    </template>
                </DataTable>
            </div>
            <ListPagination :page="store.pagination.currentPage" :per-page="store.pagination.itemsPerPage"
                :total="store.pagination.totalItems" :rows-options="[10, 15, 25, 50]" @change="onPageChange" />
        </div>
    </div>

    <!-- Modal edición de roles -->
    <div class="modal fade" id="userRolesModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header" style="background: linear-gradient(135deg,#0f172a 0%,#1e293b 100%);">
                    <h6 class="modal-title text-white fw-bold"><i class="fad fa-user-shield me-2" aria-hidden="true" />Editar roles de {{ editingUser?.name || editingUser?.email || 'usuario' }}</h6>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar modal" />
                </div>
                <div class="modal-body">
                    <p class="text-muted small mb-2">Selecciona los roles que debe conservar el usuario. Al guardar se sincronizan exactamente los seleccionados (los no marcados se quitan).</p>
                    <div v-if="store.rolesCatalog.length === 0" class="alert alert-warning py-2 small">No se pudo cargar el catálogo de roles.</div>
                    <div class="d-flex flex-column gap-2" style="max-height: 320px; overflow-y: auto;">
                        <label v-for="r in availableRoles" :key="r.name" :for="`f-role-${r.name}`" class="d-flex align-items-center gap-2 p-2 border rounded" :class="editRoles.includes(r.name) ? 'bg-primary bg-opacity-10 border-primary' : 'bg-light'">
                            <input :id="`f-role-${r.name}`" type="checkbox" class="form-check-input m-0" :value="r.name" v-model="editRoles" />
                            <span class="fw-medium" style="font-size:.85rem">{{ r.name }}</span>
                            <small class="text-muted ms-auto" style="font-size:.75rem">{{ r.description || '' }}</small>
                        </label>
                    </div>
                    <div class="mt-3 d-flex flex-wrap gap-1">
                        <span class="small text-muted me-2">Roles actuales:</span>
                        <span v-for="role in editingUser?.roles || []" :key="role" class="badge bg-secondary" style="font-size:.7rem">{{ role }}</span>
                    </div>
                </div>
                <div class="modal-footer bg-light border-top-0">
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary btn-sm" :disabled="saving" @click="saveRoles">
                        <i v-if="saving" class="fas fa-spinner fa-spin me-1" aria-hidden="true" />{{ saving ? 'Guardando...' : 'Guardar roles' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useServerSort } from '@/hooks/useServerSort.js';
import { useUsersStore } from '../store/users.store.js';
import { usePermissionsStore } from '@store';
import { rolesVisibles, usuarioTieneRolReservado } from '../utils/rolesPrivilegiados.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import NoaTableSpinner from '@/components/NoaTableSpinner.vue';
import RowActions from '@/components/RowActions.vue';
import ListPagination from '@/components/ListPagination.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { confirmAction } from '@/utils/confirm.js';
import { toast } from '@/utils/toast.js';

const route = useRoute();
const router = useRouter();
const store = useUsersStore();
const permissionsStore = usePermissionsStore();
const { handleSort } = useServerSort((field, order) => store.setSort(field, order), { route, router });

// Los roles reservados (SUPERADMIN, ADMIN_EMPRESA) solo se muestran a un SUPERADMIN.
const esSuperadmin = computed(() => permissionsStore.hasRole('SUPERADMIN'));
const puedeGestionarUsuario = (user) => esSuperadmin.value || !usuarioTieneRolReservado(user?.roles);

const isViewLoading = ref(true);
const searchQuery = ref('');
const saving = ref(false);
const editingUser = ref(null);
const editRoles = ref([]);

let modalInstance = null;
const availableRoles = computed(() => {
    const cats = store.rolesCatalog;
    // Normalizar: puede venir como [{name, ...}] o {data:[...]}
    const list = Array.isArray(cats) ? cats : (cats?.data ?? []);
    return rolesVisibles(list, esSuperadmin.value)
        .map(r => ({ name: r.name, description: r.description || '' }))
        .filter(r => r.name);
});

const roleBadgeClass = (role) => {
    const map = { SUPERADMIN: 'bg-dark', ADMIN_EMPRESA: 'bg-primary', EMPLEADO: 'bg-info text-dark', AFILIADO: 'bg-success', CONDUCTOR: 'bg-warning text-dark' };
    return map[role] || 'bg-secondary';
};
const roleIcon = (role) => {
    const map = { SUPERADMIN: 'fad fa-crown', ADMIN_EMPRESA: 'fad fa-building', EMPLEADO: 'fad fa-briefcase', AFILIADO: 'fad fa-handshake', CONDUCTOR: 'fad fa-steering-wheel' };
    return map[role] || 'fad fa-shield-alt';
};

let searchTimer = null;
const onSearchInput = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => store.setSearch(searchQuery.value), 350);
};
const clearSearch = () => { searchQuery.value = ''; store.clearSearch(); };

const onPageChange = async ({ page, first, rows }) => {
    store.pagination.itemsPerPage = rows;
    const targetPage = page !== undefined ? page : Math.floor(first / rows) + 1;
    await store.setPage(targetPage);
};

const goProfile = (user) => {
    // Si tiene tercero vinculado, ir a perfil de tercero; si no, mostrar info
    if (user.third_party_uuid) router.push(`/terceros/perfil/${user.third_party_uuid}`);
    else toast('Info', `UUID usuario: ${user.uuid}`, 'info');
};

const confirmRemoveRole = async (user, role) => {
    const ok = await confirmAction({
        title: `¿Quitar rol "${role}"?`,
        text: `Se quitará el rol "${role}" al usuario "${user.name || user.email}". Esta acción es reversible asignándolo de nuevo.`,
        confirmText: 'Sí, quitar',
        icon: 'warning',
    });
    if (!ok) return;
    try {
        await store.removeRole(user.uuid, role);
    } catch (e) {
        // Error ya toastado por el store
    }
};

const openRolesModal = (user) => {
    editingUser.value = user;
    editRoles.value = [...(user.roles || [])];
    // Bootstrap modal
    const el = document.getElementById('userRolesModal');
    if (window.bootstrap?.Modal) {
        modalInstance = window.bootstrap.Modal.getOrCreateInstance(el);
        modalInstance.show();
    } else {
        // Fallback: mostrar con clase
        el.classList.add('show');
        el.style.display = 'block';
    }
};

const saveRoles = async () => {
    if (!editingUser.value) return;
    saving.value = true;
    try {
        await store.syncRoles(editingUser.value.uuid, [...editRoles.value]);
        if (modalInstance) modalInstance.hide();
        else document.getElementById('userRolesModal').style.display = 'none';
    } finally {
        saving.value = false;
    }
};

const accionesDe = (data) => [
    {
        key: 'ver',
        label: 'Ver perfil',
        icon: 'far fa-eye',
        tone: 'primary',
        inline: true,
        visible: true,
        onClick: () => goProfile(data),
    },
    {
        key: 'roles',
        label: 'Editar roles',
        icon: 'far fa-user-shield',
        tone: 'warning',
        inline: true,
        visible: puedeGestionarUsuario(data),
        onClick: () => openRolesModal(data),
    },
];

onMounted(async () => {
    if (route.query.sort) {
        store.sortField = String(route.query.sort);
        store.sortOrder = route.query.order === 'desc' ? -1 : 1;
    }
    isViewLoading.value = true;
    try {
        await Promise.all([store.fetchItems(), store.fetchRolesCatalog()]);
    } finally {
        isViewLoading.value = false;
    }
});
</script>

<style scoped>
.badge .btn-close { filter: brightness(0) invert(1); }
.role-badge { transition: transform .15s ease, box-shadow .15s ease; }
.role-badge:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0, 0, 0, .1); }
.skeleton-text, .skeleton-badge, .skeleton-icon { background: #e9ecef; border-radius: 4px; animation: pulse 1.2s infinite; }
.skeleton-badge { border-radius: 999px; }
.skeleton-icon { border-radius: .25rem; }
.text-break { word-break: break-word; overflow-wrap: break-word; }
.scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.scrollbar::-webkit-scrollbar-track { background: #f1f3f5; border-radius: 3px; }
.scrollbar::-webkit-scrollbar-thumb { background: #adb5bd; border-radius: 3px; }

@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
</style>
