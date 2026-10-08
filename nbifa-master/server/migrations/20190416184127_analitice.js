exports.up = function(knex, Promise) {
    return Promise.all([

        knex.schema.createTable('analitice', function(table) {
            table.increments('id').primary();
            table.string('cont');
            table.string('explicatii');
            table.integer('idsintetic');
            table.string('stare');
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('analitice')
   
    ])
};


