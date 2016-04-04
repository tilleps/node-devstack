var fs = require('fs');
var marked = require('marked');

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

var requires = {};

var engine = function (path, options, fn) {
  
  if (requires[path]) {
    return fn(null, requires[path]);
  }
  
  fs.readFile(path, { encoding: "utf8" }, function (err, data) {
    
    data = marked(data);
    
    //*
    //  Variable substitution
    data = data.replace(/\{\{([^}]+)\}\}/g, function (_, name) {
      return options[name] || '';
    });
    //*/
    
    //  Cache
    if (options.cache) {
      requires[path] = data;
    }
    
    fn(err, data);
  });
  
};


module.exports = function (engines, helpers) {  
  engines.markdown = engine;
};