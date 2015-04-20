(function(){
var onload_handlers = []
// From https://github.com/yanatan16/nanoajax
// MIT License
!function(e,t){function n(){if(t.XMLHttpRequest)return new t.XMLHttpRequest;try{return new t.ActiveXObject("MSXML2.XMLHTTP.3.0")}catch(e){}}t.nanoajax=e,e.ajax=function(e,t,r){r||(r=t,t=null);var u=n();return u?(u.onreadystatechange=function(){4==u.readyState&&r(u.status,u.responseText)},t?(u.open("POST",e,!0),u.setRequestHeader("X-Requested-With","XMLHttpRequest"),u.setRequestHeader("Content-Type","application/x-www-form-urlencoded")):u.open("GET",e,!0),void u.send(t)):r(new Error("no request"))}}({},function(){return this}());
// End from https://github.com/yanatan16/nanoajax

function add_script(path, type, callback){
  var script = document.createElement('SCRIPT');
  script.setAttribute('src', path);
  script.setAttribute('type', type||'text/javascript');
  script.onload=function(){
    return callback();
  }

  document.body.appendChild(script);
  return script;
}

function get_path(base_static_path, obj){
  return (base_static_path||'') + (obj.path||obj);
}

function add_stylesheet(path, type, callback){
  var link = document.createElement('LINK');
  link.setAttribute('href', path);
  link.setAttribute('type', type||'text/css');
  link.setAttribute("rel", "stylesheet");
  link.onload=function(){
    return callback();
  }

  document.body.appendChild(link);
  return link;
}

function add_scripts(type) {
  return function(paths, base_static_path, callback){
    async.each(
      paths,
      function(raw_path, callback) {
        var path = get_path(base_static_path, raw_path);
        add_script(path, type, callback)
      },
      callback
    )
  }
}

function add_stylesheets(type) {
  return function(paths, base_static_path, callback) {
    async.each(
      paths,
      function(raw_path, callback) {
        var path = get_path(base_static_path, raw_path);
        add_stylesheet(path, type, callback)
      },
      callback
    )
  }
}

function find_script_that_contains(text){
  var scripts = document.getElementsByTagName('script');
  for(var i=0,j=scripts.length;i<j;i++){
    if(scripts[i].src.indexOf(text) > -1)
      return scripts[i];
  }
}

function add_jsx(paths, base_static_path, callback) {
  async.each(
    paths,
    function(raw_path, callback) {
      var path = get_path(base_static_path, raw_path);
      nanoajax.ajax(path, function (code, responseText) {
        var transform = function() {
          if (typeof window.JSXTransformer !== 'undefined') {
            var jsx_code = responseText.replace(/^.*require\(.*\).*$/mg, '')
            var js_code = JSXTransformer.transform(jsx_code).code;
            eval(js_code);
            callback();
          } else {
            setTimeout(transform, 10);
          }
        }
        transform();
      })
    },
    callback
  )
}

// file type definitions
add_type = {
  "js": add_scripts("text/javascript"),
  "jsx": add_jsx,
  "css": add_stylesheets("text/css"),
}

function load_manifest(file_name, base_static_path, callback){
  nanoajax.ajax(base_static_path + "manifests/" + file_name + "/bower.json", function (code, responseText) {
    var manifest = JSON.parse(responseText);
    var types = []
    for (type in manifest.include || {}) {types.push(type);}
    async.each(
      types,
      function(type, callback) {
        var paths = manifest.include[type];
        if (!add_type[type]) {return callback();}
        add_type[type](paths, base_static_path, callback);
      },
      callback
    )
  })
}

function load_manifests(file_names, base_static_path, callback) {
  var hide_body_style = document.createElement('style');
  hide_body_style.innerHTML = "body{display:none;}";
  document.head.appendChild(hide_body_style);

  async.each(
    file_names,
    function(file_name, callback) {
      load_manifest(file_name, base_static_path, callback)
    },
    function() {
      hide_body_style.remove();
      handle_onload()
      if (callback) {callback();}
    }
  )
}

window.load_manifests = load_manifests;

// monkeypatch jquery onload
window.patch_jquery = function() {
  window.$ = function(callback) {
    if (arguments.length > 1 || typeof callback !== 'function') {
      throw Error('Until JQuery is loaded, you can only use on onready shortcut: $(function {}).');
    }
    onload_handlers.push(callback);
  }
}


function handle_onload() {
  if (document.readyState == "complete") {
    onload_handlers.forEach(function(handler) {
      handler();
    });
  } else {
    $(function() {
      onload_handlers.forEach(function(handler) {
        handler();
      });
    })
  }
}

// from https://github.com/caolan/async (MIT License)

var _each = function (arr, iterator) {
    if (arr.forEach) {
        return arr.forEach(iterator);
    }
    for (var i = 0; i < arr.length; i += 1) {
        iterator(arr[i], i, arr);
    }
};

function only_once(fn) {
    var called = false;
    return function() {
        if (called) throw new Error("Callback was already called.");
        called = true;
        fn.apply(this, arguments);
    }
}

async = {};
async.each = function (arr, iterator, callback) {
    callback = callback || function () {};
    if (!arr.length) {
        return callback();
    }
    var completed = 0;
    _each(arr, function (x) {
        iterator(x, only_once(done) );
    });
    function done(err) {
      if (err) {
          callback(err);
          callback = function () {};
      }
      else {
          completed += 1;
          if (completed >= arr.length) {
              callback();
          }
      }
    }
};

})();
