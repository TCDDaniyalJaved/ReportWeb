const gulp = require('gulp');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');
const terser = require('gulp-terser');
const log = require('fancy-log'); // Optional: better logging

// --------------------------
// 1. CSS Files List
// --------------------------
const vendorCSS = [
    'wwwroot/vendor/libs/dropzone/dropzone.dist.css',
    'wwwroot/vendor/libs/flatpickr/flatpickr.dist.css',
    'wwwroot/vendor/libs/datatables-bs5/datatables.bootstrap5.dist.css',
    'wwwroot/vendor/libs/datatables-responsive-bs5/responsive.bootstrap5.dist.css',
    'wwwroot/vendor/libs/datatables-buttons-bs5/buttons.bootstrap5.dist.css',
    'wwwroot/vendor/libs/sweetalert2/sweetalert2.dist.css',
    'wwwroot/vendor/libs/@form-validation/form-validation.dist.css',
    'wwwroot/vendor/libs/bs-stepper/bs-stepper.dist.css',
    'wwwroot/vendor/libs/select2/select2.dist.css',
];

// --------------------------
// 2. JS Files List (ORDER IMPORTANT!)
// --------------------------
const vendorJS = [
    'wwwroot/vendor/libs/jquery/jquery.min.js',
    'wwwroot/vendor/libs/moment/moment.dist.js',
    'wwwroot/vendor/libs/datatables-bs5/datatables-bootstrap5.dist.js',
    'wwwroot/vendor/libs/sweetalert2/sweetalert2.dist.js',
    'wwwroot/vendor/libs/@form-validation/popular.dist.js',
    'wwwroot/vendor/libs/@form-validation/bootstrap5.dist.js',
    'wwwroot/vendor/libs/@form-validation/auto-focus.dist.js',
    'wwwroot/vendor/libs/cleavejs/cleave.dist.js',
    'wwwroot/vendor/libs/cleavejs/cleave-phone.dist.js',
    'wwwroot/lib/bootstrap/dist/js/bootstrap.bundle.min.js',
    'wwwroot/vendor/libs/bs-stepper/bs-stepper.dist.js',
    'wwwroot/vendor/libs/select2/select2.dist.js',
];

// --------------------------
// 3. Helper Function: log missing files
// --------------------------
function checkFiles(files) {
    const fs = require('fs');
    files.forEach(file => {
        if (!fs.existsSync(file)) {
            log.warn(`File not found: ${file}`);
        }
    });
}

// --------------------------
// 4. CSS Tasks
// --------------------------
gulp.task('bundle-css', () => {
    checkFiles(vendorCSS); // optional: warns about missing files
    return gulp.src(vendorCSS, { allowEmpty: true })
        .pipe(concat('vendors.min.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest('wwwroot/dist'));
});

// --------------------------
// 5. JS Tasks
// --------------------------
gulp.task('bundle-js', () => {
    checkFiles(vendorJS); // optional: warns about missing files
    return gulp.src(vendorJS, { allowEmpty: true })
        .pipe(concat('vendors.min.js'))
        .pipe(terser())
        .pipe(gulp.dest('wwwroot/dist'));
});

// --------------------------
// 6. Main Tasks
// --------------------------
// Development: can keep separate unminified if needed
gulp.task('bundle-dev', gulp.series('bundle-css', 'bundle-js'));

// Production: minified
gulp.task('bundle-prod', gulp.series('bundle-css', 'bundle-js'));

// Default task
gulp.task('default', gulp.series('bundle-dev'));
