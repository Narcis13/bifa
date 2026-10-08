const knex =require('../../dbaky.js');
const moment = require('moment');
const primaziaanului=moment().startOf('year').format('YYYY-MM-DD');

module.exports.toate = (req,res,next) => {
  console.log('Toate angajamentele',moment().startOf('year').format('YYYY-MM-DD'))
let semn=req.params.idcomp==0?'>':'=';
let sql=`SELECT statistici.nr,ang.id,antang.nrdoc,antang.viza,ang.idAntet,cat.denumire categorie, ang.data_ang dataang,antang.detalii,ang.suma,ang.codCap,ang.numecap,ang.artbug,c.denumire compartiment,c.id idcompartiment,antang.stare,ang.idcateg  FROM adata.angajamente ang 
left join adata.anteteangajamente antang on antang.id=ang.idAntet
inner join compartimente c on c.id=antang.compID
inner join caategorii cat on cat.id=ang.idcateg
inner join (select idAntet, count(idAntet) as nr from adata.angajamente group by idAntet ) statistici on statistici.idAntet=ang.idAntet
where dataang>'${primaziaanului}' and antang.stare='activ' and  c.id${semn}?

order by antang.viza,ang.id desc`;

knex.raw(sql,[req.params.idcomp]).then(
  r=>{
   // console.log("Raspuns de la query stoc pret mediu",r)
   return res.status(200).json({
    message: "Toate angajamentele",
    angajamente:r
   
  });
  }
).catch(err =>{console.log(err)})


    
  
  
 }

module.exports.angajament_vizat = (req,res,next)=>{
 console.log('Controller angajamente actiunea vizat ',moment().format('YYYY-MM-DD'))
  let codang=req.body.codang;
  let {idAntet} = req.body;
  let registru=req.body.registru;
  registru.dataviza=knex.fn.now();

  knex('regviza').insert(registru).then((d)=>{
  /*return res.status(200).json({
    message: "Angajament vizat",
    id:d[0]

  })*/
  let viza={codang:codang,   
    dataviza:moment().format('YYYY-MM-DD') ,
    numeviza:registru.nrvizac+d[0],
    viza:1}
console.log('updatez ang id '+idAntet+ ' cu datele '+viza)
      knex('anteteangajamente').where({
        id: idAntet
      }).update(viza)
      .then(()=>{
        return res.status(200).json({
          message: "Angajament vizat",
          id:registru.nrvizac+d[0]
      
        })
      
      }).catch(err =>{})

}).catch(err =>{ console.log(err)})


}

 module.exports.codviza = (req,res,next)=> {
    console.log('caut cod viza',req.params.artbug)

    let sql=`
    SELECT antang.nrdoc,antang.detalii ,ang.suma ,antang.dataang, ang.artbug,antang.codang FROM adata.angajamente ang
inner join anteteangajamente antang on antang.id=ang.idAntet
where ang.artbug=? and antang.viza=1
order by antang.dataang desc
limit 1
    `
    knex.raw(sql,[req.params.artbug]).then(
      r=>{
       // console.log("Raspuns de la query stoc pret mediu",r)
       return res.status(200).json({
        message: "Ultimul cod",
        coduri:r
       
      });
      }
    ).catch(err =>{console.log(err)})

 }


 module.exports.categorii_bugetare = (req,res,next) => {
   console.log('sunt in categorii bugetare...',req.params.idcomp)

let sql=`SELECT c.id,c.denumire,c.buget,c.codCap,c.numecap,c.artbug, bug.total as crediteaprobate,@crediteangajate:=ifnull((SELECT sum(suma)  FROM adata.angajamente ang where data_ang>'${primaziaanului}' and ang.codCap = c.codCap and ang.artbug=c.artbug ),0) as crediteangajate,(bug.total-@crediteangajate) as disponibil  FROM adata.caategorii c
inner join adata.artbugete bug on bug.id=c.buget
where c.idcomp=?;`

knex.raw(sql,[req.params.idcomp]).then(
  r=>{
   // console.log("Raspuns de la query stoc pret mediu",r)
   return res.status(200).json({
    message: "Categoriile compartimentului",
    categorii:r
   
  });
  }
).catch(err =>{console.log(err)})

 }

 module.exports.angajament_nou = (req,res,next)=>{
   console.log('Controller angajamente actiunea angnou..',req.body)
   let sql='SELECT nrdoc FROM anteteangajamente ORDER BY id DESC LIMIT 1';
   let nrdoc=1;
   knex.raw(sql,[]).then(
    r=>{
     // console.log("Raspuns de la ang nrdoc",r[0][0].nrdoc)
     nrdoc=parseInt(r[0][0].nrdoc)+1;
     knex('anteteangajamente').insert({

      dataprop:req.body.dataprop,
      tip:1,
      detalii:req.body.detalii,
      dataang:req.body.dataang,
      compID:req.body.compID,
      viza:0,
      aprob:0,
      suma:req.body.suma,
      stare:'activ',
      idClient:8,
      nrdoc
    
  }).then((d)=>{
    return res.status(200).json({
      message: "Antet angajament adaugat",
      id:d[0]
  
    })
  }).catch(err =>{ console.log(err)})
    }
  ).catch(err =>{console.log(err)})


 }

 module.exports.angajament_nou_detalii = (req,res,next)=>{

let ang={
                       idAntet:req.body.idAntet,
                       idcateg:req.body.idcateg,
                       codCap:req.body.codCap,
                       numecap:req.body.numecap,
                       artbug:req.body.artbug,
                       ca:req.body.ca,
                       cang:req.body.cang,
                       disp:req.body.disp,
                       suma:req.body.suma,
                       restdisp:req.body.restdisp,
                       stare:'activ',
                       idClient:8,
                       data_ang:req.body.data_ang
}

                        knex('angajamente').insert(ang).then((d)=>{
                        return res.status(200).json({
                          message: "Angajament adaugat",
                          id:d[0]

                        })
                        }).catch(err =>{ console.log(err)})


 }

 module.exports.angajament_suplimentare = (req,res,next)=>{


 }

 
 module.exports.ang_la_antet = (req,res,next)=>{
   console.log('ang la antet',req.params.idAntet)
   knex.select(['angajamente.data_ang', 'angajamente.suma'])
   .from('angajamente')
   .where('idAntet',req.params.idAntet)
   .orderBy('angajamente.id').then((rows)=>{
      return res.status(200).json({
       message: "Toate angajamentele la un antet",
       anglaantet:rows
     });
    }).catch(err =>{})
}


 module.exports.calc_dezangajare = (req,res,next)=>{
  console.log('sunt in calcul suma maxima de dezangajat',req.params.idang)

  let sql=`SELECT SUM(suma) suma  FROM antetereceptii WHERE idAng=? and stare = 'activ'`;

  knex.raw(sql,[req.params.idang]).then(
    r=>{
     // console.log("Raspuns de la query stoc pret mediu",r)
     return res.status(200).json({
      message: "Suma angajata deja",
      suma_angajata:r
     
    });
    }
  ).catch(err =>{console.log(err)})
 }

 module.exports.sterg_total = (req,res,next)=>{
  console.log('sunt in sterg total angajament',req.params.idang,req.params.idantang)
  knex('angajamente').where({
    id: req.params.idang
  }).del()
  .then(()=>{
 

    knex('anteteangajamente').where({
      id: req.params.idang
    }).del()
    .then(()=>{
      return res.status(200).json({
        message: "Angajament sters"
      });
    
    }).catch(err =>{})


    }).catch(err =>{});
  

 }

 module.exports.sterg_partial = (req,res,next)=>{
  console.log('sunt in sterg partial angajament',req.params.idang,req.params.idantang)

  knex('angajamente').where({
    id: req.params.idang
  }).del()
  .then(()=>{
    return res.status(200).json({
      message: "Angajament sters"
    });
  
  }).catch(err =>{})



 }