import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
	{
		files: ['src/**/*.js'],
		languageOptions: { globals: globals.browser }
	},
	pluginJs.configs.recommended
];
