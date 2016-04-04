

module.exports = function (value, options, key, attributes, settings) {
  
  var message = options.message || 'is not available';
  var errorMsg = options.error || 'unable to verify';
  var invalidMsg = options.invalid || 'invalid validator config';
  
  //
  //  Mongoose Adapter
  //
  function mongoose() {
    return new validate.Promise(function (resolve, reject) {
      
      //  Check for Mongoose Model
      if (!options.Model) {
        return resolve(invalidMsg);
      }     
      
      var where = {};
      where[key] = value;
      
      /*
      //
      //  @todo Determine if it is faster to query for 1 document
      //  @todo Handle errors better
      //
      options.model.count(where, function (err, count) {
        if (err) {
          return resolve(errorMsg);
        }
      
        if (count > 0) {
          resolve();
        }
        else {
          resolve(message);
        }
      });
      */
      
      //
      //  @todo Handle errors better
      //
      options.Model.findOne(where, function (err, model) {
        if (err) {
          return resolve(errorMsg);
        }
        
        if (model) {
          return resolve();
        }
        
        resolve(message);
      });    
    
    
    });
  }
  
  
  //
  //  Adapter Selector
  //
  switch (options.adapter) {
    case 'mongoose':
      return mongoose();
      break;

    case 'mysql':
    default:
      return options.adapter ? 'Unsupported validator adapter' : 'Validator adapter not specified';
      break;
  }
};