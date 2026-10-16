// vitest.config.js — Pruebas unitarias (ARQ-016 / §8 Calidad).
// Uso: npm run test:unit. Entorno por defecto `node`: los tests de componentes
// declaran `// @vitest-environment jsdom` en la primera línea y necesitan el
// plugin Vue para compilar los SFC.
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@store': path.resolve(__dirname, './src/store'),
            '@router': path.resolve(__dirname, './src/router'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@services': path.resolve(__dirname, './src/services'),
            '@components': path.resolve(__dirname, './src/components'),
            '@features': path.resolve(__dirname, './src/features'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@assets': path.resolve(__dirname, './src/assets'),
        },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.js'],
    },
});
