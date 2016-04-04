/**
 * Check Mongoose Connection
 * 
 * Uniformly handle Mongoose connections through middleware
 * May need to use combine() middleware (especialy for swagger)
 *
 * @author Eugene Song <tilleps@gmail.com>
 * @param Mongoose connection
 * @return {Function}
 */
function checkMongooseConnection(connection) {
  return function (req, res, next) {
    
    //
    //  Connecting
    //
    if (connection.readyState === 2) {      
      return next(new Error('Database is connecting'));
    }
    
    
    //
    //  Disconnected
    //
    if (connection.readyState !== 1) {
      
      console.log('readyState', connection.readyState);
      
      //throw new Error('Database disconnected');
      return next(new Error('Database disconnected'));
    }
    
    next();
  };
}


module.exports = checkMongooseConnection;