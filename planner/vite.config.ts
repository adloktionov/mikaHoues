import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({ plugins: [vue()], optimizeDeps: { include: ['three/addons/utils/SkeletonUtils.js','three/addons/exporters/GLTFExporter.js'] }, build: { target: 'es2020' }, worker: { format: 'es' } });
