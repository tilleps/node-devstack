//
//  Define Template Engines
//
//  General Notes:
//    Handlebars helpers arguments: input  (args + input + obj)
//    HTMLing helpers arguments: input appended to args (args + input)
//

var consolidate = require('consolidate');





module.exports = function (engines, helpers) {
  
  helpers = helpers || {};
  
  //  Set default engines consolidate
  engines = engines || consolidate;
  
  
  //require('./engines/handlebars')(engines, helpers);
  require('./engines/lodash')(engines, helpers);
  require('./engines/marked')(engines, helpers);
  
  return engines;  
};


