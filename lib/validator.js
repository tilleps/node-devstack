var moment = require('moment');
var validate = require('validate.js');

validate.async.options = { fullMessages: false };


//
//  Needs to be included in order for datetime validator to work
//  https://validatejs.org/#validators-datetime
//
validate.extend(validate.validators.datetime, {
  // The value is guaranteed not to be null or undefined but otherwise it
  // could be anything.
  parse: function(value, options) {
    return +moment.utc(value);
  },
  // Input is a unix timestamp
  format: function(value, options) {
    var format = options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD hh:mm:ss";
    return moment.utc(value).format(format);
  }
});


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
validate.isValid = function (data, constraints, successCallback, failCallback) {
  return new Promise(function (resolve, reject) {
    constraints = Array.isArray(constraints) ? constraints : [constraints];
  
    var combinedValues = {};
    
    
    var iterate = function (constraints) {
    
      var constraint = constraints.shift();    
    
      if (!constraint) {
        resolve(combinedValues);
        
        //  Support for callbacks
        if (successCallback) {
          successCallback(combinedValues);
        }
        
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
            reject(errors);
            
            //  Support for callbacks
            if (failCallback) {
              failCallback(errors);
            }            
          }
        );
    
    }.bind(this);
  
  
    iterate(constraints); 
  }.bind(this));

};


module.exports = validate;