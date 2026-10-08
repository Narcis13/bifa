
exports.up = function(knex, Promise) {  
    return Promise.all([
      knex.schema.table('utilizatori', function(table){
        table.string('stare');
      })
    ])
  };
  
  exports.down = function(knex, Promise) {  
    return Promise.all([
      knex.schema.table('utilizatori', function(table){
        table.dropColumn('stare');
      })
    ])
  };