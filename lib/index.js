'use strict';

var requireDir = require('require-dir');

module.exports.swagger = {
  middlewares: requireDir('./middlewares/swagger')
};