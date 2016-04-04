var mysql = require('mysql');






function Manager() {
  this._configs = {};
  this._poolClusters = {};
}


//  Get/Set Configs
//
//  @param string clusterKey
//  @param string|object dbKey
//  @param object config
//  @return object
//
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
    
    return this._configs[clusterKey] || {};
  }
  
  
  //
  //  2 Arguments
  //
  if (arguments.length == 2) {
    
    //  Getter
    if (typeof dbKey == 'string') {
      return this._configs[clusterKey][dbKey] || {};          
    }
    
    //
    //  Setter
    //
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
    this._configs[clusterKey][dbKey] = config;
    return this;
  }
  
  
  throw new Error('Unsupported arguments for poolCluster config');
  
};


//
//  PoolCluster
//
//  @param string clusterKey
//  @return PoolCluster
//
Manager.prototype.poolCluster = function (clusterKey) {
  
  //
  //  Create PoolCluster If Not Exists
  //
  if (!this._poolClusters[clusterKey]) {
    this.createPoolCluster(clusterKey);
  }
  
  return this._poolClusters[clusterKey];    
};


//
//  Get Connection Pool
//
//  @param string clusterKey
//  @param string dbKey
//  @return Connection
//
Manager.prototype.pool = function (clusterKey, dbKey) {
  return this.poolCluster(clusterKey).of(dbKey);
};


//
//  Create PoolCluster
//
//  @param string clusterKey
//  @return this
//
Manager.prototype.createPoolCluster = function (clusterKey) {
  
  //  Check for existing configs for clusterKey
  if (!this._configs[clusterKey]) {
    throw new Error('No config found for cluster key: ' + clusterKey);
  }
    
    
  //
  //  Create PoolCluster
  //
  this._poolClusters[clusterKey] = mysql.createPoolCluster({
    canRetry: true, // Default: true
    removeNodeErrorCount: 1, //  Default: 5, Set to 1 to remove immediately when connection fails
    restoreNodeTimeout: 5000, // Default: 0
    defaultSelector: 'RR' // RR (Round-Robin), RANDOM, ORDER
  });

  for (var dbKey in this._configs[clusterKey]) {
    this._poolClusters[clusterKey].add(dbKey, this._configs[clusterKey][dbKey]);      
  }
  
  return this;
};


//
//  Remove PoolCluster
//
//  @param string clusterKey
//  @param function cb
//  @return this
//
Manager.prototype.removePoolCluster = function (clusterKey, cb) {
  this._poolClusters[clusterKey] = null;
  
  if (this._poolClusters[clusterKey]) {
    this._poolClusters[clusterKey].end(cb);      
  }
  
  return this;
};


//
//  Get Connection
//
//  @param string clusterKey
//  @param string dbKey
//  @param function cb
//
Manager.prototype.connection = function (clusterKey, dbKey, cb) {
  return this.pool(clusterKey, dbKey).getConnection(cb);
};


//
//  Escape
//
//  @param mixed value
//  @return mixed
//
Manager.prototype.escape = function (value) {
  return mysql.escape(value);
};


//
//  Escape Identifier
//
//  @param string identifier
//  @return string
//
Manager.prototype.escapeId = function (identifier) {
  return mysql.escapeId(identifier);
};


module.exports = Manager;
