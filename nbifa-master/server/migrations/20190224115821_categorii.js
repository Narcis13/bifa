exports.up = function(knex, Promise) {
    return Promise.all([

        knex.schema.createTable('categorii', function(table) {
            table.increments('id').primary();
            table.string('denumire');
            table.integer('idgestiune');
            table.string('cont');
            table.string('contcheltuiala');
            table.string('tipmaterial');
            table.string('info');
            table.string('stare');
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('categorii')
   
    ])
};
