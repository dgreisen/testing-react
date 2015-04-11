var concat = require('gulp-concat');
var gulp = require('gulp');
var argv = require('yargs').argv;
var fs = require('fs');
var order = require("gulp-order");
var merge = require('merge-stream');
var async = require('async');
var exec = require('child_process').exec;

function load_manifest(file_name, callback) {
  file_path = './manifests/' + file_name + '/bower.json';
  fs.readFile(file_path, 'utf8', function (err, data) {
    if (err) {
      return callback(err);
    }
    try {
      var manifest = JSON.parse(data);
    } catch (e) {
      throw Error('invalid json in ' + file_name + ' manifest.');
    }
    if (file_name !== manifest.name) {
      throw Error('invalid bower.json: name "' + manifest.name + '" not equal to manifest name "' + file_name + '".' )
    }
    for (typ in (manifest.include || {})) {
      var new_paths = [];
      var paths = manifest.include[typ];
      paths.forEach(function(path) {
        if (!path.dev) {
          new_paths.push(path);
        }
      });
      manifest.include[typ] = new_paths;
    }
    return callback(null, manifest);
  });
}

function build_initial_pipe(manifest, initial_pipelines, middle_pipeline) {
  initial_pipes = [];

  for (typ in initial_pipelines) {
    var partial_pipe = initial_pipelines[typ];
    if (manifest.include[typ]) {
      var initial_pipe = gulp.src(manifest.include[typ])
      if (partial_pipe) {
        initial_pipe.pipe(partial_pipe());
      }
      initial_pipes.push(initial_pipe);
    }
  }
  var initial_pipe = merge(initial_pipes);
  if (middle_pipeline) {
    initial_pipe.pipe(middle_pipeline());
  }
  return initial_pipe;
}


function load_manifests(callback) {
  // handle_manifest called once for each manifest function(err, manifest)

  get_manifest_paths(function(err, manifest_names) {
    if (err) {
      callback(err);
    }
    async.map(manifest_names, load_manifest, callback);
  });
}

function build(extension, initial_pipelines, middle_pipeline) {
  return function(end) {
    load_manifests(function(err, manifests){
      if (err) {
        return end(err);
      }
      async.each(manifests, function(manifest, callback) {
        return build_initial_pipe(manifest, initial_pipelines, middle_pipeline)
          .pipe(order(get_ordered_paths(manifest, initial_pipelines), {base: '.'}))
          .pipe(concat(manifest.name  + '.' + extension))
          .pipe(gulp.dest('./build/' + extension + '/'))
          .on('end', callback);
      }, end)
    });
  }
}

function get_ordered_paths(manifest, partial_pipes) {
  var ordered_paths = [];
  for (typ in (manifest.include || {})) {
    if (typ in partial_pipes) {
      ordered_paths = ordered_paths.concat(manifest.include[typ]);
    }
  }
  return ordered_paths;
}

function get_manifest_paths(callback) {
  if (argv.name) {
    return callback(null, [argv.name]);
  }
  else {
    fs.readdir('./manifests', callback);
  }
}


function install_deps(end) {
  return get_manifest_paths(function(err, manifest_paths) {
    var install = function(manifest_path, callback) {
      return exec('bower install', {cwd: manifest_path}, callback);
    }
    async.map(manifest_paths, install, end);
  })
}

module.exports = {
  build: build,
  load_manifests: load_manifests,
  instal_deps: install_deps
}

