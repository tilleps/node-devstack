
var handlebars = require('handlebars');


module.exports = function (engines, helpers) {
  
  //
  //  Register Handlebars helpers/filters
  //
  for (var key in helpers) {
    handlebars.registerHelper(key, helpers[key]);
  }

  engines.requires.handlebars = handlebars;
  
};