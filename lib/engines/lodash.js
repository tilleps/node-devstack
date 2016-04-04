///////////////////////////////////////////////////////////////////////////////
//
//  Lodash
//
var lodash = require('lodash');

//  Doesn't work
//lodash.templateSettings.interpolate = /<\?(.+?)\?>/g;
//lodash.templateSettings.escape = /<\?-(.*?)\?>/g;
//lodash.templateSettings.evaluate = /<\?=(.*?)\?>/g;
//lodash.helpers = helpers;


//console.log('imports', lodash.templateSettings.imports);


var fs = require('fs');
var path = require('path');



//
//  Partials Support for lodash Templates
//
var readCache = {};
var cacheStore = {};


/**
 * Conditionally cache `compiled` template based
 * on the `options` filename and `.cache` boolean.
 *
 * @param {Object} options
 * @param {Function} compiled
 * @return {Function}
 * @api private
 */
function cache(options, compiled) {
  // cachable
  if (compiled && options.filename && options.cache) {
    delete readCache[options.filename];
    cacheStore[options.filename] = compiled;
    return compiled;
  }

  // check cache
  if (options.filename && options.cache) {
    return cacheStore[options.filename];
  }

  return compiled;
}



/*
lodash.templateSettings.imports.render = function (rel, options) {
  
  var tmpl = cache(options);
  
  if (!tmpl) {
    
    var ext = path.extname(options.filename);
    var tpl = path.resolve(path.dirname(options.filename, ext), rel + ext);
    var data = fs.readFileSync(tpl, 'utf8');
    
    tmpl = cache(options, lodash.template(data, null, options))
  }
  
  return tmpl(options).replace(/\n$/, '');
};
*/

var render = function (abs, options, cb) {

  var dir = path.dirname(abs);
  var ext = path.extname(abs);


  lodash.templateSettings.imports.include = function (rel) {
    var str = render(path.resolve(dir, rel + ext), options);
    return str;
  };
  
  
  var tpl = options.cache && cache[abs];
  
  if (!tpl) {
    
    if (!cb) {
      try {
        var data = fs.readFileSync(abs, 'utf8');
        tpl = cache[abs] = lodash.template(data, null, options);        
      }
      catch (err) {
        throw new Error('test');        
      }
    }
    else {
      return fs.readFile(abs, 'utf8', function (err, data) {
        
        if (err) {
          return cb(err);
        }
        
        try {
          tpl = cache[abs] = lodash.template(data, null, options);          
          cb(null, tpl(options));
        }
        catch (e) {
          cb(e);          
        }
      });
    }
    
  }
  
  
  var str = tpl(options);
  
  if (!cb) {
    return str;
  }
  
  cb(null, str);
  
  
  
  
};




module.exports = function (engines, helpers) {
  
  
  //  Prefix all template variables (so won't have to deal with undefined variables)
  //  "this" does not work - results in "Unexpected token this"
  lodash.templateSettings.variable = 'vars';

  lodash.templateSettings.imports.helpers = helpers;

  lodash.templateSettings.imports.dump = function () {
  
    var output = '<pre>';
  
    for (var i in arguments) {
      output += JSON.stringify(arguments[i], null, 4);
    }
  
    output += '</pre>';  
  
    return output;
  };
  
  
  engines.requires.lodash = lodash;
  engines.lodash = render;
  
  
};



