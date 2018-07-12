const del = require('del');
const gulp = require('gulp');
const zip = require('gulp-zip');
const install = require('gulp-install');
const sink = require('stream-sink');

const BUILD_DIR = 'temp/build';
const PACKAGE_NAME = 'o-daat.zip';
const PACKAGE_FILES = ['package.json', 'package-lock.json', 'src/main/**'];

gulp.task('clean', () => {
    return del([BUILD_DIR]);
});

gulp.task('build', ['clean'], () => {
    return gulp.src(PACKAGE_FILES)
        .pipe(gulp.dest(BUILD_DIR))
        .pipe(install({
            npm: '--only=production'
        }))
        .pipe(sink.object());
});

gulp.task('package', ['build'], () => {
    return gulp.src([BUILD_DIR + '/**', '!' + BUILD_DIR + '/' + PACKAGE_NAME])
        .pipe(zip(PACKAGE_NAME))
        .pipe(gulp.dest(BUILD_DIR));
});

gulp.task('watch', () => {
    let watchTimeout = null,
        watchBuildRunning = false,
        watcher = gulp.watch(PACKAGE_FILES, (event) => {
            if (!watchTimeout || watchBuildRunning) {
                watchTimeout = setTimeout(() => {
                    watchBuildRunning = true;
                    gulp.start('package', () => {
                        watchTimeout = null;
                        watchBuildRunning = false;
                    });
                }, 2000);
            }
        });
});