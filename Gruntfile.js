'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        eslint: {
            target: ['*.js', 'lib/**/*.js', 'test/**/*.js'],
        },
        mochacli: {
            all: ['test/**/*.js'],
            options: {
                reporter: 'spec',
                ui: 'tdd'
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-eslint');

    // Configure tasks
    grunt.registerTask('default', ['test']);
    grunt.registerTask('test', ['mochacli', 'eslint']);
};
