/**
 * Created by uadn-gav on 1/27/17.
 */
var gulp        = require('gulp');

var browserify  = require('browserify');
var babelify    = require('babelify');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var uglify      = require('gulp-uglify');
var sourcemaps  = require('gulp-sourcemaps');
var livereload  = require('gulp-livereload');



gulp.task('build', function () {

    browserify({entries: './web/js/app.js', debug: true})
        .transform("babelify", { presets: ["latest"] , sourceMaps: true})
        .bundle()
        .on('error', (err) => {
            console.log(err.toString());
            this.emit('end')
        })
        .pipe(source('./app.compiled.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({
            loadMaps:true
        }))
        //uglify breaks sourcemaps todo: turn on prod
        // .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./web/js/'))
        .pipe(livereload())
});

livereload({start:true});
livereload.listen();


gulp.watch(['./web/js/*.js', './web/js/*/*.js', './web/js/*/*/*.js', '!./web/js/app.compiled.js'], ['build']);
