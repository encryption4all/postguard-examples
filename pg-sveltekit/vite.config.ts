import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default defineConfig({
	resolve: {
		alias: {
			util: 'rollup-plugin-node-polyfills/polyfills/util',
			events: 'rollup-plugin-node-polyfills/polyfills/events',
			stream: 'rollup-plugin-node-polyfills/polyfills/stream',
			url: 'rollup-plugin-node-polyfills/polyfills/url',
			http: 'rollup-plugin-node-polyfills/polyfills/http',
			https: 'rollup-plugin-node-polyfills/polyfills/http',
			buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
			process: 'rollup-plugin-node-polyfills/polyfills/process-es6'
		}
	},
	optimizeDeps: {
		esbuildOptions: {
			define: {
				global: 'globalThis'
			},
			plugins: [
				NodeGlobalsPolyfillPlugin({
					process: true,
					buffer: true
				}),
				NodeModulesPolyfillPlugin()
			]
		}
	},
	build: {
		rollupOptions: {
			// @ts-ignore
			plugins: [nodePolyfills()]
		}
	},
	plugins: [sveltekit(), wasm(), topLevelAwait()]
});
