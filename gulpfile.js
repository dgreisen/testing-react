var utils = require('./build-utils');
var react = require('gulp-react');
var lazypipe = require('lazypipe');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var gulp = require('gulp');
var async = require('async');
var sprite = require('css-sprite').stream;

var js_initial_pipes = {
  js: null,
  jsx: lazypipe().pipe(react),
}

var css_initial_pipes = {
  css: null,
}

var js_middle_pipes = lazypipe().pipe(function() {return gulpif(is_uncompressed, uglify());})


gulp.task('build_styles', utils.build('css', css_initial_pipes));

gulp.task('build_scripts', utils.build('js', js_initial_pipes, js_middle_pipes));

gulp.task('build_imgs', build_imgs)

gulp.task('build', ['build_styles', 'build_scripts']);

gulp.task('default', ['build']);

function build_imgs(end) {
  utils.load_manifests(function(err, manifests){
    if (err) {
      return end(err);
    }
    async.each(manifests, function(manifest, callback) {
      var imgs = manifest.include.img || [];
      gulp.src(imgs)
          .pipe(sprite({
            name: manifest.name,
            style: manifest.name + '-sprite.css',
            cssPath: '../img',
          }))
          .pipe(gulpif('*.png', gulp.dest('./build/img/'), gulp.dest('./build/css/')))
    }, end);
  });
}

gulp.task('install_deps', utils.install_deps)


function is_uncompressed(file) {
  return file.path.indexOf('.min.') < 0;
}
