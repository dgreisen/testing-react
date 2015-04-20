var utils = require('./build-utils');
var react = require('gulp-react');
var lazypipe = require('lazypipe');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var gulp = require('gulp-help')(require('gulp'));
var async = require('async');
var sprite = require('css-sprite').stream;
var exec = require('child_process').exec;

DIR = __dirname

var js_initial_pipes = {
  js: null,
  jsx: lazypipe().pipe(react),
}

var css_initial_pipes = {
  css: null,
}

var js_middle_pipes = lazypipe().pipe(function() {return gulpif(is_uncompressed, uglify({'preserveComments':'some'}));})


gulp.task('build_styles', false, utils.build('css', css_initial_pipes));

gulp.task('build_scripts', false, utils.build('js', js_initial_pipes, js_middle_pipes));

gulp.task('buildimgs', 'create a sprite map of all images specified in "manifest.include.img"', buildImgs)

gulp.task('build', 'compile and minify styles and scripts defined in all manifests', ['build_styles', 'build_scripts']);

gulp.task('default', 'compile and minify styles and scripts defined in all manifests', ['build']);

function buildImgs(end) {
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

gulp.task('installdeps', 'install bower dependencies for all manifests', utils.install_deps)

gulp.task('runtestserver', 'run a python simpleHTTPServer for testing (port 8765)', function(end) {
  console.log('serving "' + DIR + '" on port 8765')
  cp = exec("python -m SimpleHTTPServer 8765")
  cp.stdout.pipe(process.stdout)
  cp.stderr.pipe(process.stderr)
})

function is_uncompressed(file) {
  return file.path.indexOf('min.') < 0;
}
