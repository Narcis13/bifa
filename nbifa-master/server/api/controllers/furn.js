const knex =require('../../dbaky.js');
const moment = require('moment');
module.exports.toti = (req,res,next)=> {

  console.log('Toti furnizorii compartimentului...',req.params.idcomp)

  knex('furnizori').where({'addedby':req.params.idcomp,'stare':'activ'}).orderBy('id', 'desc').then(r=>{

    return res.status(200).json({
      message: "toti furnizorii",
      furnizori:r
    });
  }).catch(err =>{console.log(err)})


}

module.exports.toateangajamentele = (req,res,next)=> {

  console.log('Toate angajamentele compartimentului...',req.params.idcomp,moment().startOf('year').format('YYYY-MM-DD'))

  knex.select(['contracte.id','contracte.numar','contracte.dindata','contracte.numepartener','contracte.valoare','anteteangajamente.detalii']).from('contracte').innerJoin('anteteangajamente','anteteangajamente.id','contracte.idAng').where({'addedby':req.params.idcomp,'contracte.stare':'activ'}).andWhere('contracte.dindata','>=',moment().startOf('year').format('YYYY-MM-DD')).orderBy('id', 'desc').then(r=>{

    return res.status(200).json({
      message: "toate angajamentele ",
      angajamente:r
    });
  }).catch(err =>{console.log(err)})


}

module.exports.furnizor_nou=(req,res,next)=>{
  console.log('FURNIZOR NOU...',req.body)
  knex('furnizori').insert({
    denumire:req.body.numefurnizor,
    codfiscal:req.body.cui,
    iban:req.body.iban,
    email:req.body.mail,
    localitate:req.body.localitate,
    judet:req.body.judet,
    addedby:req.body.addedby,
    dindata:moment().format('YYYY-MM-DD'),
    stare:'activ',
    idc:8,
  
  
}).then((d)=>{
  return res.status(200).json({
    message: "Furnizor adaugat!",
    id:d[0]

  })
}).catch(err =>{ console.log(err)})
  

}

module.exports.anglegal_nou=(req,res,next)=>{
  console.log('Angajament legal NOU...',req.body)
  knex('contracte').insert({
    idAng:req.body.idAng,
    numepartener:req.body.numepartener,
    partenerID:req.body.furnizor,
    numar:req.body.nrcontract,
    valoare:req.body.valoare,
    dindata:req.body.datacontract,
    addedby:req.body.addedby,
    //dindata:moment().format('YYYY-MM-DD'),
    stare:'activ',
    idc:8,
    tip:'achizitii',
    durata:12
  
  
}).then((d)=>{
  return res.status(200).json({
    message: "Angajament legal adaugat!",
    id:d[0]

  })
}).catch(err =>{ console.log(err)})
  

}

module.exports.stergfurnizor=(req,res,next)=>{

  console.log('sterg furnizor',req.params.idf)
  knex('furnizori').where({
    id: req.params.idf
  }).update({stare:'inactiv'})
  .then(()=>{
    return res.status(200).json({
      message: "Furnizor sters"
  
    })
  
  }).catch(err =>{})
}

module.exports.stergangajament=(req,res,next)=>{

  console.log('sterg angajament',req.params.idf)
  knex('contracte').where({
    id: req.params.idf
  }).update({stare:'inactiv'})
  .then(()=>{
    return res.status(200).json({
      message: "Ang legal sters"
  
    })
  
  }).catch(err =>{})
}