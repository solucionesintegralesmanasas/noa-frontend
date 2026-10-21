<template>
    <div class="row gx-3">
        <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">
            <BasePageHeader :title="pageTitle" :subtitle="pageSubtitle" icon="fad fa-gas-pump text-primary"
                :breadcrumbs="breadcrumbs" :show-back="true" @back="goBack" />

            <div v-if="isViewLoading" class="card border-0 shadow-sm">
                <div class="card-body text-center py-5">
                    <span class="spinner-border text-primary" role="status" aria-hidden="true"></span>
                    <p class="mt-3 mb-0 text-muted">Cargando formulario...</p>
                </div>
            </div>

            <FuelLogForm v-else :fuel-log="editingItem" :is-edit="isEditMode"
                @saved="onSaved" @cancel="goBack" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useFuelManagementStore } from '../store/fuelManagement.store.js';
import BasePageHeader from '@/components/BasePageHeader.vue';
import FuelLogForm from '../components/FuelLogForm.vue';

const route = useRoute();
const router = useRouter();
const store = useFuelManagementStore();

const isViewLoading = ref(true);
const editingItem = ref(null);

const isEditMode = computed(() => route.params.id !== undefined);
const pageTitle = computed(() => (isEditMode.value ? 'Editar Registro de Combustible' : 'Nuevo Registro de Combustible'));
const pageSubtitle = computed(() => (isEditMode.value
    ? 'Modifica los datos del surtimiento'
    : 'Registra kilometraje, tanqueo y saldos del vehículo'));
const breadcrumbs = computed(() => [
    { label: 'Combustible', to: '/flota/combustible' },
    { label: isEditMode.value ? 'Editar' : 'Nuevo' },
]);

const goBack = () => router.push('/flota/combustible');
const onSaved = () => goBack();

onMounted(async () => {
    try {
        await store.loadFormOptions();
        if (isEditMode.value) {
            editingItem.value = await store.fetchProfileById(route.params.id);
        }
    } finally {
        isViewLoading.value = false;
    }
});
</script>
