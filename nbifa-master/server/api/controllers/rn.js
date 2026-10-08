
const knex =require('../../dbaky.js');


module.exports.toatestarile = (req,res,next) => {
  
    
  
  
 }

module.exports.antet_rn_nou = (req,res,next) => {

  console.log("sunt in controllerul referate necesitate actiunea antet nou",req.body);

  knex('antetrn').insert({

    "data":req.body.data,
    "obiect_achizitie":req.body.obiect_achizitie,
    "justificare":req.body.justificare,
    "valoare":req.body.valoare,
    "id_compartiment":req.body.id_compartiment,
    "id_stare":1,
      
    data_creere:knex.fn.now(),//new Date().toISOString(),
    data_modificare:knex.fn.now()//new Date().toISOString()

    
}).then((d)=>{
 // console.log('Material adaugat',d)
  return res.status(200).json({
    message: "Antet RN adaugat",
    id:d[0],
   // datacreere:knex.fn.now(),
   // datamodificare:knex.fn.now()
  })
}).catch(err =>{ console.log(err)})
}

module.exports.detalii_noi = (req,res,next) => {
  console.log("sunt in controllerul referate necesitate actiunea detalii noi",req.body);
  let linii=[];
  req.body.tranzactii.map(t=>{
    linii.push({
      id_Antet:req.body.idAntet,
      idpozPAAP:t.idpozPAAP,
      denumire:t.denumire,
      codcpv:t.codcpv,
      detalii_tehnice:t.detalii_tehnice,
      cantitate:t.cantitate,
      pret:t.pret,
      valoare:t.valoare
    })
  })

  knex('detaliirn').insert(linii).then((d)=>{
    
     return res.status(200).json({
       message: "Tranzactii adaugate"
     })
   }).catch(err =>{ console.log(err)})

}

module.exports.toate_referatele=(req,res,next)=> {
  let op="=";
  if(req.params.idcomp==="Niciunul"){
    return res.status(401).json({
      message: "Cimpuri vide!"
    })
  } else if(req.params.idcomp=="0") op=">" 

  console.log("sunt in controllerul referate necesitate actiunea TOATE")
  knex.select(['antetrn.id','antetrn.data','antetrn.obiect_achizitie','antetrn.valoare','antetrn.id_compartiment','compartimente.denumire','antetrn.data_modificare','stari_documente.stare'])
  .from('antetrn')
  .innerJoin('stari_documente','antetrn.id_stare','stari_documente.id')
  .innerJoin('compartimente','antetrn.id_compartiment','compartimente.id')
  .where('antetrn.id_compartiment',op,parseInt(req.params.idcomp))
  .orderBy('antetrn.id','desc').then((rows)=>{
    return res.status(200).json({
     message: "Toate referatele",
     referate:rows
   });
  }).catch(err =>{})

}