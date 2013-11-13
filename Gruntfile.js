module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    clean: {
      tmp: ['_tmp']
    },

    uglify: {
      javascripts: {
        files: {
          'dist/batch.min.js': [
            'dist/batch.js'
          ]
        }
      }
    },

    coffee: {
      compile: {
        files: {
          'dist/batch.js': 'src/batch.coffee'
        },
        options: {
          bare: true
        }
      }
    },

    watch: {
      scripts: {
        files: ['src/**/**.js', 'src/**/**.coffee', 'test/**/**.js'],
        tasks: ['compile'],
        options: {
          atBegin: true
        }
      }
    },

    jshint: {
      all: 'dist/batch.js',
      options: {
        reporter: 'jslint',
        reporterOutput: '../javascriptslint.xml'
      }
    }

  });

  grunt.event.on('watch', function(action, filepath, target) {
    grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
  });

  grunt.registerTask('compile', ['clean', 'coffee']);
  grunt.registerTask('build', ['compile', 'uglify']);

};
