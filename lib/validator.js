var validate = require('validate.js');

validate.async.options = { fullMessages: false };

validate.validators.recaptcha = require('./validators/recaptcha');
validate.validators.available = require('./validators/available');
validate.validators.exists = require('./validators/exists');
validate.validators.objectid = require('./validators/objectid');


/**
 * isValid
 * 
 * Allow validating in groups
 * 
 * Example usage:
 * 
 * var constraints = [
 *   {
 *     // 
 *   }
 * ];
 *
 * validate.isValid(data, constraints, function(values) {
 *   
 *   //  Success
 *   function (values) {
 *     console.log('success', values);
 *   },
 *   
 *   //  Fail 
 *   function (errors) {
 *     console.log('fail', arguments);
 *   }
 * });
 */
validate.isValid = function (data, constraints, success, fail) {
  
  constraints = Array.isArray(constraints) ? constraints : [constraints];
  
  var combinedValues = {};
  
  
  var iterate = function (constraints) {
    
    var constraint = constraints.shift();    
    
    if (!constraint) {
      success(combinedValues);
      return;
    }
    
    
    this.validate.async(data, constraint)
      .then(        
        //  Success, validate next group/set
        function (values) {
        
          //  Merge values to return
          for (var key in values) {
            combinedValues[key] = values[key];
          }
        
          iterate(constraints);      
        },
        
        //  Fail, stop further validation
        function (errors) {
          fail(errors);      
        }
      );
    
  }.bind(this);
  
  
  iterate(constraints); 
};


module.exports = validate;