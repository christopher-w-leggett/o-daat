const del = require('del');
const gulp = require('gulp');
const zip = require('gulp-zip');
const install = require('gulp-install');
const sink = require('stream-sink');

const BUILD_DIR = 'temp/build';
const PACKAGE_NAME = 'o-daat.zip';

gulp.task('clean', () => {
    console.log('start clean');
    return del([
        'temp/build'
    ]);
});

gulp.task('build', ['clean'], () => {
    console.log('start build');
    return gulp.src(['package.json', 'package-lock.json', 'src/main/**'])
        .pipe(gulp.dest(BUILD_DIR))
        .pipe(install({
            npm: '--only=production'
        }))
        .pipe(sink.object());
});

gulp.task('package', ['build'], () => {
    console.log('start package');
    return gulp.src([BUILD_DIR + '/**', '!' + BUILD_DIR + '/' + PACKAGE_NAME])
        .pipe(zip(PACKAGE_NAME))
        .pipe(gulp.dest(BUILD_DIR));
});