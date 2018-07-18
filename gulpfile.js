const gulp = require('gulp'),
      sass = require('gulp-sass'),
      csso = require('gulp-csso'),
      server = require('browser-sync').create(),
      concat = require('gulp-concat'),
      uglify = require('gulp-uglify');
      imagemin = require('gulp-imagemin'),
      del = require('del'),
      sequence = require('gulp-sequence'),
      postcss = require('gulp-postcss'),
      autoprefixer = require('autoprefixer'),
      svgSprite = require('gulp-svg-sprite'),
      svgmin = require('gulp-svgmin'),
      cheerio = require('gulp-cheerio'),
      replace = require('gulp-replace'),
      spritesmith = require('gulp.spritesmith'),
      rename = require('gulp-rename'),
      gulpif = require('gulp-if');

// Default task
gulp.task('default', ['styles:sass', 'server']);

// Compile SCSS to CSS
gulp.task('styles:sass', function() {
    return gulp.src('src/sass/style.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer({
            'browsers': [
                '> 1%',
                'last 10 versions',
                'ie 10-11'
            ]
        })]))
        .pipe(gulp.dest('src/css/'))
        .pipe(server.stream());
});

gulp.task('server', ['styles:sass'], function() {
    server.init({
        server: "./src",
        notify: false
    });

    gulp.watch("src/sass/**/*.scss", ['styles:sass']);
    gulp.watch("src/scripts/*.js", ['scripts:concat']).on('change', server.reload);
    gulp.watch("src/*.html").on('change', server.reload);
});

// Make one script file from all
gulp.task('scripts:concat', function() {
    return gulp.src([
        'src/scripts/temp.js'
    ])
        .pipe(concat('script.js'))
        .pipe(gulp.dest('src/scripts/'));
});

// Make one script from all js libs
gulp.task('scripts:libs', function() {
    return gulp.src([
        'src/libs/temp.js'
    ])
        .pipe(concat('libs.js'))
        .pipe(gulp.dest('src/scripts/'));
});

// Imagemin task
gulp.task('images:min', function() {
    return gulp.src([
        'src/images/**/*',
        '!src/images/{svg,svg/**}',
        '!src/images/{png,png/**}'
    ])
        .pipe(imagemin([
            imagemin.gifsicle({interlaced: true}),
            imagemin.jpegtran({progressive: true}),
            imagemin.optipng({optimizationLevel: 5}),
            imagemin.svgo({
                plugins: [
                    {removeViewBox: true},
                    {cleanupIDs: false}
                ]
            })
        ]))
        .pipe(gulp.dest('dist/images/'));
});

// SVG sprite
gulp.task('sprite:svg', function() {
    return gulp.src('src/images/svg/*.svg')
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(cheerio({
            run: function($) {
                $(['fill']).removeAttr('fill');
                $(['stroke']).removeAttr('stroke');
                $(['style']).removeAttr('style');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(replace('&gt', '>'))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: 'sprite.svg',
                }
            }
        }))
        .pipe(gulp.dest('src/images/'));
});

// PNG Sprite
gulp.task('sprite:png', function () {
    return gulp.src('src/images/png/*.png')
        .pipe(imagemin([
            imagemin.optipng({optimizationLevel: 5})
        ]))
        .pipe(spritesmith({
            imgName: 'sprite.png',
            cssName: 'sprite.scss',
            imgPath: '../images/sprite.png'
        }))
        .pipe(gulpif('*.png', gulp.dest('src/images')))
        .pipe(gulpif('*.scss', gulp.dest('src/sass/sprite')));
});

// Copy scripts
gulp.task('scripts:copy', function() {
    gulp.src([
        'src/scripts/script.js',
        'src/scripts/libs.js'
    ])
        .pipe(gulp.dest('dist/scripts/'));
});

// Copy styles
gulp.task('styles:copy', function() {
    gulp.src('src/css/style.css')
        .pipe(gulp.dest('dist/css/'));
});

// Copy html
gulp.task('html:copy', function() {
    gulp.src('src/**/*.html')
        .pipe(gulp.dest('dist/'));
});

// Copy fonts
gulp.task('fonts:copy', function() {
    gulp.src('src/fonts/**')
        .pipe(gulp.dest('dist/fonts/'));
})

// Minimize dist styles
gulp.task('styles:min', function() {
    gulp.src('dist/css/style.css')
        .pipe(csso())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/css/'));
});

// Minimize dist scripts
gulp.task('scripts:min', function() {
    gulp.src('dist/scripts/*.js')
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(gulp.dest('dist/scripts/'));
});

// Delete dist folder
gulp.task('del', function() {
    return del.sync('dist');
})

// Copy files
gulp.task('files:copy', sequence('html:copy', 'styles:copy', 'scripts:copy', 'images:min', 'fonts:copy'));

// Minimize styles and scripts
gulp.task('assets:min', sequence('styles:min', 'scripts:min'));

// Build task
gulp.task('build', sequence('del', 'files:copy', 'assets:min'));