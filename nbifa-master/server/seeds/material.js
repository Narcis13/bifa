const knex =require('../db.js');

console.log('SEED MATERIALE.....');
let m=[{
    denumire:'Saminta material 1',
    um:'buc',
    pretpredefinit:13,
    idgestiune:1,
    iduser:3,
    stare:'activ',
        
    datacreere:knex.fn.now(),//new Date().toISOString(),
    datamodificare:knex.fn.now()//new Date().toISOString()

    
},
{
    denumire:'Saminta material 2',
    um:'buc',
    pretpredefinit:14,
    idgestiune:1,
    iduser:3,
    stare:'activ',
        
    datacreere:knex.fn.now(),//new Date().toISOString(),
    datamodificare:knex.fn.now()//new Date().toISOString()

    
}]

knex('materiale').insert(m).then((d)=>{
    console.log('Material adaugat',d)
    
  }).catch(err =>{ console.log(err)})