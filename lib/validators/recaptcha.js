var https = require('https');
var querystring = require('querystring');

var validate = require('validate.js');


//
//  Recaptcha
//
//  Async validators in Validate.js 0.8.0 now pass errors using resolve callback
//  passing errors via reject callback is now deprecated and will cause a warning
//
//  @string string value
//  @param object options
//  @param string key
//  @param object
//
module.exports = function (value, options, key, attributes) {
  
  
  return new validate.Promise(function (resolve, reject) {
    
    //
    //  Checked required Recaptcha params
    //
    if (!options.secret) {
      return resolve('recatpcha-misconfiguration-secret');
    }
    
    
    //if (!options.ip) {
    //  return reject('recaptcha-misconfiguration-ip');
    //}
    
    
    //  Check for empty response to prevent unecessary call to Recaptcha
    if (typeof value === 'undefined' || value === '') {
      return resolve('missing-input-response');
    }
    
    
    //  Create querystring
    var qs = querystring.stringify({
      'secret': options.secret,
      'response': value//,
      //'remoteip': options.ip
    });
    
    //  Add IP address
    if (options.ip) {
      qs.remoteip = options.ip;
    }
    
    
    var reqOptions = {
      host: 'www.google.com',
      path: '/recaptcha/api/siteverify',
      port: 443,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': qs.length
      }
    };
    
    
    var request = https.request(reqOptions, function (response) {
      var body = '';
      
      response.on('error', function (err) {
        resolve(['recaptcha-no-reachable']);
      });
      
      response.on('data', function (chunk) {
        body += chunk;
      });
    
      response.on('end', function () {
        var result = JSON.parse(body);
        
        if (result.success) {
          return resolve();
        }
        else {
          return resolve(result['error-codes']);
        }
        
      });
      
    });
    
    request.write(qs, 'utf8');
    
    request.end();


  });
};
