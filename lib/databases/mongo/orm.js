/**
 * Mongo ORM
 * 
 * @author Eugene Song <tilleps@gmail.com>
 *
 *
 *  //
 *  //  Example Usage
 *  //
 *  var orm = new ORM({
 *    table: 'Users',
 *    connection: function (cb) {
 *      manager.connection('main', 'default', cb);
 *    }
 *  });
 *
 */

var mongoose = require('mongoose');


//
//  Mongo ORM
//
function ORM(options) {

  this._options = {
    primaryKey: '_id',
    collection: null
  };
  
  for (var key in options) {
    this._options[key] = options[key];
  }  
  
  if (typeof this._options.connection !== 'function') {
    this._options.connection = function (cb) {
      cb(null, options.connection);
    }.bind(this);
  }
  
  
  if (!this._options.collection) {
    throw new Error('table not defined');
  }
}


ORM.prototype.model = function (model, cb) {
  this._options.connection(function (err, connection) {
    
    if (err) {
      return cb(err);
    }
    
    cb(null, connection.model(model));
    //cb(null, connection.collection(this._options.collection).model(model));

  }.bind(this));  
};


ORM.prototype.insert = function (data, cb) {  
  this._options.connection(function (err, db) {
    
    if (err) {
      return cb(err);
    }
    
    //  Multiple inserts support
    if (Array.isArray(data)) {
      
      db.collection(this._options.collection).insertMany(data, function (err, result) {
        
        if (err) {
          return cb(err);
        }
        
        cb(null, result.insertedCount);        
      });
      
    }
    else {
      
      db.collection(this._options.collection).insertOne(data, function (err, result) {
        
        if (err) {
          return cb(err);
        }
        
        cb(null, result.insertedId);        
      });
      
    }
    
  }.bind(this));  
};


ORM.prototype.update = function (data, where, options, cb) {

  where = where || {};
  options = options || {};
  
  if (options.limit || options.offset) {
    throw new Error('limit/options not supported for update');    
  }  
  
  //  Update ALL protection mechanism
  if (Object.keys(where).length === 0) {
    throw new Error('Empty where parameters not allowed for update, use "*" string to update all');
    return;
  }
  
  
  if (where == '*') {
    where = {};
  }
  
  
  //  Change primary key to ObjectID
  if (where.hasOwnProperty(this._options.primaryKey)) {
    where[this._options.primaryKey] = mongoose.Types.ObjectId(where[this._options.primaryKey]);
  }
  
  
  this._options.connection(function (err, db) {
    
    if (err) {
      return cb(err);
    }
    
    db.collection(this._options.collection).updateMany(where, { $set: data }, function (err, result) {
      if (err) {
        return cb(err);
      }
      
      cb(null, result.modifiedCount);
    });
    
  }.bind(this));  
};



ORM.prototype.updateById = function (id, data, options, cb) {
  this._options.connection(function (err, db) {
    
    if (err) {
      return cb(err);
    }
    
    //  Find and Update
    var where = {};
    where[this._options.primaryKey] = mongoose.Types.ObjectId(id);      
    
    db.collection(this._options.collection).findOneAndUpdate(where,
      { $set: data },
      { returnOriginal: false },
      function (err, doc) {
        cb(err, doc);
      }
    );
    
  }.bind(this));  
};


ORM.prototype.delete = function (where, options, cb) {
  
  options = options || {};
  where = where || {};
  
  
  //  Update ALL protection mechanism
  if (Object.keys(where).length === 0) {
    throw new Error('Empty where parameters not allowed for delete, use "*" string to delete all');
    return;
  }
  
  
  if (where == '*') {
    where = {};
  }
  
  
  //  Change primary key to ObjectID
  if (where.hasOwnProperty(this._options.primaryKey)) {
    where[this._options.primaryKey] = mongoose.Types.ObjectId(where[this._options.primaryKey]);
  }
  
  
  this._options.connection(function (err, db) {
    
    if (err) {
      return cb(err);
    }
    
    db.collection(this._options.collection).deleteMany(where, function (err, result) {
      if (err) {
        return cb(err);
      }
      
      cb(null, result.deletedCount);
    });
    
  }.bind(this));
};


ORM.prototype.deleteById = function (id, options, cb) {
  this._options.connection(function (err, db) {
    
    if (err) {
      return cb(err);
    }
    
    var where = {};
    where[this._options.primaryKey] = mongoose.Types.ObjectId(id);    
    
    db.collection(this._options.collection).deleteOne(where, function (err, result) {
      if (err) {
        return cb(err);
      }
      
      cb(null, result.deletedCount);
    });
    
  }.bind(this));
};


ORM.prototype.fetchById = function (id, options, cb) {
  this._options.connection(function (err, db) {
    
    if (err) {
      return cb(err);
    }
    
    var where = {};
    where[this._options.primaryKey] = mongoose.Types.ObjectId(id);
    
    db.collection(this._options.collection).find(where).limit(1).toArray(function (err, docs) {
      if (err) {
        return cb(err);
      }

      cb(null, docs[0]);
    });
    
  }.bind(this));
};


ORM.prototype.fetchOne = function (where, options, cb) {
  
  options.limit = 1;
  
  this.fetchAll(where, options, function (err, docs) {
    
    if (err) {
      return cb(err);
    }
    
    cb(null, docs[0])
  });
};


ORM.prototype.fetchAll = function (where, options, cb) {

  options = options || {};
  where = where || {};
  
  //  Change primary key to ObjectID
  if (where.hasOwnProperty(this._options.primaryKey)) {
    where[this._options.primaryKey] = mongoose.Types.ObjectId(where[this._options.primaryKey]);
  }
  
  
  this._options.connection(function (err, db) {
    
    if (err) {
      return cb(err);
    }
    
    db.collection(this._options.collection).find(where, options).toArray(function (err, docs) {
      if (err) {
        return cb(err);
      }

      cb(null, docs);
    });
  }.bind(this));  
};



module.exports = ORM;