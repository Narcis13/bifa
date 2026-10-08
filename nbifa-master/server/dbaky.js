var config      = require('./knexfile.js');  
var env         = 'aky';  
var knex        = require('knex')(config[env]);

module.exports=knex;