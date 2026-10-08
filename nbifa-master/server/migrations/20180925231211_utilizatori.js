
exports.up = function(knex, Promise) {
    return Promise.all([

        knex.schema.createTable('utilizatori', function(table) {
            table.increments('id').primary();
            table.string('username');
            table.string('password');
            table.string('name');
            table.string('email');
            table.string('stare');
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('utilizatori')
   
    ])
};
