/**
 * Hook para gestionar Select2 en formularios Vue.
 * Encapsula: inicialización, sincronización de valores y destrucción.
 *
 * Ubicación: src/hooks/useSelect2.js
 */
import $ from 'jquery';
import 'select2';

/**
 * Reads a value from an object by dot-notation path (e.g. 'contractor.document_type_uuid').
 * @param {object} obj
 * @param {string} field
 * @returns {*}
 */
const getNestedValue = (obj, field) => {
    return field.split('.').reduce((o, key) => o?.[key], obj);
};

/**
 * Sets a value in an object by dot-notation path.
 * @param {object} obj
 * @param {string} field
 * @param {*} value
 */
const setNestedValue = (obj, field, value) => {
    const keys = field.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, key) => o?.[key], obj);
    if (target != null && last) target[last] = value;
};

/**
 * @param {object} formData         - Reactive form data object
 * @param {object} validationErrors - Reactive validation errors object
 */
export function useSelect2(formData, validationErrors) {

    /**
     * Aplica clases de validación visual al contenedor Select2.
     *
     * @param {object} selectRef  - ref del elemento <select>
     * @param {string} field      - Nombre del campo en formData (dot-notation soportado)
     */
    const applyValidation = (selectRef, field) => {
        if (!selectRef?.value || !field) return;
        const $container = $(selectRef.value).next('.select2-container');
        $container.removeClass('is-invalid-select2 is-valid-select2');
        if (validationErrors?.[field]) {
            $container.addClass('is-invalid-select2');
        } else if (formData && getNestedValue(formData, field)) {
            $container.addClass('is-valid-select2');
        }
    };

    /**
     * Inicializa todos los Select2 del formulario.
     *
     * @param {Array} configs  - Array de { ref, field, placeholder, options? }
     */
    const initSelect2 = (configs) => {
        if (!Array.isArray(configs)) return;
        configs.forEach(({ ref, field, placeholder, options = {} }) => {
            if (!ref?.value) return;
            const $el = $(ref.value);
            if ($el.data('select2')) $el.select2('destroy');

            $el.select2({
                placeholder: placeholder || 'Seleccionar',
                allowClear: true,
                width: '100%',
                ...options,
            }).on('select2:select select2:unselect', (e) => {
                const val = $(e.target).val() || (options?.multiple ? [] : '');
                if (formData && field) setNestedValue(formData, field, val);
                if (validationErrors && field) delete validationErrors[field];
                applyValidation(ref, field);
            });
        });
    };

    /**
     * Sincroniza los valores actuales de formData en los Select2 (necesario en edición).
     *
     * @param {Array} configs  - Mismo array de configs que se pasó a initSelect2
     */
    const setValues = (configs) => {
        if (!Array.isArray(configs)) return;
        setTimeout(() => {
            if (!Array.isArray(configs)) return;
            configs.forEach(({ ref, field }) => {
                if (ref?.value && formData && field) {
                    const val = getNestedValue(formData, field);
                    $(ref.value).val(Array.isArray(val) ? [...val] : (val?.toString() ?? '')).trigger('change');
                }
            });
        }, 100);
    };

    /**
     * Sincroniza formData desde los Select2 (llamar antes de validar/submit).
     *
     * @param {Array} configs
     */
    const syncFromSelect2 = (configs) => {
        if (!Array.isArray(configs)) return;
        configs.forEach(({ ref, field }) => {
            if (ref?.value && formData && field) {
                setNestedValue(formData, field, $(ref.value).val() || '');
            }
        });
    };

    /**
     * Destruye todos los Select2 (llamar en onUnmounted).
     *
     * @param {Array} configs
     */
    const destroySelect2 = (configs) => {
        if (!Array.isArray(configs)) return;
        configs.forEach(({ ref }) => {
            if (ref?.value && $(ref.value).data('select2')) {
                $(ref.value).select2('destroy');
            }
        });
    };

    /**
     * Aplica validación visual a todos los selects del formulario.
     *
     * @param {Array} configs
     */
    const applyAllValidations = (configs) => {
        if (!Array.isArray(configs)) return;
        configs.forEach(({ ref, field }) => applyValidation(ref, field));
    };

    return { initSelect2, setValues, syncFromSelect2, destroySelect2, applyValidation, applyAllValidations };
}