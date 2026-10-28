/**
 * Constantes y utilidades para los datos de la cédula en Terceros (issue #9).
 */

export const SEXOS = [
    { label: 'Masculino', value: 'M' },
    { label: 'Femenino', value: 'F' },
    { label: 'Otro', value: 'O' },
];

export const ESTADOS_CIVILES = [
    { label: 'Soltero/a', value: 'SOLTERO' },
    { label: 'Casado/a', value: 'CASADO' },
    { label: 'Unión libre', value: 'UNION_LIBRE' },
    { label: 'Separado/a', value: 'SEPARADO' },
    { label: 'Divorciado/a', value: 'DIVORCIADO' },
    { label: 'Viudo/a', value: 'VIUDO' },
];

export const GRUPOS_SANGUINEOS = [
    { label: 'A+', value: 'A+' },
    { label: 'A-', value: 'A-' },
    { label: 'B+', value: 'B+' },
    { label: 'B-', value: 'B-' },
    { label: 'O+', value: 'O+' },
    { label: 'O-', value: 'O-' },
    { label: 'AB+', value: 'AB+' },
    { label: 'AB-', value: 'AB-' },
];

export const MAPA_SEXO = Object.fromEntries(SEXOS.map((s) => [s.value, s.label]));
export const MAPA_ESTADO_CIVIL = Object.fromEntries(ESTADOS_CIVILES.map((e) => [e.value, e.label]));

export const CAMPOS_CEDULA = [
    'id_card_issue_place_uuid',
    'id_card_issue_date',
    'sex',
    'marital_status',
    'blood_type',
];
