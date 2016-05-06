
/**
 * Example Mongoose Schema Format:
 * 
 * "example_schema_key": {
 *   "type": mongoose.Schema.Types.ObjectId,
 *   "ref": "ExampleModel",
 * },
 */

function addOneToManyValidator(Model, Submodel, path, foreignKey) {
  
  foreignKey = foreignKey || '_id';
  
  Model.schema.path(path).validate(function (values, respond) {
    
    Submodel
      .find()
      .select('')
      //.where(where)
      .where(foreignKey).in(values)
      .exec(function(err, result) {
        if (err) {
          return respond(false, 'Error for: ' + path + ' ' + err);
        }
        
        if (values.length !== result.length) {
          var msg = 'Subdocuments for ' + Model.modelName + '.' + path + ' (' + Submodel.modelName + ') could not be found';
          return respond(false, msg);
        }
        
        respond();
      });
    
  });
}


function addOneToOneValidator(Model, Submodel, path, foreignKey) {
  
  foreignKey = foreignKey || '_id';
  
  Model.schema.path(path).validate(function (value, respond) {
    
    //console.log('validate', path);
    
    Submodel
      .find()
      .select('')
      .where(foreignKey).equals(value)
      .exec(function(err, result) {
        if (err) {
          return respond(false, 'Error for: ' + path + ' ' + err);
        }
        
        if (!result) {
          var msg = 'Subdocument (' + Submodel.modelName + ') could not be found for ' + Model.modelName + '.' + path;
          return respond(false, msg);
        }
        
        respond();
      });
    
  });
}


function addUniqueValidator(Model, path) {
  Model.schema.path(path).validate(function (value, respond) {
    
    var where = {};
    where['_id'] = { $ne: this._id };  // Exclude self
    where[path] = value;
    
    //  Only return the ID - minimize data transfer/output
    Model.findOne(where, '_id', function (err, doc) {
      if (err) {
        return respond(false, 'Database error: ' + err);        
      }
      
      if (doc) {
        return respond(false, path + ' already exists: ' + value);
      }
      
      return respond();      
    });
    
  });
}




/**
 * Add Ref Validators to Check for Valid Children
 * 
 * //
 * //  List the models to use
 * //
 * var Models = {
 *   Example: Model,
 *   DistributionStatus: db.model('DistributionStatus'),
 *   Region: db.model('Region'),
 *   Supply: db.model('Supply'),
 *   Tool: db.model('Tool'),
 *   ToolCategory: db.model('ToolCategory'),
 *   VehicleModel: db.model('VehicleModel'),
 *   VehicleSubsystem: db.model('VehicleSubsystem')
 * };
 * 
 * // or
 * var Models = function (ref) {
 *   var list = {
 *     example: Model
 *   };
 *   return list[ref];
 * };
 * 
 */
function addRefValidators(Model, Models) {
  
  
  Models = Models || {};
  
  
  var schema;
  for (var key in Model.schema.paths) {
    
    schema = Model.schema.paths[key];
    
    
    //
    //  Skip/Ignore refs
    //
    if (key.substr(0, 5) === '_refs' || ~['__v'].indexOf(key)) {
      //console.log('skipping:', key);
      continue;
    }

    
    //
    //  Add Validator for unique keys
    //
    if (schema.options.unique) {      
      addUniqueValidator(Model, schema.path);
    }
    
  
    //
    //  Reference / Parent/Child Support
    //
    var ref = Array.isArray(schema.options.type) ? schema.options.type[0].ref : schema.options.ref;
  
    if (ref) {
      
      var refModel = typeof Models === 'function' ? Models(ref) : Models[ref];
      
      //
      //  Check for valid model
      //
      if (!refModel) {
        throw new Error('Missing model for ref: ' + ref);
      }
      
      if (Array.isArray(schema.options.type)) {
      
        //
        //  Skip the ones with limits? (going to be overwritten anyway)
        //  Add validator only to those that don't have limits
        //
        var limit = schema.options.type[0].limit;
        if (typeof limit === 'undefined' || ~[null, false].indexOf(limit)) {
          //  OneToMany Relationships
          //methods.addOneToManyValidator(Tool, schema.path, ref);
          addOneToManyValidator(Model, refModel, schema.path);
        }
        else {
          //  Skipping validation on children that have limit
          //  Limit indicates to load
          //console.log('skipping (limit)', key);
        }
      
      }    
      else {
        //  OneToOne Relationships
        //methods.addOneToOneValidator(Tool, schema.path, ref);
        addOneToOneValidator(Model, refModel, schema.path);
      }
    
    }
  
  }
}


module.exports.addOneToManyValidator = addOneToManyValidator;
module.exports.addOneToOneValidator = addOneToOneValidator;
module.exports.addRefValidators = addRefValidators;