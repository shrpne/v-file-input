import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: 'src/FileInput.vue',
            name: 'FileInput',
            formats: ['es', 'cjs', 'umd'],
            fileName: (format, entryName) => {
                const ext = {
                    es: 'esm.js',
                    cjs: 'cjs',
                    umd: 'js',
                };
                return `${pkg.name}.${ext[format]}`;
            },
        },
        rollupOptions: {
            external: ['vue'], // Keep Vue as a peer dependency
            output: {
                globals: { vue: 'Vue' },
            },
        },
    },
});
