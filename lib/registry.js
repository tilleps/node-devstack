

var requireDir = require('require-dir');



function Registry() {  
  this._registry = {};
  this._instances = {};  
}



Registry.prototype.load = function (path) {
  var items = requireDir(path, { recurse: false });
  
  for (var key in items) {
    this.set(key, items[key]);
  }
  
  return this;
};


Registry.prototype.register = function (key, value) {
  
  //  Check format
  
  this._registry[key] = value;
  return;
};

Registry.prototype.unregister = function (key) {
  delete this._registry[key];
  delete this._instances[key];
  return this;
};


Registry.prototype.get = function (key) {
  return this._registry[key];
};


Registry.prototype.instance = function (key) {
  if (!this.has(key)) {
    throw new Error('Key not registered in registry: ' + key);
  }
  
  if (!this._instances.hasOwnProperty(key)) {
    //args = arguments.slice(1)
    //args.unshift(this);
    //Function.prototype.bind.apply(this._registry[key], args)
    this._instances[key] = this._registry[key](this, key);
  }
  
  return this._instances[key];
};


Registry.prototype.factory = function (key) {
  if (!this.has(key)) {
    throw new Error('Key not registered in registry: ' + key);
  }
  
  return this._registry[key](this, key);
};


Registry.prototype.has = function (key) {
  return this._registry.hasOwnProperty(key) ? true : false;
};







module.exports = Registry;









