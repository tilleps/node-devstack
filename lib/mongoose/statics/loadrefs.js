/**
 * Load Refs Helper
 * 
 * Intended to be used as a Mongoose static method
 * 
 * schema.statics.loadRefs = require('loadrefs')();
 * 
 * // Custom model resolver
 * function getModel(ref) {
 *   return db.model(ref);
 * }
 * 
 * Model.loadRefs(model, { models: getModel }, function (err, model) {
 *   // save model
 * });
 * 
 */
"use strict";


var _ = {
  get: require('lodash/get'),
  set: require('lodash/set')
};


/**
 * One to One Relationship
 * 
 * field
 *   options
 *     ref
 */
function oneToOne(field, model, models) {
  var options = field.options;
  options.foreign_key = options.foreign_key || '_id';
  options.fields = options.fields || '-__v -_refs';
  
  return new Promise(function (resolve, reject) {
    
    var data = _.get(model, field.path);  
    
    //  Skip empty values
    if (typeof data == 'undefined' || ~['', null].indexOf(data)) {
      return resolve();
    }
    
    
    var Model = models(options.ref);
    
    var where = {};
    where[options.foreign_key] = data;
    
    Model.findOne(where, options.fields, function (err, doc) {
      if (err) {
        return reject(err);
      }
    
      if (!doc) {
        return reject(new Error('Entry not found: ' + options.ref));
      }
    
      resolve(doc);
    });
    
  });
}



/**
 * One to Many Relationship
 * 
 * field
 *   options
 *     type [
 *       { ref: "" }
 *     ]
 */
function oneToMany(field, model, models) {
  var options = field.options.type[0];
  options.foreign_key = options.foreign_key || '_id';
  options.fields = options.fields || '-__v -_refs';
  
  return new Promise(function (resolve, reject) {
    
    var data = _.get(model, field.path);
    
    //  Skip empty values
    if (typeof data == 'undefined' || data === null || data === '' || !data.length) {
      return resolve();
    }
    
    
    var Model = models(options.ref);
    
    Model.find()
      .select(options.fields)
      .where(options.foreign_key).in(data)
      .exec(function (err, docs) {
        
        if (err) {
          return reject(err);
        }
    
        resolve(docs);
      });
  });
}




function loadRefs(model, options, cb) {
  
  options = options || {};
  
  //  Make options (2nd) parameter optional
  cb = typeof options == 'function' ? options : cb;
  
  
  if (Array.isArray(options.models)) {
    throw Error('Array of models not supported');
  }
  
  if (typeof options.models == 'object') {
    options.models = function (ref) {
      return options.models[ref];
    };
  }
  
  if (typeof options.models != 'function') {
    options.models = function (ref) {
      return this.model(ref);
    }.bind(this);
  }
  
  
  
  var keys = [];
  var promises = [];

  var schemaPaths = this.schema.paths;
  var field;

  for (var key in schemaPaths) {

    //
    //  Determine the relationship type (OneToOne / OneToMany)
    //
    field = schemaPaths[key];


    //  Skip _refs
    if (key.substr(0, 5) === '_refs') {
      continue;
    }

    
    switch (field.instance) {
      
      case 'Array':
        //  Apply Relational Refs that of _refs[key] defined and ref model on the field    
        if (schemaPaths['_refs.' + field.path] && field.options.type[0].ref) {
          promises.push(oneToMany(field, model, options.models));
          keys.push(key);
        }    
        break;
      
      case 'ObjectID':
        //  Apply Relational Refs that of _refs[key] defined and ref model on the field
        if (schemaPaths['_refs.' + field.path] && field.options.ref) {
          promises.push(oneToOne(field, model, options.models));        
          keys.push(key);
        }
        break;

      case 'Embedded':
      case 'Number':
      case 'String':
        //  Do nothing
        break;

      default:
        break;    
    }


  }


  //
  //  Load All Dependencies & Save
  //
  return Promise.all(promises).then(function (values) {
    
    //  Set/load refs values
    for (var i = 0; i < keys.length; i++) {   
      _.set(model._refs, keys[i], values[i]);
    }
    
    //  Callback
    cb && cb(null, model);
    
  }, function (err) {
    // @todo test err output
    cb && cb(err);
  });
  
};



module.exports = function () {
  return loadRefs;
};
