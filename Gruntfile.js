/*
 * Gruntfile.js
 */

'use strict';

var path = require('path');

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Project configuration.
  grunt.initConfig({
    project: grunt.file.readJSON('project.json'),
    bower: {  // grunt-bower-hooks
      all: {
        rjsConfig: '<%= project.path.client %>/js/app.js'
      }
    },
    cdnify: {  // grunt-google-cdn
      dist: {
        html: ['<%= project.path.dist %>/*.html']
      }
    },
    clean: {  // grunt-contrib-clean
      dist: [
        '<%= project.path.temp %>',
        '<%= project.path.dist %>'
      ],
      server: [
        '<%= project.path.temp %>'
      ]
    },
    compass: {  // grunt-contrib-compass
      options: {
        sassDir: '<%= project.path.client %>/scss',
        cssDir: '<%= project.path.temp %>/css',
        imagesDir: '<%= project.path.client %>/img',
        javascriptsDir: '<%= project.path.client %>/js',
        fontsDir: '<%= project.path.client %>/fonts',
        importPath: '<%= project.path.bower %>',
        relativeAssets: true
      },
      dist: {},
      server: {
        options: {
          debugInfo: true
        }
      }
    },
    less: {
      server: {
        options: {
          paths: ['<%= project.path.client %>/less']
        },
        files: {
          '<%= project.path.temp %>/css/less.css': '<%= project.path.client %>/less/app.less'
        }
      },
      dist: {
        options: {
          paths: ['<%= project.path.client %>/less'],
          yuicompress: true
        },
        files: {
          '<%= project.path.temp %>/css/less.css': '<%= project.path.client %>/less/app.less'
        }
      }
    },
    copy: {  // grunt-contrib-copy
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= project.path.client %>',
          dest: '<%= project.path.dist %>',
          src: [
            '../<%= project.path.bower %>/**/*',
            'fonts/**/*',
            'tpl/**/*',
            '*.{ico,txt}'
          ]
        }]
      }
    },
    cssmin: {  // grunt-contrib-mincss
      dist: {
        files: {
          '<%= project.path.dist %>/css/app.css': [
            '<%= project.path.temp %>/css/{,*/}*.css',
            '<%= project.path.client %>/css/{,*/}*.css'
          ]
        }
      }
    },
    express: {  // grunt-express
      livereload: {
        options: {
          bases: [],
          debug: true,
          port: '<%= process.env.PORT || project.server.port %>',
          server: path.resolve('<%= project.path.server %>')
        }
      }
    },
    htmlmin: {  // grunt-contrib-htmlmin
      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.path.client %>',
          src: [
            '*.html',
            'tpl/*.html'
          ],
          dest: '<%= project.path.dist %>'
        }]
      }
    },
    imagemin: {  // grunt-contrib-imagemin
      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.path.client %>/img',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= project.path.dist %>/img'
        }]
      }
    },
    jshint: {  // grunt-contrib-jshint
      options: {
        jshintrc: '.jshintrc'
      },
      server: [
        '<%= project.path.client %>/js/{,*/}*.js',
        '!<%= project.path.client %>/js/vendor/**/*',
        '<%= project.path.server %>/**/*.js',
        '<%= project.path.test %>/server/**/*.js'
      ],
      all: [
        'Gruntfile.js',
        '<%= project.path.client %>/js/**/*.js',
        '!<%= project.path.client %>/js/vendor/**/*',
        '<%= project.path.server %>/**/*.js',
        '<%= project.path.test %>/client/**/*.js',
        '<%= project.path.test %>/server/**/*.js'
      ]
    },
    karma: {  // grunt-karma
      single: {
        configFile: '<%= project.path.config %>/karma.conf.js',
        singleRun: true
      },
      all: {
        configFile: '<%= project.path.config %>/karma.conf.js',
        singleRun: false
      }
    },
    ngmin: {  // grunt-ngmin
      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.path.dist %>/js',
          src: '*.js',
          dest: '<%= project.path.dist %>/js'
        }]
      }
    },
    open: {  // grunt-open
      server: {
        url: 'http://localhost:<%= process.env.PORT || project.server.port %>'
      }
    },
    uglify: {  // grunt-contrib-uglify
      dist: {
        files: {
          '<%= project.path.dist %>/js/app.js': [
            '<%= project.path.client %>/js/{,*/}*.js'
          ]
        }
      }
    },
    usemin: {  // grunt-usemin
      html: ['<%= project.path.dist %>/{,*/}*.html'],
      css: ['<%= project.path.dist %>/css/{,*/}*.css'],
      options: {
        dirs: ['<%= project.path.dist %>']
      }
    },
    useminPrepare: {  // grunt-usemin
      html: '<%= project.path.client %>/index.html',
      options: {
        dest: '<%= project.path.dist %>'
      }
    },
    watch: {  // grunt-regarde (task renamed from regarde to watch)
      compass: {
        files: ['<%= project.path.client %>/scss/{,*/}*.scss'],
        tasks: ['compass']
      },
      less: {
        files: ['<%= project.path.client %>/less/{,*/}*.less'],
        tasks: ['less:server']
      },
      livereload: {
        files: [
          '<%= project.path.client %>/**.html',
          '{<%= project.path.temp %>,<%= project.path.client %>}/css/**/*.css',
          '{<%= project.path.temp %>,<%= project.path.client %>}/js/**/*.js',
          '{<%= project.path.temp %>,<%= project.path.client %>}/tpl/**/*.html',
          '<%= project.path.client %>/img/{,*/}*.{png,jpg,jpeg}',
          '<%= project.path.server %>/partials/**/*.html',
          '<%= project.path.server %>/views/**/*.html'
        ],
        tasks: ['livereload']
      }
    }
  });

  grunt.renameTask('regarde', 'watch');

  grunt.registerTask('build', [
    'clean:dist',
    'compass:dist',
    'less:dist',
    'useminPrepare',
    'imagemin',
    'htmlmin',
    'concat',
    'cssmin',
    'copy',
    'cdnify',
    'usemin',
    'ngmin',
    'uglify'
  ]);

  grunt.registerTask('server', function () {
    process.env.LIVERELOAD = 35729;
    grunt.task.run([
      'jshint:server',
      'clean:server',
      'compass:server',
      'less:server',
      'livereload-start',
      'express',
      'open',
      'watch'
    ]);
  });

  grunt.registerTask('test', [
    'jshint:all',
    'karma:all'
  ]);

  // Shortcuts
  grunt.registerTask('b', 'default');
  grunt.registerTask('s', 'server');
  grunt.registerTask('t', 'test');

  grunt.registerTask('default', [
    'jshint:all',
    'karma:single',
    'build'
  ]);
};
