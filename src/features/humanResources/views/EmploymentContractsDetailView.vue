<template>
    <div class="row g-2 g-md-3">
        <div class="col-12 col-xxl-10 offset-xxl-1 col-xl-12">
            <BasePageHeader
                title="Detalle del Contrato"
                subtitle="Información detallada del contrato laboral"
                icon="fad fa-file-contract text-primary"
                :breadcrumbs="[{ label: 'Contratos', to: '/recursos-humanos/contratos-laborales/listas' }, { label: 'Detalle' }]"
                :show-back="true"
                @back="goBack"
            >
                <template #actions>
                    <button v-if="contract && can('employmentContracts.show')" class="btn btn-falcon-default btn-sm ms-2" type="button" @click="store.downloadPdf(contract.uuid)">
                        <i class="fad fa-file-pdf text-danger me-1"></i> Descargar PDF
                    </button>
                </template>
            </BasePageHeader>
            
            <div class="card border-0 shadow-sm mt-3" v-if="contract">
                <div class="card-body">
                    <h5 class="mb-4">Contrato: {{ contract.contract_type?.replace(/_/g, ' ') }}</h5>
                    <p><strong>Empleado:</strong> {{ employeeName }}
                        <span v-if="tp?.is_driver" class="badge bg-info bg-opacity-10 text-info ms-1">Conductor</span>
                        <span v-if="tp?.is_employee" class="badge bg-success bg-opacity-10 text-success ms-1">Empleado</span>
                    </p>
                    <p><strong>Documento:</strong> {{ tp?.document_number || '—' }}</p>
                    <p><strong>Salario Base:</strong> {{ contract.base_salary }}</p>
                    <p><strong>Fecha de Inicio:</strong> {{ contract.start_date }}</p>
                    <p><strong>Fecha de Fin:</strong> {{ contract.end_date || '—' }}</p>
                    <p><strong>Estado:</strong> {{ contract.status }}</p>
                </div>
            </div>
            
            <div class="text-center py-5" v-else-if="store.loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEmploymentContractsStore } from '../store/employmentContracts.store.js';
import BasePageHeader from '@/components/BasePageHeader.vue';

const route = useRoute();
const router = useRouter();
const store = useEmploymentContractsStore();
const contract = ref(null);

const tp = computed(() => contract.value?.third_party ?? contract.value?.thirdParty ?? null);
const employeeName = computed(() => {
    const t = tp.value;
    if (!t) return '—';
    return [t.first_name, t.last_name].filter(Boolean).join(' ') || t.trade_name || t.company_name || '—';
});

const goBack = () => router.push({ name: 'employmentContracts.list' });

onMounted(async () => {
    try {
        contract.value = await store.fetchProfileById(route.params.id);
    } catch (e) {
        goBack();
    }
});
</script>