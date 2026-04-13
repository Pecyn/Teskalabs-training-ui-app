/** @type {import('jest').Config} */
module.exports = {
	testEnvironment: 'jsdom',
	transform: {
		'^.+\\.jsx?$': 'babel-jest',
	},
	transformIgnorePatterns: ['/node_modules/'],
};
