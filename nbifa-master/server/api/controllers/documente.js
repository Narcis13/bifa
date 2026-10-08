const knex =require('../../db.js');
/*const User = require("../models/user");*/

module.exports.tipuridocumente = (req, res, next) => {
    console.log('sunt in controllerul documente actiunea tipuridocumente....')
    knex('tipuridocumente').orderBy(['prioritate']).then((rows)=>{
        return res.status(200).json({
         message: "Toate tipurile de documenete",
         tipuridocs:rows
       });
      }).catch(err =>{})

}

module.exports.modoc = (req,res,next) =>{
console.log('Sunt in controllerul documente actiunea modofoca document',req.params.iddoc)

knex.select(['operatiuni.idtipoperatiuni', 'operatiuni.tipoperatiune', 'operatiuni.data' ,'operatiuni.nrdoc', {categorie:'categorii.denumire'}, {gestiune:'gestiuni.denumire'}, {loc:'locuri.denumire'}, {material:'materiale.denumire'},'tranzactii.um','tranzactii.cantitate_debit','tranzactii.cantitate_credit','tranzactii.pret','tranzactii.debit','tranzactii.credit','tranzactii.stare_material','tranzactii.tip_material','tranzactii.id_categ','tranzactii.id_locdispunere',{id_material:'materiale.id'}])
.from('tranzactii')
.innerJoin('operatiuni','operatiuni.id','tranzactii.idAntet')
.innerJoin('categorii','categorii.id','tranzactii.id_categ')
.innerJoin('gestiuni','gestiuni.id','tranzactii.id_gestiune')
.innerJoin('locuri','locuri.id','tranzactii.id_locdispunere')
.innerJoin('materiale','materiale.id','tranzactii.id_reper')
.whereRaw('tranzactii.stare=? and tranzactii.idAntet = ? ',['ACTIV',req.params.iddoc])
.then( rows=>{
    //console.log(rows)
    return res.status(200).json({
      message: "Document pentru modificat",
      doc:rows
    });
 

})
.catch(err =>{console.log(err)})

}


module.exports.stocPretMediu = (req,res,next) => {

  console.log("sunt in controllerul documente actiunea stoc pret mediu",req.body);

  let sql=`SELECT 
m.denumire,
m.um,
m.cod_import,
tranzactii.stare_material,
tranzactii.id_reper,
    sum(tranzactii.cantitate_debit) as ti,
    sum(tranzactii.cantitate_credit) as te,

    sum(tranzactii.debit) as vi,
    sum(tranzactii.credit) as ve,
    sum(tranzactii.cantitate_debit)-sum(tranzactii.cantitate_credit) as stoc,
    sum(tranzactii.debit)-sum(tranzactii.credit) as valoarestoc,
    (sum(tranzactii.debit)-sum(tranzactii.credit))/(sum(tranzactii.cantitate_debit)-sum(tranzactii.cantitate_credit)) as pretmediu

FROM bifa.tranzactii
inner join materiale m on m.id=id_reper
inner join operatiuni op on op.id=idAntet
where id_categ= ? and op.stare='ACTIV' and id_gestiune= ? and id_locdispunere= ?
group by id_reper,tranzactii.stare_material
having stoc>0`;

  knex.raw(sql,[req.body.id_categ,req.body.idgestiune,req.body.idloc]).then(
    r=>{
     // console.log("Raspuns de la query stoc pret mediu",r)
     return res.status(200).json({
      message: "Stoc la pret mediu",
      stocuri:r
    });
    }
  ).catch(err =>{console.log(err)})
}


module.exports.documentnou = (req,res,next) => {

  console.log("sunt in controllerul documente actiunea document nou",req.body);

  knex('operatiuni').insert({

    "idtipoperatiuni":req.body.idtipoperatiuni,
    "tipoperatiune":req.body.tipoperatiune,
    "data":req.body.data,
    "nrdoc":req.body.nrdoc,
    "stare":"ACTIV",
     "idgestiune":req.body.idgestiune,   
    datacreere:knex.fn.now(),//new Date().toISOString(),
    datamodificare:knex.fn.now()//new Date().toISOString()

    
}).then((d)=>{
 // console.log('Material adaugat',d)
  return res.status(200).json({
    message: "Antet document adaugat",
    id:d[0],
   // datacreere:knex.fn.now(),
   // datamodificare:knex.fn.now()
  })
}).catch(err =>{ console.log(err)})
}

module.exports.documenteinterval = (req,res,next) => {
  console.log("sunt in controllerul documente actiunea documenteinterval",req.body);
  
  knex.select(['operatiuni.id', 'operatiuni.idtipoperatiuni', 'operatiuni.tipoperatiune','operatiuni.data' ,'operatiuni.nrdoc', 'operatiuni.stare','operatiuni.datacreere','operatiuni.datamodificare'])
   .from('operatiuni')
   .innerJoin('tranzactii','operatiuni.id','tranzactii.idAntet').sum('tranzactii.debit as debit').sum('tranzactii.credit as credit')
   .whereRaw('operatiuni.stare=? and operatiuni.data >= ? and operatiuni.data <= ? and operatiuni.idgestiune = ?',['ACTIV',req.body.inceput,req.body.sfirsit,req.body.idgestiune])
   .groupBy('tranzactii.idAntet')
   .then((rows)=>{
    
        return res.status(200).json({
               message: "Documente in interval",
               documente:rows
             });
  }).catch(err =>{console.log(err)})
 

}


module.exports.invalidez_document = (req, res, next) => {
  console.log('sunt in controllerul documenete actiunea INVALIDEZ....',req.params.iddoc)
  knex('operatiuni').where({
    id: req.params.iddoc
  }).update({
         
    datamodificare:knex.fn.now(),
    stare:"inactiv"
  })
  .then(()=>{
    return res.status(200).json({
      message: "Document inactivat!"
    });
  
  }).catch(err =>{})
};

module.exports.tranzactienoua = (req,res,next) =>{
  console.log("sunt in controllerul documente actiunea tranzactienoua",req.body);
  let linii=[];
  req.body.tranzactii.map(t=>{

    if(t.tip=="t"){
       //transfer
       linii.push({
        'idAntet' :t.idAntet,
        'id_categ' :t.id_categ_iesire,
        'id_reper' :t.id_reper,
        'id_gestiune':t.id_gestiune,
        'id_locdispunere' :t.id_lociesire,
        'um':t.um,
        'cantitate_debit' :0,
        'cantitate_credit' :t.cantitate,
        'pret' :t.pret,
        'debit' :0,
        'credit' :t.valoare,
        'stare_material' :t.stare_material_iesire,
        'tip_material':t.tipmaterial,
        'stare' :'ACTIV',
        'datacreere':knex.fn.now(),
        'datamodificare' :knex.fn.now()
      })   

      linii.push({
        'idAntet' :t.idAntet,
        'id_categ' :t.id_categ_intrare,
        'id_reper' :t.id_reper,
        'id_gestiune':t.id_gestiune,
        'id_locdispunere' :t.id_locintrare,
        'um':t.um,
        'cantitate_debit' :t.cantitate,
        'cantitate_credit' :0,
        'pret' :t.pret,
        'debit' :t.valoare,
        'credit' :0,
        'stare_material' :t.stare_material_intrare,
        'tip_material':t.tipmaterial,
        'stare' :'ACTIV',
        'datacreere':knex.fn.now(),
        'datamodificare' :knex.fn.now()
      })
      
    }
    else
    {
     //intrare sau iesire
     if(t.tip=="i")
        linii.push({
          'idAntet' :t.idAntet,
          'id_categ' :t.id_categ_intrare,
          'id_reper' :t.id_reper,
          'id_gestiune':t.id_gestiune,
          'id_locdispunere' :t.id_locintrare,
          'um':t.um,
          'cantitate_debit' :t.cantitate,
          'cantitate_credit' :0,
          'pret' :t.pret,
          'debit' :t.valoare,
          'credit' :0,
          'stare_material' :t.stare_material_intrare,
          'stare' :'ACTIV',
          'tip_material':t.tipmaterial,
          'datacreere':knex.fn.now(),
          'datamodificare' :knex.fn.now()
        })
     else
          linii.push({
            'idAntet' :t.idAntet,
            'id_categ' :t.id_categ_iesire,
            'id_reper' :t.id_reper,
            'id_gestiune':t.id_gestiune,
            'id_locdispunere' :t.id_lociesire,
            'um':t.um,
            'cantitate_debit' :0,
            'cantitate_credit' :t.cantitate,
            'pret' :t.pret,
            'debit' :0,
            'credit' :t.valoare,
            'stare_material' :t.stare_material_iesire,
            'stare' :'ACTIV',
            'tip_material':t.tipmaterial,
            'datacreere':knex.fn.now(),
            'datamodificare' :knex.fn.now()
          })     
    }


  })
//console.log('Ma pregatesc sa inserez linii',linii)
  knex('tranzactii').insert(linii).then((d)=>{
 // console.log('Material adaugat',d)
 if (req.body.desters>0){
   // sterg documentul anterior...
   knex('operatiuni')
   .where('id', req.body.desters)
   .del().then(()=>{console.log('sters.. ',req.body.desters)})

   knex('tranzactii')
   .where('idAntet', req.body.desters)
   .del().then(()=>{console.log('sters.. ',req.body.desters)})


 }

  return res.status(200).json({
    message: "Tranzactii adaugate"
  })
}).catch(err =>{ console.log(err)})

}

/*

*/