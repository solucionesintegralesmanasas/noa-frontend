/**
 * Hook para manejar estados de formularios.
 * Ubicación: src/hooks/useForm.js
 */
import { ref, reactive } from 'vue';

export function useForm(initialData = {}) {
    const formData = reactive({ ...initialData });
    const errors = ref({});
    const isSubmitting = ref(false);

    const reset = () => {
        Object.keys(formData).forEach(key => formData[key] = initialData[key] || null);
        errors.value = {};
    };

    return { formData, errors, isSubmitting, reset };
}