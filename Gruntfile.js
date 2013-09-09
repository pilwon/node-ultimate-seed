/*
 * Gruntfile.js
 */

'use strict';

var path = require('path'),
    util = require('util');

var _ = require('lodash'),
    coffeeify = require('coffeeify'),
    hbsfy = require('hbsfy'),
    rfileify = require('rfileify'),
    uglify = require('uglify-js'),
    wrench = require('wrench');

var project = require('./project');

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);
  grunt.loadNpmTasks('intern');

  // Project configuration.
  grunt.initConfig({
    project: project,
    browserify2: {  // grunt-browserify2
      dev: {
        entry: './<%= project.path.client %>/js/index.js',
        compile: '<%= project.path.temp %>/js/main.js',
        debug: true,
        beforeHook: function (bundle) {
          bundle.transform(coffeeify);
          bundle.transform(hbsfy);
          bundle.transform(rfileify);
        }
      },
      dist: {
        entry: './<%= project.path.client %>/js/index.js',
        compile: '<%= project.path.dist %>/js/main.js',
        beforeHook: function (bundle) {
          bundle.transform(coffeeify);
          bundle.transform(hbsfy);
          bundle.transform(rfileify);
        },
        afterHook: function (source) {
          return uglify.minify(source, { fromString: true }).code;
        }
      }
    },
    cachebust: {
      dev: {
        files: {
          src: [
            '<%= project.path.temp %>/index.html'
          ]
        }
      },
      dist: {
        files: {
          src: [
            '<%= project.path.dist %>/index.html'
          ]
        }
      }
    },
    clean: {  // grunt-contrib-clean
      dev: [
        '<%= project.path.temp %>'
      ],
      dist: [
        '<%= project.path.dist %>'
      ]
    },
    copy: {  // grunt-contrib-copy
      dev: {
        files: [
          {
            expand: true,
            flatten: true,
            cwd: '<%= project.path.bower %>',
            dest: '<%= project.path.temp %>/js/vendor',
            src: [
              'es5-shim/es5-shim.js',
              'json3/lib/json3.js',
              'modernizr/modernizr.js'
            ]
          },
          {
            expand: true,
            cwd: '<%= project.path.client %>',
            dest: '<%= project.path.temp %>',
            src: [
              'index.html'
            ]
          }
        ]
      },
      dist: {
        files: [
          {
            expand: true,
            flatten: true,
            cwd: '<%= project.path.bower %>',
            dest: '<%= project.path.dist %>/js/vendor',
            src: [
              'es5-shim/es5-shim.js',
              'json3/lib/json3.js',
              'modernizr/modernizr.js'
            ]
          },
          {
            expand: true,
            cwd: '<%= project.path.client %>',
            dest: '<%= project.path.dist %>',
            src: [
              '../<%= project.path.bower %>/**/*',
              'fonts/**/*',
              '*.{ico,txt}'
            ]
          }
        ]
      }
    },
    cssmin: {  // grunt-contrib-cssmin
      options: {
        keepSpecialComments: 0
      },
      dist: {
        files: {
          '<%= project.path.dist %>/css/main.css': [
            '<%= project.path.temp %>/css/**/*.css',
            '<%= project.path.dist %>/css/**/*.css'
          ]
        }
      }
    },
    express: {  // grunt-express
      server: {
        options: {
          debug: true,
          livereload: project.server.livereload,
          port: '<%= process.env.PORT || project.server.port %>',
          server: path.resolve('<%= project.path.server %>')
        }
      }
    },
    html2js: {
      ng: {
        options: {
          base: '.',
          fileHeaderString: 'var angular = require(\'angular\');',
          indentString: '',
          module: 'ngApp.templates',  // no bundle module for all the html2js templates
          rename: function (moduleName) {
            var escapeRegExp = function (str) {
              return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
            };
            // Get rid of the prefix from the module name.
            var prefix = project.path.temp + '/tmpl';
            var regex = new RegExp('^' + escapeRegExp(prefix));
            return moduleName.replace(regex, '');
          }
        },
        files: [{
          src: ['<%= project.path.temp %>/tmpl/**/*.tmpl'],
          dest: '<%= project.path.client %>/js/templates.js'
        }],
      }
    },
    htmlmin: {  // grunt-contrib-htmlmin
      ng: {  // minify Angular templates
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: [{
          expand: true,
          cwd: '<%= project.path.client %>',
          src: [ '**/*.tmpl' ],
          dest: '<%= project.path.temp %>/tmpl'
        }]
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= project.path.client %>',
          src: [
            '*.html'
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
          src: '**/*.{png,jpg,gif}',
          dest: '<%= project.path.dist %>/img'
        }]
      }
    },
    intern: {  // intern
      client: {
        options: {
          config: 'test/intern'
        }
      },
      clientSuiteGet: {
        options: {
          config: 'test/intern',
          suites: ['test/lib/get']
        }
      },
      runner: {
        options: {
          config: 'test/intern',
          runType: 'runner'
        }
      }
    },
    jshint: {  // grunt-contrib-jshint
      options: {
        jshintrc: '.jshintrc'
      },
      client: [
        '<%= project.path.client %>/js/**/*.js',
        '!<%= project.path.client %>/js/node_modules/**/*.js',
        '<%= project.path.client %>/js/node_modules/*.js',
        '<%= project.path.client %>/node_modules/*.js',
      ],
      server: [
        '<%= project.path.server %>/**/*.js'
      ],
      grunt: [
        'Gruntfile.js'
      ]
    },
    less: {  // grunt-contrib-less
      dev: {
        options: {
          dumpLineNumbers: 'comments',
          paths: ['<%= project.path.client %>/less']
        },
        files: {
          '<%= project.path.temp %>/css/main.css': '<%= project.path.client %>/less/index.less'
        }
      },
      dist: {
        options: {
          paths: ['<%= project.path.client %>/less'],
          report: 'gzip',
          compress: true,
          yuicompress: true
        },
        files: {
          '<%= project.path.dist %>/css/main.css': '<%= project.path.client %>/less/index.less'
        }
      }
    },
    karma: {  // grunt-karma
      single: {
        configFile: '<%= project.path.config %>/karma-unit.conf.js',
        singleRun: true
      },
      multi: {
        configFile: '<%= project.path.config %>/karma-unit.conf.js',
        singleRun: false
      },
      e2e: {
        configFile: '<%= project.path.config %>/karma-e2e.conf.js',
        singleRun: true
      }
    },
    open: {  // grunt-open
      dev: {
        url: 'http://localhost:<%= process.env.PORT || project.server.port %>'
      }
    },
    uglify: {  // grunt-contrib-uglify
      // TODO: Figure out a way to specify sourceMap option to grunt-usemin.
      dist: {
        files: _.transform({
          paths: _.map([
            'es5-shim.js',
            'json3.js',
            'modernizr.js'
          ], function (path) {
            return project.path.dist + '/js/vendor/' + path;
          })
        }, function (result, files) {
          _.assign(result, _.object(files, files));
        })
      }
    },
    usemin: {  // grunt-usemin
      options: {
        dirs: ['<%= project.path.dist %>']
      },
      html: ['<%= project.path.dist %>/**/*.html'],
      css: ['<%= project.path.dist %>/css/**/*.css']
    },
    useminPrepare: {  // grunt-usemin
      options: {
        dest: '<%= project.path.dist %>'
      },
      html: '<%= project.path.client %>/index.html'
    },
    watch: {  // grunt-contrib-watch
      livereload: {
        options: {
          livereload: project.server.livereload
        },
        files: [
          '{<%= project.path.temp %>,<%= project.path.client %>}/{,*/}*.html',
          '!<%= project.path.client %>/index.html',
          '<%= project.path.client %>/fonts/{,*/}*',
          '<%= project.path.client %>/img/**/*',
          '<%= project.path.client %>/js/**/*.js',
          '<%= project.path.client %>/js/**/*.tmpl',
          '<%= project.path.server %>/views/{,*/}*.hbs'
        ]
      },
      html: {
        options: {
        },
        files: [
          '<%= project.path.client %>/index.html'
        ],
        tasks: [
          'copy:dev',
          'cachebust:dev'
        ]
      },
      css: {
        options: {
          livereload: project.server.livereload
        },
        files: ['<%= project.path.temp %>/css/{,*/}*.css']
      },
      less: {
        options: {
        },
        files: ['<%= project.path.client %>/less/{,*/}*.less'],
        tasks: ['less:dev']
      },
      js: {
        options: {
          livereload: project.server.livereload
        },
        files: [
          '<%= jshint.client %>',
          '<%= project.path.client %>/js/{components/**,handlebars/partials,modules/**}/*.hbs'
        ],
        tasks: ['browserify2:dev']
      }
    }
  });


  grunt.registerTask('devBuild', [
    'clean:dev',
    'browserify2:dev',
    'less:dev',
    'copy:dev',
    'devSymlink',
    'cachebust:dev'
  ]);

  grunt.registerTask('distBuild', [
    'jshint',
    'clean:dist',
    'htmlmin:ng',
    'html2js:ng',
    'browserify2:dist',
    'less:dist',
    'useminPrepare',
    'imagemin:dist',
    'htmlmin:dist',
    'cssmin:dist',
    'copy:dist',
    'distSymlink',
    'cachebust:dist',
    'usemin',
    'uglify:dist'
  ]);

  grunt.registerMultiTask('cachebust', function () {
    this.files.forEach(function (file) {
      file.src.filter(function (filepath) {
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function (filepath) {
        var hash = '' + new Date().getTime(),
            data = grunt.file.read(filepath, { encoding: 'utf-8' });
        grunt.util._.each({
          js: {
            src: /<script.+src=['"](?!http:|https:|\/\/)([^"']+)["']/gm,
            file: /src=['"]([^"']+)["']/m
          },
          css: {
            src: /<link.+href=["'](?!http:|https:|\/\/).*\.css("|\?.*")/gm,
            file: /href=['"]([^"']+)["']/m
          },
          images: {
            src: /<img[^\>]+src=['"](?!http:|https:|\/\/|data:image)([^"']+)["']/gm,
            file: /src=['"]([^"']+)["']/m
          }
        }, function (regex) {
          var matches = data.match(regex.src) || [];
          console.log(matches);
          matches.forEach(function (snippet) {
            snippet = snippet.substring(0, snippet.length - 1);
            data = data.replace(snippet, snippet.split('?')[0] + '?' + hash);
          });
        });
        grunt.file.write(filepath, data);
        grunt.log.writeln(filepath + ' was busted!');
        // Save hash to file so express server can use the value.
        var cachebustData = {};
        try {
          cachebustData = grunt.file.readJSON('.cachebust');
        } catch (e) {}
        cachebustData[filepath] = hash;
        grunt.file.write('.cachebust', JSON.stringify(cachebustData, null, 2));
      });
    });
  });

  grunt.registerTask('devSymlink', function () {
    ['fonts'].forEach(function (dir) {
      var symlinks = require(util.format('./%s/%s/.symlinks', project.path.client, dir));
      _.each(symlinks, function (source, target) {
        source = path.resolve(path.join(project.path.client, dir, source));
        target = path.resolve(path.join(project.path.temp, dir, target));
        wrench.mkdirSyncRecursive(path.join(project.path.temp, dir));
        wrench.copyDirSyncRecursive(source, target);
      });
      console.info('Resolved symlinks: %s', path.resolve(project.path.client, dir));
    });
  });

  grunt.registerTask('distSymlink', function () {
    ['fonts'].forEach(function (dir) {
      var symlinks = require(util.format('./%s/%s/.symlinks', project.path.client, dir));
      _.each(symlinks, function (source, target) {
        source = path.resolve(path.join(project.path.client, dir, source));
        target = path.resolve(path.join(project.path.dist, dir, target));
        wrench.mkdirSyncRecursive(path.join(project.path.dist, dir));
        wrench.copyDirSyncRecursive(source, target);
      });
      console.info('Resolved symlinks: %s', path.resolve(project.path.dist, dir));
    });
  });

  grunt.registerTask('devServer', function () {
    grunt.task.run([
      'express',
      'open'
    ]);
    if (process.env.NODE_ENV !== 'heroku' && process.env.NODE_ENV !== 'production') {
      grunt.task.run('watch');
    }
  });

  grunt.registerTask('test', [
    'jshint:all',
    'karma:multi'
  ]);

  grunt.registerTask('develop', ['devBuild', 'devServer']);

  grunt.registerTask('test', ['intern:client']);

  // Shortcuts
  grunt.registerTask('b', 'distBuild');
  grunt.registerTask('c', 'clean');
  grunt.registerTask('d', 'devBuild');
  grunt.registerTask('s', 'devServer');
  grunt.registerTask('t', 'test');

  // Default
  grunt.registerTask('default', 'develop');
};
