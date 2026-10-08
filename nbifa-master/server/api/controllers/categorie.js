const knex =require('../../db.js');


module.exports.toate = (req, res, next) => {
    console.log('sunt in controllerul categorie actiunea toate....')
    /*
    knex.select(['gestiuni.id', 'gestiuni.denumire', 'gestiuni.r_presedinte', 'gestiuni.i_presedinte' ,'utilizatori.username'])
.from('gestiuni')
.innerJoin('utilizatori','utilizatori.id','gestiuni.userid')
    */ 
   knex.select(['categorii.id', {gestiune:'gestiuni.denumire'}, 'categorii.denumire','categorii.idgestiune' ,'categorii.cont', 'categorii.contcheltuiala' ,'categorii.tipmaterial'])
   .from('categorii')
   .innerJoin('gestiuni','gestiuni.id','categorii.idgestiune').where({"categorii.stare":"activ"}).orderBy('gestiuni.denumire').then((rows)=>{
      return res.status(200).json({
       message: "Toate CATEGORIILE",
       categorii:rows
     });
    }).catch(err =>{})
}

module.exports.update = (req, res, next) => {
  const cimp=Object.keys(req.body)[0];
  const valoare = req.body[cimp];
  console.log('sunt in controllerul categorii actiunea UPDATE BUCATELE....',req.params.idcateg,cimp,valoare)
  knex('categorii').where({
    id: req.params.idcateg
  }).update({
         
    updated_at:knex.fn.now(),
    [cimp]:valoare
  })
  .then(()=>{
    return res.status(200).json({
      message: "Actualizare reusita"
    });
  
  }).catch(err =>{})

};


module.exports.update_categorie = (req, res, next) => {
  console.log('sunt in controllerul categorii actiunea UPDATE....',req.params.idcateg)
  knex('categorii').where({
    id: req.params.idcateg
  }).update({
         
    updated_at:knex.fn.now(),
    stare:"inactiv"
  })
  .then(()=>{
    return res.status(200).json({
      message: "Categorie repere stearsa!"
    });
  
  }).catch(err =>{})
};

module.exports.categoriilegestiunii = (req,res,next) =>{
  console.log('sunt in comntrolerul categorii actiunea categoriilegestiunii',req.params.idgest)
  knex.select(['categorii.id', {gestiune:'gestiuni.denumire'}, 'categorii.denumire','categorii.idgestiune' ,'categorii.cont', 'categorii.contcheltuiala' ,'categorii.tipmaterial'])
  .from('categorii')
  .innerJoin('gestiuni','gestiuni.id','categorii.idgestiune').where({"categorii.stare":"activ","categorii.idgestiune":req.params.idgest,"categorii.tipmaterial":req.params.tipmaterial}).orderBy('gestiuni.denumire').then((rows)=>{
     return res.status(200).json({
      message: "Toate CATEGORIILE",
      categorii:rows
    });
   }).catch(err =>{})

}

module.exports.categorienoua = (req,res,next) =>{

    console.log('sunt in comntrolerul categorii actiunea categorie noua',req.body)
  
    if(req.body.denumire===""||req.body.idgestiune==0){
      return res.status(401).json({
        message: "Cimpuri vide!"
      })
    }
  
    knex('categorii').where({
      denumire : req.body.denumire
    }).then((rows)=>{
        if(rows.length>0) return res.status(401).json({
                                                        message: "Acest nume este deja folosit!"
                                                      })
        else {
          knex('categorii').insert({
            denumire:req.body.denumire,
            idgestiune:req.body.idgestiune,
            idcont:req.body.idcont,
            idcontchelt:req.body.idcontchelt,
            cont:req.body.cont,
            contcheltuiala:req.body.contcheltuiala,
            tipmaterial:req.body.tipmaterial,
    
            created_at:knex.fn.now(),//new Date().toISOString(),
            updated_at:knex.fn.now(),//new Date().toISOString(),
            stare:req.body.stare
            
        }).then((d)=>{
          console.log('Categorie adaugata ',d)
          return res.status(200).json({
            message: "Categorie adaugata!",
            id:d[0]
          })
        }).catch(err =>{})
        }                                              
    }).catch(err =>{})
  }