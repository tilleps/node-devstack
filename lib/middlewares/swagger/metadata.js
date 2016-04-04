/**
 * 
 * @see https://www.reddit.com/r/node/comments/26f3ld/express_middleware_with_async_initialization/
 * 
 * 
 * var swaggerTools = require('swagger-tools');
 * var promise = new Promise(function (resolve, reject) {
 * 
 *   swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
 *     resolve(middleware);  
 *   });
 * 
 * });
 * 
 * var options = {};
 * app.use(thisMiddleware(promise, options));
 * 
 * @author Eugene Song <tilleps@gmail.com>
 */


module.exports = function (promise, options) {
  
  return function (req, res, next) {
    promise
    .then(function (middleware) {
      middleware.swaggerMetadata(options)(req, res, next);
    })
    .catch(function (err) {
      next(err);
    });
    
  };
  
};

