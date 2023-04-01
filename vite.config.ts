import {resolve} from 'path';
import dts from 'vite-plugin-dts';
import {defineConfig} from 'vitest/config';

export default defineConfig({
    plugins: [
        dts(),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'bloop-nfc-scanner',
            fileName: 'bloop-nfc-scanner',
        },
        sourcemap: true,
    },
    test: {
        environment: 'jsdom',
    },
});
