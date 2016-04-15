var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    compass = require('gulp-compass'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    livereload = require('gulp-livereload'),
    sourcemaps = require('gulp-sourcemaps');


gulp.task('default', ['watch']);


gulp.task('compass_compile', function(){
  gulp.src('src/scss/**/*.scss')
    .pipe(plumber())
    .pipe(compass({
      config_file: 'src/config.rb',
      style: 'compressed',
      comments : false,
      css : 'dst',
      sass: 'src/scss',
      sourcemap: false
    }))
    .pipe(gulp.dest('dst'));
});


gulp.task('js_compile', function() {
  gulp.src([
      'src/js/110_header.js',
      'src/js/410_View.js',
      'src/js/990_footer.js'
    ])
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(concat('nCarousel.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dst'));
});


gulp.task('watch', function(){
  livereload.listen();
  
  gulp.watch('src/scss/**/*.scss', ['compass_compile']);
  
  gulp.watch('src/js/**/*.js', ['js_compile']);
  
  gulp.watch('demo/**/*.html').on('change', livereload.changed);
  gulp.watch('dst/**/*.css').on('change', livereload.changed);
  gulp.watch('dst/**/*.js').on('change', livereload.changed);
});
