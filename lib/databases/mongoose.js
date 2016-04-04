/**
 * Mongoose Connections Manager
 *
 * @author Eugene Song <tilleps@gmail.com>
 * @todo Needs better separation of created connections and available
 * @todo Fix issue of Schemas not working properly
 */

var mongoose = require('mongoose');



function Manager() {
  this._options = {
    reconnectDelay: 5000
  };
  this._configs = {};
  this._connections = {};
  this._timestamps = {};
}


Manager.prototype.config = function (clusterKey, dbKey, config) {
  
  //
  //  0 Arguments (Get all configs)
  //
  if (arguments.length === 0) {
    return this._configs;
  }
  
  
  //
  //  1 Arguments 
  //
  if (arguments.length == 1) {
    
    if (typeof clusterKey == 'object') {
      config = clusterKey;
      this._configs = config;        
      return this;        
    }
    
    return this._configs[clusterKey];
    //return this._configs[clusterKey] || {};
  }
  
  
  //
  //  2 Arguments
  //
  if (arguments.length == 2) {
    
    //
    //  Getter
    //
    if (typeof dbKey == 'string') {
      
      if (!this._configs[clusterKey]) {
        return;
      }
      
      return this._configs[clusterKey][dbKey];          
    }
    
    
    //
    //  Setter
    //
    if (typeof dbKey === 'undefined') {
      throw new Error('Config undefined for cluster key: ' + clusterKey);
    }
    
    
    if (typeof dbKey != 'object') {
      throw new Error('Invalid config format for cluster key: ' + clusterKey);
    }
    
    //  Set config for cluster
    config = dbKey;
    this._configs[clusterKey] = config;
    
    return this;
  }
  
  
  //
  //  3 Arguments
  //
  if (arguments.length == 3) {
    this._configs[clusterKey] = this._configs[clusterKey] ? this._configs[clusterKey] : {};    
    this._configs[clusterKey][dbKey] = config;
    return this;
  }
  
  
  throw new Error('Unsupported arguments for connection manager');
    
};



Manager.prototype.connections = function () {
  
  for (var clusterKey in this._configs) {
    
    if (this._configs[clusterKey]) {
      for (var dbKey in this._configs[clusterKey]) {
        this.connect(clusterKey, dbKey, function () {});
      }
    }
    
  }
  
  
  return this._connections;
};


Manager.prototype.connection = function (clusterKey, dbKey, cb) {
  
  if (this._connections[clusterKey] && this._connections[clusterKey][dbKey]) {
    
    if (cb) {
      cb(null, this._connections[clusterKey][dbKey]);
    }
    
    return this._connections[clusterKey][dbKey];
  }
  
  this.connect(clusterKey, dbKey, cb);
  
  return this._connections[clusterKey][dbKey];
};


Manager.prototype.connect = function (clusterKey, dbKey, cb) {
  
  //
  //  Return existing/created connection
  //
  if (this._connections[clusterKey] && this._connections[clusterKey][dbKey]) {
    
    //
    //  Re-create connection after reconnect delay
    //  potential memory leak
    //
    if (typeof this._connections[clusterKey][dbKey].readyStatus === 'undefined'
      && (Date.now() - this._options.reconnectDelay) >= this._timestamps[clusterKey][dbKey]
    ) {
      //  Delete cached connection to create a new one
      delete this._connections[clusterKey][dbKey];
    }
    else {
    
      //  Asynchronous
      if (typeof cb === 'function') {
        return cb(null, this._connections[clusterKey][dbKey]);  
      }
    
      //  Synchronous
      return this._connections[clusterKey][dbKey];
      
    }
    
  }
  
  
  //
  //  Check for required keys
  //
  if (typeof clusterKey !== 'string' || typeof dbKey !== 'string') {
    
    //  Asynchronous
    if (typeof cb === 'function') {
      return cb(new Error('Connection missing valid clusterKey and dbKey'));
    }
    
    //  Synchronous
    throw new Error('Connection missing valid clusterKey and dbKey');
  }
  
  
  //
  //  Create New Connection from Config
  //
  var dbConfig = this.config(clusterKey, dbKey);
  
  if (typeof dbConfig === 'undefined') {
    
    //  Asynchronous
    if (typeof cb === 'function') {
      return cb(new Error('Config not found for: ' + clusterKey + ' ' + dbKey));      
    }    
    
    //  Synchronous
    throw new Error('Config not found for: ' + clusterKey + ' ' + dbKey);
  }
  
  if (!dbConfig.uri) {
    
    //  Asynchronous
    if (typeof cb === 'function') {
      return cb(new Error('uri not defined for: ' + clusterKey + ' ' + dbKey));
    }    
    
    //  Synchronous
    throw new Error('uri not defined for: ' + clusterKey + ' ' + dbKey);
  }
  
  
  //  Temp: Config override
  dbConfig.options = dbConfig.options || {};
  dbConfig.options.db = dbConfig.options.db || {};
  dbConfig.options.db.bufferMaxEntries = 0;
  
  dbConfig.options.server = dbConfig.options.server || {};
  dbConfig.options.server.autoReconnect = true;
  
  dbConfig.options.socketOptions = dbConfig.options.socketOptions || {};
  dbConfig.options.socketOptions.keepAlive = 1;
  //dbConfig.options.socketOptions.connectTimeoutMS = 1000;
  
  
  //
  //  Create connection
  //
  var connection = mongoose.createConnection(dbConfig.uri, dbConfig.options);
  
  //*
  //  Uncaught Exception on Failed Initial Connection Workaround
  //  
  //  The auto_reconnect feature does not work when connection fails on startup/initial
  //  connection, causing a uncaught exception to be thrown immediately on startup.
  //
  connection.once('error', function (err) {
    console.log('MONGOOOOSE error', arguments);
  });
  //*/
  
  //  Setup mongoose schemas
  if (dbConfig.schemas && typeof dbConfig.schemas === 'function') {
    dbConfig.schemas(connection);
  }

  
  if (!this._connections.hasOwnProperty(clusterKey)) {
    this._connections[clusterKey] = {};
    this._timestamps[clusterKey] = {};
  }
  this._connections[clusterKey][dbKey] = connection;

  //  Record timestamp of connection creation
  //  So reconnects can be attempted later
  this._timestamps[clusterKey][dbKey] = new Date().getTime();
  
  
  //
  //  Return Connection
  //
  
  //  Asynchronous
  if (typeof cb === 'function') {
    return cb(null, connection);
  }
  
  //  Synchronous
  return this._connections[clusterKey][dbKey];
};




Manager.prototype.connected = function (clusterKey, dbKey, cb) {
  
  this.connect(clusterKey, dbKey, function (err, connection) {
    
    if (err) {
      return cb(err);
    }
    
    //
    //  Return connected connections
    //
    if (connection.readyState === 1) {
      return cb(null, connection);
    }
    
    
    //
    //  Wait for connecting connections
    //  @todo potential issue of double calls
    //
    if (connection.readyState === 2) {
      connection.once('open', function () {
        cb(null, connection);
      });
      
      connection.once('error', function (err) {
        cb(err);
      });
      
      return;
    }
    
    
    //
    //  Treat other readyState as disconnected
    //  readyState 0(disconnected), 3(disconnecting)
    //
    console.log('connection state: ' + connection.readyState);
    cb(new Error('Database unavailable'));
    
    
  });
  
};



//
//  Disconnect
//  @todo test
//
Manager.prototype.disconnect = function (clusterKey, dbKey, cb) {
  
  cb = cb || function () {};
  
  this.connection(clusterKey, dbKey, function (err, connection) {
    
    if (err) {
      return cb(err);
    }
    
    
    //
    //  Connection already closed
    //
    if (connection.readyState === 0) {
      cb(null, connection);
      return;
    }
    
    
    //
    //  Close connection immediately
    //
    if (connection.readyState === 1) {
      connection.db.close();
      
      cb(null, connection);
      return;
    }
    
    
    //
    //  Defer closing connection when connecting/disconnecting
    //
    if (~[2, 3].indexOf(connection.readyState)) {
      connection.db.once('open', function () {
        connection.db.close();
      });
      
      cb(null, connection);
      return;
    }    
    
    
    throw new Error('Unknown ready state');
    
  });
  
  return this;
};


//
//  Reconnect
//  @todo test
//
Manager.prototype.reconnect = function (clusterKey, dbKey, cb) {    
  this.disconnect(clusterKey, dbKey, function (err, connection) {
    
    if (err) {
      return cb(err);
    }
    
    //  Remove cached connection
    //  @todo possible memory leak: delete all event listeners
    if (this._connections[clusterKey] && this._connections[clusterKey][dbKey]) {
      delete this._connections[clusterKey][dbKey];
    }
    
    
    this.connected(clusterKey, dbKey, cb);
        
  }.bind(this));
  
  return this;
};





module.exports = Manager;