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

const dev = true;
//todo: turn it off on production server

gulp.task('clientBuild', function () {
    transformClientJs(dev);
});

livereload({start:true});
livereload.listen();



transformClientJs(dev);
gulp.watch(['./web/js/*.js', './web/js/*/*.js', '!./web/js/libs/*/*.js', './web/js/*/*/*.js', '!./web/js/app.compiled.js'], ['clientBuild']);





function transformClientJs(dev = false) {
    if (dev === true) {
        //todo: mb make here something for developing (don't load all staff like es2015 - it's already in browser)
        //or mb it's really better to test all that crazy staff with polyfill - because that's how it will work on prod
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
            //uglify breaks sourcemaps
            // .pipe(uglify())
            .pipe(sourcemaps.write('./'))
            .pipe(gulp.dest('./web/js/'))
            .pipe(livereload());
    } else {
        browserify({entries: './web/js/app.js'})
            .transform("babelify", { presets: ["latest"]})
            .bundle()
            .on('error', (err) => {
                console.log(err.toString());
                this.emit('end')
            })
            .pipe(source('./app.compiled.js'))
            .pipe(buffer())
            .pipe(uglify())
            .pipe(gulp.dest('./web/js/'))
            .pipe(livereload());
    }
}

/*




//server side babel
var babel = require('gulp-babel');
var rename = require('gulp-rename');

gulp.src('web/js/Model/Parse/yandex.js')
    .pipe(babel())
    .pipe(rename('yandex.compiled.js'))
    .pipe(gulp.dest('web/js/Model/Parse'));


gulp.src('web/js/Model/Parse/google.js')
    .pipe(babel())
    .pipe(rename('google.compiled.js'))
    .pipe(gulp.dest('web/js/Model/Parse'));


*/
