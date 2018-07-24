//load dependencies
const del = require('del');
const gulp = require('gulp');
const zip = require('gulp-zip');
const install = require('gulp-install');
const sink = require('stream-sink');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

//load properties
const PROPERTIES_FILE = './properties/' + (process.env.PROPERTIES_FILE || 'local') + '.json';
const properties = require(PROPERTIES_FILE);

//set constants
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

gulp.task('upload', ['package'], () => {
    //ensure required properties
    if (!properties['s3-bucket'] || !properties['s3-bucket'].match(/^[a-z0-9\.\-]+$/)) {
        console.error(
            'A valid s3-bucket must be defined to upload the lambda package.  ' +
                'Please configure the "s3-bucket" property in "' + PROPERTIES_FILE + '".'
        );
        return;
    }

    //construct upload command
    let uploadCmdString = 'sam package --template-file template.yaml --output-template-file ' +
        BUILD_DIR + '/template.yaml --s3-bucket ' + properties['s3-bucket'];
    if (properties.profile && properties.profile.match(/^[a-zA-Z0-9\-]+$/)) {
        uploadCmdString += ' --profile ' + properties.profile;
    }

    //execute command
    let uploadCmd = exec(uploadCmdString);
    uploadCmd.then((value) => {
        console.log(value.stdout);
    }).catch((error) => {
        //do nothing
    });
    return uploadCmd;
});

gulp.task('deploy', ['upload'], () => {
    //ensure required properties
    if (!properties['stack-name'] || !properties['stack-name'].match(/^[a-zA-Z0-9\-]+$/)) {
        console.error(
            'A valid stack-name must be defined to deploy.  ' +
                'Please configure the "stack-name" property in "' + PROPERTIES_FILE + '".'
        );
        return;
    }

    //construct deploy command
    let deployCmdString = 'sam deploy --template-file ' + BUILD_DIR + '/template.yaml --stack-name ' +
        properties['stack-name'] + ' --capabilities CAPABILITY_IAM';
    if (properties.profile && properties.profile.match(/^[a-zA-Z0-9\-]+$/)) {
        deployCmdString += ' --profile ' + properties.profile;
    }

    //execute command
    let deployCmd = exec(deployCmdString);
    deployCmd.then((value) => {
        console.log(value.stdout);
    }).catch((error) => {
        //do nothing
    });
    return deployCmd;
});

gulp.task('watch', () => {
    let watchTimeout = null,
        watchBuildRunning = false,
        watcher = gulp.watch(PACKAGE_FILES, (event) => {
            //only queue up at most 1 build.
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

/*
Development Requirements:
    - Node v8.x.x
    - Git

Build Requirements:
    - [All Development Requirements]
    - Python
    - AWS SAM CLI

Local Testing Requirements:
    - [All Build Requirements]
    - Docker

Deployment Requirements:
    - [All Build Requirements]
    - Access Key ID and Secret Access Key for target AWS account.
    - AWS CLI installed and configured with appropriate Access Key ID and Secret Access Key.

Development Steps:
    - Ensure all development requirements have been met.
    - Clone repository.
    - Develop, commit and push changes.

Build Steps:
    - Ensure all build requirements have been met.
    - Clone repository or pull latest.
    - Run `npm install` from project root.
    - Run `gulp package` from project root. TODO: Should package task automatically run unit tests.
    - Find build Lambda package at 'temp/build/o-daat.zip'.

Local Testing Steps:
    - Ensure all local testing requirements have been met.
    - Perform build by following build steps.
    - Run `npm start` to start local testing container. TODO: Replace with native sam command or do something other than npm start script.
    - Optionally Run `gulp watch` to automatically build and update local env.
    - Test.

Deployment Steps:
    - Ensure all deployment requirements have been met.
    - Ensure target S3 bucket is created (e.g. aws s3 mb s3://<bucket> --profile <profile>).  This is required to deploy the lambda package.
    - Create new lambda package using `gulp package`.
    - Package and upload the SAM application using `gulp upload`.
    - Deploy SAM application using `gulp deploy`.
*/