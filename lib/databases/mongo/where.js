

//
//  @todo cleanup
//  @todo unit testing
//  @author Eugene Song <tilleps@gmail.com>
//  


//
//  http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
//
function escapeRegExp(str) {
  //  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}




/*


/api/tools/?_limit=100&_where[0][name][starts]=E

where:
  =   equals          value equals
  <   lt              less than
  <=  lte             less than equal to
  >   gt              greater than
  >=  gte             greater than equal to   
  ^   starts          starts with
  $   ends            ends with
  *   regex           regex expression
  +   contains        contains with
  !+  not-contains    does not contain without
  +   with            
  !+  without         
  ?   blank           is blank
  !?  not-blank       is not blank
  ?   empty           empty
  !?  nonempty        has a value
  -   between         between values
      before          before time
      after           after time
      starting        starting time
      ending          ending time
      between         between times (comma separated values)
      in              in (comma separated values)
      nin             not in (comman separated values)
*/


function createWhere(wheres) {
  
  var ors = [];
  wheres = wheres || [];
  
  for (var i = 0, where; i < wheres.length; i++) {
    where = {};
    
    Object.keys(wheres[i]).forEach(function (key) {
      
      //  Define value type if not exists
      if (typeof where[key] === 'undefined') {
        where[key] = {};
      }
      
      
      //
      //  Convert key => value associations to: key => { $eq: value }
      //
      if (typeof wheres[i][key] === 'string') {
        wheres[i][key] = {
          'eq': wheres[i][key]
        };
      }
      
      
      //  Catch invalid formats
      if (typeof wheres[i][key] !== 'object') {
        throw new Error('Invalid where format');
      }
      
      //
      //  Map each value
      //      
      Object.keys(wheres[i][key]).forEach(function (operator) {
        
        var value = wheres[i][key][operator];
        
        switch (operator) {
        
          case 'in':
            where[key]['$in'] = Array.isArray(value) ? value : value.split(',');
            break;
      
          case 'nin':
            where[key]['$nin'] = Array.isArray(value) ? value : value.split(',');
            break;
          
          case 'eq':
          case 'equals':
            where[key]['$eq'] = value;
            break;
          
          
          case 'ne':
            where[key]['$ne'] = value;
            break;
          
          
          case 'gt':
            where[key]['$gt'] = value;
            break;          
          
          case 'gte':
            where[key]['$gte'] = value;
            break;
          
          
          case 'lt':
            where[key]['$lt'] = value;
            break;
          
          
          case 'lte':
            where[key]['$lte'] = value;
            break;
          
          
          case 'starts':
            where[key]['$regex'] = new RegExp("^" + escapeRegExp(value), "i");
            break;
          
          
          case 'ends':
            where[key]['$regex'] = new RegExp(escapeRegExp(value) + "$", "i");
            break;
          
          //  @todo replace with $text
          case 'with':
            where[key]['$regex'] = new RegExp(escapeRegExp(value), "i");
            break;
          
          
          case 'without':
            where[key]['$regex'] = new RegExp("^((?!" + escapeRegExp(value) + ").)*$", "i");
            break;
          
          
          case 'blank':
          case 'empty':
            where[key]['$exists'] = false;
            break;
          
          
          case 'exists':
          case 'notblank':
          case 'nonempty':
            where[key]['$exists'] = true;
            break;
          
          
          default:
            console.log('unsupported operator', operator);
            break;            
          
        }
        
        
      });
      
    });
    
    ors.push(where);
    
  }
  
  
  if (ors.length > 1) {
    return {
      '$or': ors
    }
  }
  
  //console.log('ors', ors, ors.length);
  
  return (ors.length == 1) ? ors[0] : {};
}


module.exports = createWhere;


/*
 * Testing
 * 
var where = [
  {
    name: {
      "equals": "Bob",
      "without": "Marley" 
    },
  },
  {
    name: {
      "lt": "40",
      "lte": "41",
      "gt": "20",
      "gte": "21",
      "starts": "B",
      "ends": "b"
    }
  }   
];


var obj = createWhere(where);

console.log('obj', obj);
//*/

