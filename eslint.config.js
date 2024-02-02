import globals from "globals";
import tsParser from '@typescript-eslint/parser';

import js from '@eslint/js';

import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import stylisticPlugin from '@stylistic/eslint-plugin';
import stylisticPluginMigrate from '@stylistic/eslint-plugin-migrate';

export default [
	{
		ignores: [
			'**/node_modules/',
			'**/.git/',
			'**/.dfx/',
			'**/.mops/',
			'**/backend/',
			'**/declarations/',
			'**/build/',
			'**/docs/',
			'**/dist/',
		],
	},
	{
		...js.configs.recommended,
		files: [
			'**/*.ts',
		],
		plugins: {
			'@typescript-eslint': typescriptPlugin,
			'@stylistic': stylisticPlugin,
			'@stylistic/migrate': stylisticPluginMigrate,
		},
		languageOptions: {
			parser: tsParser
		},
		rules: {
			'@stylistic/type-annotation-spacing': [
				'error',
				{
					'before': true,
					'after': true
				}
			],
			'@stylistic/comma-dangle': [
				'error',
				{
					'arrays': 'always-multiline',
					'objects': 'always-multiline',
					'imports': 'always-multiline',
					'exports': 'always-multiline',
					'functions': 'ignore'
				}
			],
			'indent': [
				'error',
				'tab'
			],
			'linebreak-style': [
				'error',
				'unix'
			],
			'quotes': [
				'error',
				'single'
			],
			'semi': [
				'error',
				'always'
			],
			'curly': [
				'error',
				'all'
			],
			'object-curly-spacing': [
				'error',
				'never'
			],
			'brace-style': [
				'error',
				'stroustrup'
			],
			'space-in-parens': [
				'error',
				'never'
			],
			'prefer-const': 'off',
			'@typescript-eslint/ban-ts-comment': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'space-before-blocks': [
				'error',
				'always'
			],
			'no-empty': [
				'error',
				{
					'allowEmptyCatch': true
				}
			],
			'arrow-spacing': [
				'error',
				{
					'before': true,
					'after': true
				}
			],
			'keyword-spacing': [
				'error',
				{
					'before': true,
					'after': true
				}
			],
			// 'no-unused-vars': [
			// 	'error',
			// 	{
			// 		'argsIgnorePattern': '^_',
			// 		'destructuredArrayIgnorePattern': '^_'
			// 	}
			// ],
			// '@typescript-eslint/no-unused-vars': [
			// 	'error',
			// 	{
			// 		'argsIgnorePattern': '^_',
			// 		'destructuredArrayIgnorePattern': '^_'
			// 	}
			// ]
		}
	},
	{
		files: [
			'cli/**/*.ts',
		],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
		rules: {
			'no-undef': 'error',
		}
	},
	{
		files: [
			'frontend/**/*.ts',
		],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			'no-undef': 'error',
		}
	},
];