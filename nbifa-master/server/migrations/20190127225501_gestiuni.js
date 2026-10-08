exports.up = function(knex, Promise) {
    return Promise.all([

        knex.schema.createTable('gestiuni', function(table) {
            table.increments('id').primary();
            table.string('denumire');
            table.integer('userid');
            table.string('r_presedinte');
            table.string('r_membru1');
            table.string('r_membru2');
            table.string('r_membru3');
            table.string('i_presedinte');
            table.string('i_membru1');
            table.string('i_membru2');
            table.string('i_membru3');
            table.string('stare');
            table.timestamps();
        })
    ])
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('gestiuni')
   
    ])
};

