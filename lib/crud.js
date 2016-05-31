
var validate = require('./validator');
var createWhere = require('./databases/mongo/where');
var paginate = require('./paginate');
var _ = require('lodash');

/*
validate.validators.myAsyncValidator = function(value, options, key, attributes) {
  return new validate.Promise(function(resolve, reject) {
    setTimeout(function() {
      if (value === "foo") resolve();
      else resolve("is not foo");
    }, 100);
  });
};
*/


//
//  Format: key1|field1,field2 key2|field1,field2
//  tool_category|_id,name regions|_id,name
//
function swaggerToPopulate(value) {
  
  if (!value) {
    return [];
  }
  
  var items = value.split(' ').map(function (item) {
    var parts = item.split('|');
    var select = typeof parts[1] === 'undefined' ? '' : parts[1].split(',').join(' ');
    
    return { path: parts[0], select: select };
  });
  
  return items;
}


module.exports.swaggerToPopulate = swaggerToPopulate;


/**
 * Convert Mongoose Schema to Validate.js Constraint Array
 * 
 * var constraintsExample = [
 *   {
 *     "name": {
 *       "presence": { message: "required" }
 *     },
 *     "email": {
 *       "presence": { message: "required" },
 *       "email": true        
 *     }
 *   }
 * ];
 * 
 * @todo Add validators for fields that are ObjectIds
 *       mongoose.Types.ObjectId.fromString(id);
 * @param Schema schema
 */
function schemaConstraints(Model) {
  
  var schema = Model.schema;
  var constraints = [];
  
  
  //
  //  Add all the required validators in first round
  //
  function requiredConstraints(paths) {
    var constraint = {};
    
    for (var key in paths) {
    
      //  Skip _id and __v keys
      if (~['_id', '__v'].indexOf(key) || key.substr(0, 5) === '_refs') {
        continue;
      }
    
      constraint[key] = {};
      
      
      //
      //  Fields that are marked as required
      //
      if (schema.paths[key].options.required) {
        constraint[key].presence = true; 
      }
      
      
      //
      //  Fields that are unique - we assume required
      //
      if (schema.paths[key]._index && schema.paths[key]._index.unique === true) {      
        constraint[key].presence = true; 
      }
      
      
      //
      //  Fields that are ObjectIds
      //
      if (typeof schema.paths[key].options.type == 'function' && schema.paths[key].options.type.name == 'ObjectId') {
        constraint[key].objectid = true;        
      }

    }
    
    return constraint;
  }
  
  
  constraints.push(requiredConstraints(schema.paths));
  
  
  
  
  
  
  
  //
  //  Add other validators
  //
  var constraint = {};
  for (var key in schema.paths) {
    
    //  Skip _id and __v keys
    if (~['_id', '__v'].indexOf(key) || key.substr(0, 5) === '_refs') {
      continue;
    }
    
    constraint[key] = {};
    
    //
    //  Validators
    //  @todo add validators
    //
    

    
    //
    //  Unique/Exists validator
    //
    if (schema.paths[key]._index && schema.paths[key]._index.unique === true) {
      constraint[key].exists = {
        "adapter": "mongoose",
        "Model": Model
      };
    }
    
    
    //console.log(key, constraint);
    
    
  }
  constraints.push(constraint);
  
  //console.log('constraints', constraints);
  
  return constraints;
}


module.exports.schemaConstraints = schemaConstraints;



//
//
//
function filterNonRequired(Model, values) {
  
  for (var key in values) {  
    if (values[key] === "" && !Model.schema.path(key).options.required) {
      delete values[key];
    }    
  }
  
};


module.exports.filterNonRequired = filterNonRequired;



module.exports.delete = function (Model) {
  return function (req, res, next) {
  
    //
    //  Determine the fields to pull
    //
    var fields = Object.keys(Model.schema.paths);
    fields = fields.filter(function (field) {
      return (!~['__v'].indexOf(field));
    });
  
  
    //
    //  Find By ID
    //
    Model.findById(req.swagger.params.id.value, '_id', {}, function (err, model) {

      if (err) {
        return next(err);
      }

      //
      //  Non Existing Entry
      //
      if (model === null) {
        var response = {
          status: "error",
          data: "Entry not found"
        };
      
        //  http://stackoverflow.com/questions/11746894/what-is-the-proper-rest-response-code-for-a-valid-request-but-an-empty-data
        res.status(404);
        res.json(response);
      
        return;
      }
    
    
      //
      //  Delete Entry
      //
      model.remove(function (err, model) {
        if (err) {
          return next(err);
        }

      
        var response = {
          status: "success",
          data: model.toAPI ? model.toAPI() : model.toJSON()
        }
      
        res.status(200);
        res.json(response);
      });

    });    
  }
}



module.exports.update = function (Model) {
  return function (req, res, next) {
  
    
    //
    //  Successful Validation
    //
    function validateSuccess(values) {
      var model = new Model(values);
    
      //
      //  Mongoose validation
      //
      model.validate(function (err) {
    
        if (err) {
          var response = {
            "status": "fail",
            "data": {}
          }
      
          for (var key in err.errors) {          
            if (typeof response.data[key] === 'undefined') {
              response.data[key] = [];
            }
            response.data[key].push(err.errors[key].message);
          }
    
      
          res.status(422);
          res.json(response);
          return;
        }
    
    
        //
        //  @todo have to flatten tree so that nested docs don't get overwritten
        //
        var flattened = {};
        var value;
        for (var key in Model.schema.paths) {
          if (~['_id', '__v'].indexOf(key)) {
            continue;
          }
          value = validate.getDeepObjectValue(values, key);
      
          if (typeof value !== 'undefined') {
            flattened[key] = value;
          }
        }
        
      
        
        //
        //  Return updated model: { new: true }
        //  http://stackoverflow.com/questions/30419575/mongoose-findbyidandupdate-not-returning-correct-model
        //
        Model.findByIdAndUpdate(req.swagger.params.id.value, { '$set': flattened }, { new: true, runValidators: true, context: 'query' }, function (err, doc) {
      
          if (err) {
            return next(err);
          }
      
          var response = {
            "status": "success",
            "data": doc.toAPI ? doc.toAPI() : doc.toJSON()
          };
      
          res.status(200);
          res.json(response);
      
        });
        
      
      });

    }
  
  
    //
    //  Failed Validation
    //
    function validateFail(errors) {
      //  Error
      //console.log('invalid validation', errors);

      //
      //  If error is thrown during validation, it will return Error
      //  Otherwise, will return an object
      //
      if (errors instanceof Error) {
        return next(errors);
      }
    
      var response = {
        "status": "fail",
        "data": errors
      };
    
    
      res.status(422);
      res.json(response);
    }
  
  
    var constraints = schemaConstraints(Model);  

    
    //
    //  Filter Out Non-Used Constraints (partial update)
    //
    constraints = constraints.map(function (constraint) {
      
      var value;
      for (var key in constraint) {
        value = validate.getDeepObjectValue(req.body, key);
        if (!validate.isDefined(value)) {
          delete constraint[key];
        }
      }
      
      return constraint;
    });
    

    //
    //  Validate
    //
    validate.isValid(req.body, constraints, validateSuccess, validateFail);
  
  };
};


module.exports.save = function (Model, cb) {
  return function (req, res, next) {
    
    //
    //  Non Existing Entry
    //    
    function nonExistingEntry() {
      var response = {
        status: "error",
        data: "Entry not found"
      };

      //  http://stackoverflow.com/questions/11746894/what-is-the-proper-rest-response-code-for-a-valid-request-but-an-empty-data
      res.status(404);
      res.json(response);
    }
    
    //
    //  Failed Model Validation
    //
    function failedModelValidation(err) {      
      var response = {
        "status": "fail",
        "data": {}
      }

      for (var key in err.errors) {          
        if (typeof response.data[key] === 'undefined') {
          response.data[key] = [];
        }
        response.data[key].push(err.errors[key].message);
      }
      
      res.status(422);
      res.json(response);
    }
  
    
    function saveCallback(model) {
      
      model.save({ validateBeforeSave: false }, function (err) {
        if (err) {
          return next(err);
        }

        var response = {
          "status": "success",
          "data": model.toAPI ? model.toAPI() : model.toJSON()
        };

        res.status(200);
        res.json(response);
      });
      
    }
    
    
    //
    //  Successful Validation
    //
    function validateSuccess(model) {      
      return function (values) {
        
        _.merge(model, values);
        //_.assign(model, values);
        //_.extend(model, values);
        
        
        //
        //  Mongoose validation
        //
        model.validate(function (err) {
          
          if (err) {
            return failedModelValidation(err);
          }
          
          (typeof cb != 'undefined' ? cb(null, model) : saveCallback(model));
          
        });
      
      };
    

    }


    //
    //  Failed Validation
    //
    function validateFail(errors) {
      
      //
      //  If error is thrown during validation, it will return Error
      //  Otherwise, will return an object
      //
      if (errors instanceof Error) {
        return next(errors);
      }
  
      var response = {
        "status": "fail",
        "data": errors
      };
      
      res.status(422);
      res.json(response);
    }


    var constraints = schemaConstraints(Model);  
    
    //
    //  Filter Out Non-Used Constraints (partial update)
    //
    constraints = constraints.map(function (constraint) {
    
      var value;
      for (var key in constraint) {
        value = validate.getDeepObjectValue(req.body, key);
        if (!validate.isDefined(value)) {
          delete constraint[key];
        }
      }
    
      return constraint;
    });
    

    Model.findById(req.swagger.params.id.value, function (err, model) {
  
      if (err) {
        return next(err);
      }
  
      if (!model) {
        return nonExistingEntry();
      }
      
      //
      //  Validate (via validate.js)
      //
      validate.isValid(req.body, constraints, validateSuccess(model), validateFail);

    });
    
  };
};


module.exports.add = function (Model, callback) {
  return function (req, res, next) {
    
    var constraints = schemaConstraints(Model);
  
    /*
    constraints.push({
      "internal_part_number": {
        available: {
          "adapter": "mongoose",
          "Model": Model
        }
      }
    });
    */
  
    //console.log('req.body', req.body);
    
    //
    //  Failed Model Validation
    //
    function failedModelValidation(err) {      
      var response = {
        "status": "fail",
        "data": {}
      }

      for (var key in err.errors) {          
        if (typeof response.data[key] === 'undefined') {
          response.data[key] = [];
        }
        response.data[key].push(err.errors[key].message);
      }
      
      res.status(422);
      res.json(response);
    }
    
    
    function addCallback(model) {
      model.save({ validateBeforeSave: false }, function (err) {
        if (err) {
          return next(err);
        }

        var response = {
          "status": "success",
          "data": model.toAPI ? model.toAPI() : model.toJSON()
        };

        res.status(201);
        res.json(response);
      });
    }
    
    
    //
    //  Failed Validation
    //
    function validateFail(errors) {
      
      //
      //  If error is thrown during validation, it will return Error
      //  Otherwise, will return an object
      //
      if (errors instanceof Error) {
        return next(errors);
      }
  
      var response = {
        "status": "fail",
        "data": errors
      };
      
      res.status(422);
      res.json(response);
    }
    
    
    function validateSuccess(values) {
      
      //
      //  filter out non-required empty values
      //
      filterNonRequired(Model, values);
      
      var model = new Model(values);
      
      model.validate(function (err) {
        
        if (err) {
          return failedModelValidation(err);
        }
    
        (typeof callback != 'undefined' ? callback(null, model) : addCallback(model));
        
      });
      
    }
    
    
    validate.isValid(req.body, constraints, validateSuccess, validateFail);
  
  };
}



module.exports.read = function (Model) {
  return function (req, res, next) {
    
    //
    //  Determine the fields to pull
    //
    var fields = req.swagger.params._refs.value == "true" || parseInt(req.swagger.params._refs.value) 
      ? ['-__v'] : ['-__v', '-_refs'];

      
    //
    //  Populate
    //  Needs to be in format: [{ path: "key", select: "field1 field2" }]
    //
    var populate = swaggerToPopulate(req.swagger.params._populate.value);
  
  
    //
    //  Find By ID
    //
    Model.findById(req.swagger.params.id.value, fields.join(' '), {}).populate(populate).exec(function (err, model) {
    
      if (err) {
        return next(err);
      }

    
      if (model === null) {
      
        //
        //  Successful request, but no content
        //
        var response = {
          "status": "error",
          "data": "Entry not found"
        }
      
        res.status(404);
        res.json(response);
      
        return;
      }
      else {
      
        //
        //  Convert database results to API format
        //      
        var response = {
          "status": "success",
          "data": model.toAPI ? model.toAPI() : model.toJSON()
        }
      
        res.status(200);
        res.json(response);
      
        return;
      }    
    
    });
  
  };
};



module.exports.browse = function (Model, where) {
  return function (req, res, next) {

    //
    //  Determine the fields to pull
    //
    var fields = req.swagger.params._refs.value == "true" || parseInt(req.swagger.params._refs.value) 
      ? ['-__v'] : ['-__v', '-_refs'];
  
    fields = (req.swagger.params._fields.value) ? req.swagger.params._fields.value : fields;
    fields = (typeof fields === 'string') ? fields.split(' ') : fields;


    where = where || createWhere(req.query._where);
  
  
    Model.count(where, function (err, count) {
    
      if (err) {
        return next(err);
      }
    
    
      //
      //  Calculate Pagination Info
      //
      var pagination = paginate(count, req.swagger.params._limit.value, req.swagger.params._page.value);

    
      //
      //  Get Entries
      //
      var options = {
        skip: pagination.offset_start, 
        limit: pagination.limit
      };
    
    
      //
      //  Sorting support (use 1 for ascending, -1 for descending)
      //
      options.sort = req.query._sort || {};
    

    
      var populate = swaggerToPopulate(req.swagger.params._populate.value);
    
      /*
      console.log('populate', populate);
    
      var populate = [
        { path: "tool_category", select: "" }
      ];
      */
    
      Model.find(where, fields.join(' '), options).populate(populate).exec(function (err, docs) {
      
        if (err) {
          return next(err);
        }
      
        var response = {
          "status": "success",
          "pagination": pagination,
          "data": docs.map(function (doc) {
            return doc.toAPI ? doc.toAPI() : doc.toJSON()
          })
        }
      
        res.json(response);
      });
    
    });
    
  };
};