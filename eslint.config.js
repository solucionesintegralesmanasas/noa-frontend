// eslint.config.js — Línea base permisiva (ARQ-016). Endurecer por fases.
// Uso: npm run lint (falla con errores; los avisos no bloquean).
import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'public/**', 'docs/**', 'scripts/**', 'android/**', 'ios/**'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Avisan sin bloquear: la limpieza total de console.* queda como deuda.
      // Lo nuevo debe usar `logger` (convención AGENTS.md).
      'no-console': 'warn',
      // Prohíbe imports directos de sweetalert2: lo nuevo usa `utils/toast.js`.
      // Los 2 usos con modal de carga se migran a PrimeVue Dialog aparte.
      'no-restricted-imports': ['warn', {
        paths: [{
          name: 'sweetalert2',
          message: 'Usa utils/toast.js en lugar de importar sweetalert2 directamente.',
        }],
      }],
      // Vistas de una palabra (HomeView, Menu...) son la convención del proyecto.
      'vue/multi-word-component-names': 'off',
      'vue/no-reserved-component-names': 'off',
      // args/catch no usados son ruido en este código (firmas de callbacks);
      // lo que sí se exige: sin imports ni variables muertas.
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
    },
  },
];
