const knex =require('../../db.js');


module.exports.toate = (req, res, next) => {
    

   knex('conturi').where('id', '>', 1).orderBy('cont').then((rows)=>{
    console.log('sunt in controllerul cont actiunea toate....')
     var analitice=[],nivel1=[],nivel2=[],nivel3=[];
     rows.map((item)=>{
         if (item.nivel==0) nivel1.push({id:item.id,parentID:0,tip:item.tip,cont:item.cont,nivel:item.nivel,label:item.cont+" "+item.denumire,sintetic:item.sintetic,children:[],isLeaf:false})
         if (item.nivel==1) nivel2.push({id:item.id,parentID:0,tip:item.tip,cont:item.cont,nivel:item.nivel,label:item.cont+" "+item.denumire,sintetic:item.sintetic,children:[],isLeaf:false})
         if (item.nivel==2) nivel3.push({id:item.id,parentID:0,tip:item.tip,cont:item.cont,nivel:item.nivel,label:item.cont+" "+item.denumire,sintetic:item.sintetic,children:[],isLeaf:true})
         if (item.nivel==3) analitice.push({id:item.id,parentID:0,tip:item.tip,cont:item.cont,nivel:item.nivel,label:item.cont+" "+item.denumire,sintetic:item.sintetic,isLeaf:true})
     })

     analitice.map((item)=>{
      nivel3.map(it=>{
        if(it.cont==item.sintetic) {item.parentID=it.id; it.children.push(item);}
      })
    })

     nivel3.map((item)=>{
       nivel2.map(it=>{
         if(it.cont==item.sintetic) {item.parentID=it.id; it.children.push(item);}
       })
     })

     nivel2.map((item)=>{
      nivel1.map(it=>{
        if(it.cont==item.sintetic) {item.parentID=it.id; it.children.push(item);}
      })
    })
      return res.status(200).json({
       message: "Toate CONTURILE",
       conturi:nivel1
     });
    }).catch(err =>{})
}

module.exports.toatetoate = (req, res, next) => {
    

  knex('conturi').where('tip', '=', 'N').orderBy('cont').then((rows)=>{
   
     return res.status(200).json({
      message: "Toate CONTURILE nou create",
      conturi:rows
    });
   }).catch(err =>{})
}


module.exports.sterg_cont = (req, res, next) => {
    
  console.log('sunt in controllerul conturi actiunea sterg cont')
  knex('conturi').where({
    id: req.params.idcont
  }).del()
  .then(()=>{
    return res.status(200).json({
      message: "Cont analitic sters!"
    });
  
  }).catch(err =>{})

}


module.exports.analiticnou = (req,res,next) =>{

  console.log('sunt in controllerul conturi  actiunea analitic nou',req.body)




      /*  knex('analitice').insert({
          cont:req.body.cont,
          idsintetic:req.body.idsintetic,
          explicatii:req.body.explicatii,
          created_at:new Date().toISOString(),
          updated_at:new Date().toISOString(),
          stare:req.body.stare
          
      }).then((d)=>{*/
        //    console.log('Ajung si aici sa adaug in conturi...',req.body.contcomplet);
            knex('conturi').insert({
              cont:req.body.contcomplet,
              tip:"N",
              denumire:req.body.explicatii,
              sintetic:req.body.contsintetic,
              nivel:req.body.nivel
              
             }).then((d)=>{
                console.log('analitic adaugat ',d)
                return res.status(200).json({
                  message: "Analitic adaugat!",
                  id:d[0]
                }).catch(err =>{})
            }).catch(err =>{})
       
  
   //   }).catch(err =>{})
                                                

}