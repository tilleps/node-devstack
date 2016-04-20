var validate = require('validate.js');

module.exports = function (value, options, key, attributes, settings) {
  
  //  Allow empty values
  options = options || false;
  
  return new validate.Promise(function (resolve, reject) {
    
    if (options && value == "") {
      return resolve();
    }
    
    var regex = /^[a-f\d]{24}$/i;
    regex.test(value);
  
    //  Valid format
    if (regex.test(value)) {
      return resolve();
    }
  
    var msg = 'invalid ObjectId';
  
    resolve(msg);

  });

};
