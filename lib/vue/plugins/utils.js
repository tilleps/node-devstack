(function () {

  function serializeForm(elements, values) {
    
    values = values || {};
    
    for (var i = 0; i < elements.length; i++) {
      
      switch (elements[i].type) {          
        case 'checkbox':
        case 'hidden':
        case 'radio':
        case 'select-one':
        case 'select-multiple':
        case 'text':
        case 'textarea': {
          
          //
          //  @todo recursive URI to object (key[1][] = value), currently only supports 1 depth
          //
          if((/^\w+\[\w*\]$/).test(elements[i].name)) {
            //
            //  Process keys that have brackets
            //
            var matches = elements[i].name.match(/^(\w+)\[(\w*)\]$/);
            if(typeof values[matches[1]] === 'undefined') {
                values[matches[1]] = [];
            }
            
            if (matches[2] == '') {
              //  Add to array
              values[matches[1]].push(decodeURIComponent(elements[i].value));                    
            }
            else {
              //  Add key and value
              values[matches[1]][matches[2]] = decodeURIComponent(elements[i].value);
            }
              
          }
          else {
            
            //
            //  Multiple values
            //
            if (elements[i].multiple) {
              
              if (typeof values[elements[i].name] !== []) {
                values[elements[i].name] = [];
              }
              
              for (var j = 0; j < elements[i].length; j++) {
                if (elements[i][j].selected) {
                  console.log('V', elements[i].name, elements[i][j].value);
                  values[elements[i].name].push(elements[i][j].value);
                }
              }
            }
            else {                  
              values[elements[i].name] = decodeURIComponent(elements[i].value);
            }
            
          }
          
          
          /*
          //  Recurse into array: key[]
          if (elements[i].name.match(/\[|\]/) && elements[elements[i].name]) {
            serializeForm(elements[elements[i].name], values);
          }
          else {                
            values[elements[i].name] = elements[i].value;
          }
          */
          break;
        };
      
        default: {            
          console.log('type', elements[i].type);
          break;
        }
      }
    
    
    }
    
    return values;
  }


  function install (Vue, options) {    
    Vue.prototype.serializeForm = serializeForm;  
  }

  if (typeof exports == "object") {
    module.exports = install
  } else if (typeof define == "function" && define.amd) {
    define([], function(){ return install })
  } else if (window.Vue) {
    Vue.use(install)
  }

})();