import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    define: {
        __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
    test: {
        environment: 'happy-dom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        coverage: {
            provider: 'istanbul',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
            ]
        }
    },
})
