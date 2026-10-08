const knex =require('../../db.js');
const fs = require("fs");   
const path=require("path");
const moment = require('moment');
let config = require('./reports/config.json');
let ejs = require('ejs');
/*const User = require("../models/user");*/

module.exports.fisacont = (req, res, next) => {
  console.log('sunt in controllerul balante actiunea fisa decont....',req.body)
  let sql_categ=req.body.categorii==="*"?">=1":"="+req.body.categorii;
  let sql_stari=req.body.stari==="*"?"%":req.body.stari;
  let sql_locuri=req.body.locuri==="*"?">=1":"="+req.body.locuri;
  let si_sql=`
  SELECT 
      m.denumire,
      tranzactii.id_reper,
      m.um um,
      ifnull(sum(case when op.data < '${req.body.datainceput}' then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocinitial,

      ifnull(sum(case when op.data < '${req.body.datainceput}' then tranzactii.debit-tranzactii.credit end),0) as valoarestocinitial

      FROM bifa.tranzactii 
      inner join materiale m on m.id=id_reper
      inner join operatiuni  op on op.id=tranzactii.idAntet
      where id_reper=${req.body.idmaterial} and tranzactii.stare_material LIKE '${sql_stari}' and tranzactii.tip_material='${req.body.tipmaterial}'  and id_categ${sql_categ} and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=${req.body.idgestiune} and id_locdispunere${sql_locuri}
      group by id_reper
  `;

let sql_tranzactii=`
      SELECT 
          op.data,
          concat(op.tipoperatiune,op.nrdoc) as explicatii,
          tranzactii.um um,
          tranzactii.cantitate_debit,
          tranzactii.cantitate_credit,
          tranzactii.debit,
          tranzactii.credit
          FROM bifa.tranzactii 
          inner join operatiuni  op on op.id=tranzactii.idAntet
          where op.data>='${req.body.datainceput}' and op.data<='${req.body.datasfirsit}' and id_reper=${req.body.idmaterial} and tranzactii.stare_material LIKE '${sql_stari}' and tranzactii.tip_material='${req.body.tipmaterial}'  and id_categ${sql_categ} and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=${req.body.idgestiune} and id_locdispunere${sql_locuri}
`;

    knex.raw(si_sql,[]).then(
      r=>{
        knex.raw(sql_tranzactii,[]).then(
          rt=>{
            return res.status(200).json({
              message: " fisa de cont",
              sifc:r,
              tranzactii:rt
            });
          }
        ).catch(err =>{console.log(err)})

      }
  ).catch(err =>{console.log(err)})

}


module.exports.analitica = (req, res, next) => {
  let sql_categ=req.body.categorii==="*"?">=1":"="+req.body.categorii;
  let sql_stari=req.body.stari==="*"?"%":req.body.stari;
  let sql_locuri=req.body.locuri==="*"?">=1":"="+req.body.locuri;
    console.log('sunt in controllerul balante actiunea analitica de gestiune....',req.body,sql_categ)
    
let sql=`SELECT 
m.denumire,
tranzactii.id_reper,
m.um um,
ifnull(sum(case when op.data < '${req.body.datainceput}' then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocinitial,
ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.cantitate_debit end),0) ti,
ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.cantitate_credit end),0) te,
ifnull(sum(case when op.data <= '${req.body.datasfirsit}' then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocfinal,
ifnull(sum(case when op.data < '${req.body.datainceput}' then tranzactii.debit-tranzactii.credit end),0) as valoarestocinitial,
ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.debit end),0) vi,
ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.credit end),0) ve,
ifnull(sum(case when op.data <= '${req.body.datasfirsit}' then tranzactii.debit-tranzactii.credit end),0) as valoarestoc
FROM bifa.tranzactii 
inner join materiale m on m.id=id_reper
inner join operatiuni  op on op.id=tranzactii.idAntet
where tranzactii.stare_material LIKE '${sql_stari}' and tranzactii.tip_material='${req.body.tipmaterial}'  and id_categ${sql_categ} and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=${req.body.idgestiune} and id_locdispunere${sql_locuri}
group by id_reper
having stocinitial>0 or stocfinal>0`;

knex.raw(sql,[]).then(
    r=>{
     // console.log("Raspuns de la query stoc pret mediu",r)
     return res.status(200).json({
      message: "Balanta analitica de gestiune",
      balanta:r
    });
    }
  ).catch(err =>{console.log(err)})
}

module.exports.raportfisacont = (req,res,next)=>{
  console.log("Sunt in controllerul balante actiunea raportfisadecont",req.body);
  let set_date={};
  set_date.gestiune=req.body.gestiune  ;
  set_date.datainceput=req.body.datainceput  ;
  set_date.datasfirsit=req.body.datasfirsit  ;
  set_date.denumirematerial=req.body.denumirematerial;
  set_date.stare=req.body.stari==="*"?'Toate Starile': req.body.stari ;
  set_date.denumiretipmaterial=req.body.denumiretipmaterial  ;
  set_date.denumireloc=req.body.denumireloc  ;
  set_date.denumirecategorie=req.body.denumirecategorie  ;
    
  var ejs_template = fs.readFileSync(path.join(__dirname,'reports','fisacont.ejs'),'utf8'),
       style=fs.readFileSync(path.join(__dirname,'reports','fisacont_styles.css'),'utf8');

       let sql_categ=req.body.categorii==="*"?">=1":"="+req.body.categorii;
       let sql_stari=req.body.stari==="*"?"%":req.body.stari;
       let sql_locuri=req.body.locuri==="*"?">=1":"="+req.body.locuri;


       let si_sql=`
       SELECT 
           m.denumire,
           tranzactii.id_reper,
           m.um um,
           ifnull(sum(case when op.data < '${req.body.datainceput}' then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocinitial,
     
           ifnull(sum(case when op.data < '${req.body.datainceput}' then tranzactii.debit-tranzactii.credit end),0) as valoarestocinitial
     
           FROM bifa.tranzactii 
           inner join materiale m on m.id=id_reper
           inner join operatiuni  op on op.id=tranzactii.idAntet
           where id_reper=${req.body.idmaterial} and tranzactii.stare_material LIKE '${sql_stari}' and tranzactii.tip_material='${req.body.tipmaterial}'  and id_categ${sql_categ} and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=${req.body.idgestiune} and id_locdispunere${sql_locuri}
           group by id_reper
       `;
     
     let sql_tranzactii=`
           SELECT 
               op.data,
               concat(op.tipoperatiune,op.nrdoc) as explicatii,
               tranzactii.um um,
               tranzactii.cantitate_debit,
               tranzactii.cantitate_credit,
               tranzactii.debit,
               tranzactii.credit
               FROM bifa.tranzactii 
               inner join operatiuni  op on op.id=tranzactii.idAntet
               where op.data>='${req.body.datainceput}' and op.data<='${req.body.datasfirsit}' and id_reper=${req.body.idmaterial} and tranzactii.stare_material LIKE '${sql_stari}' and tranzactii.tip_material='${req.body.tipmaterial}'  and id_categ${sql_categ} and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=${req.body.idgestiune} and id_locdispunere${sql_locuri}
     `;
     let linii=[];
     knex.raw(si_sql,[]).then(
      r=>{
        knex.raw(sql_tranzactii,[]).then(
          rt=>{
            // aici prelucrez datele 
            var si=parseFloat(r[0][0].stocinitial),vi=parseFloat(r[0][0].valoarestocinitial);
            linii.push({
              data:'<'+req.body.datainceput,
              explicatii:'SOLD INITIAL',
              um:'',
              ci:'',
              ce:'',
              cs:parseFloat(r[0][0].stocinitial).toFixed(2),
              vi:'',
              ve:'',
              vs:parseFloat(r[0][0].valoarestocinitial).toFixed(2)
            })

            rt[0].map(t=>{
            
              let c_d=parseFloat(t.cantitate_debit),c_c=parseFloat(t.cantitate_credit);
              let v_d=parseFloat(t.debit),v_c=parseFloat(t.credit);
             si+=(c_d-c_c);
             vi+=(v_d-v_c);
             linii.push({
               data:moment(t.data).format('DD/MM/YYYY'),
               explicatii:t.explicatii,
               um:t.um,
               ci:t.cantitate_debit,
               ce:t.cantitate_credit,
               cs:si.toFixed(2),
               vi:parseFloat(t.debit).toFixed(2),
               ve:parseFloat(t.credit).toFixed(2),
               vs:vi.toFixed(2)
             })
           })

           linii.push({
            data:'<'+req.body.datasfirsit,
            explicatii:'SOLD FINAL',
            um:'',
            ci:'',
            ce:'',
            cs:si.toFixed(2),
            vi:'',
            ve:'',
            vs:vi.toFixed(2)
          })
            set_date.linii=linii;
            const html = ejs.render(ejs_template, {set_date,style,config});
            res.send(html);
          }
        ).catch(err =>{console.log(err)})

      }
  ).catch(err =>{console.log(err)})



}

module.exports.raportanalitica = (req,res,next)=>{
  console.log("Sunt in controllerul balante actiunea raportanalitica",req.body);
  let set_date={};
  set_date.gestiune=req.body.gestiune  ;
  set_date.datainceput=req.body.datainceput  ;
  set_date.datasfirsit=req.body.datasfirsit  ;
  set_date.stare=req.body.stari==="*"?'Toate Starile': req.body.stari ;
  set_date.denumiretipmaterial=req.body.denumiretipmaterial  ;
  set_date.denumireloc=req.body.denumireloc  ;
  set_date.denumirecategorie=req.body.denumirecategorie  ;
    
  var ejs_template = fs.readFileSync(path.join(__dirname,'reports','analitica.ejs'),'utf8'),
       style=fs.readFileSync(path.join(__dirname,'reports','analitica_styles.css'),'utf8');

       let sql_categ=req.body.categorii==="*"?">=1":"="+req.body.categorii;
       let sql_stari=req.body.stari==="*"?"%":req.body.stari;
       let sql_locuri=req.body.locuri==="*"?">=1":"="+req.body.locuri;
    
         
     let sql=`SELECT 
     m.denumire,
     tranzactii.id_reper,
     m.um um,
     ifnull(sum(case when op.data < '${req.body.datainceput}' then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocinitial,
     ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.cantitate_debit end),0) ti,
     ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.cantitate_credit end),0) te,
     ifnull(sum(case when op.data <= '${req.body.datasfirsit}' then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocfinal,
     ifnull(sum(case when op.data < '${req.body.datainceput}' then tranzactii.debit-tranzactii.credit end),0) as valoarestocinitial,
     ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.debit end),0) vi,
     ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.credit end),0) ve,
     ifnull(sum(case when op.data <= '${req.body.datasfirsit}' then tranzactii.debit-tranzactii.credit end),0) as valoarestoc
     FROM bifa.tranzactii 
     inner join materiale m on m.id=id_reper
     inner join operatiuni  op on op.id=tranzactii.idAntet
     where tranzactii.stare_material LIKE '${sql_stari}' and tranzactii.tip_material='${req.body.tipmaterial}'  and id_categ${sql_categ} and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=${req.body.idgestiune} and id_locdispunere${sql_locuri}
     group by id_reper
     having stocinitial>0 or stocfinal>0`;
     let nrcrt=1,tsf=0,tsi=0,rd=0,rc=0,linii=[];
     knex.raw(sql,[]).then(
      r=>{
       // console.log("Raspuns de la query balanta",r)
       r[0].map((linie=>{
        linii.push({
            nrcrt,
            id_reper:linie.id_reper,
            denumire:linie.denumire,
            um:linie.um,
            stocinitial:linie.stocinitial,
            ti:linie.ti,
            te:linie.te,
            stocfinal:linie.stocfinal,
            valoarestocinitial:parseFloat(linie.valoarestocinitial).toFixed(2),
             vi:parseFloat(linie.vi).toFixed(2),
              ve:parseFloat(linie.ve).toFixed(2),
               valoarestoc:parseFloat(linie.valoarestoc).toFixed(2),

        })
         nrcrt++;
         tsf+=parseFloat(linie.valoarestoc);
         tsi+=parseFloat(linie.valoarestocinitial);
         rd+=parseFloat(linie.vi);
         rc+=parseFloat(linie.ve);
      }))

      set_date.linii=linii;
      set_date.tsf=tsf.toFixed(2);
      set_date.tsi=tsi.toFixed(2);
      set_date.rd=rd.toFixed(2);
      set_date.rc=rc.toFixed(2);


       const html = ejs.render(ejs_template, {set_date,style,config});
       res.send(html);
      }
    ).catch(err =>{console.log(err)})

}


module.exports.raportli = (req,res,next)=>{
  console.log("Sunt in controllerul balante actiunea raport lista inv",req.body);
  let set_date={};
  set_date.gestiune=req.body.gestiune  ;
  set_date.datainceput=req.body.datainceput  ;
  set_date.datasfirsit=req.body.datasfirsit  ;
  set_date.stare=req.body.stari==="*"?'Toate Starile': req.body.stari ;
  set_date.denumiretipmaterial=req.body.denumiretipmaterial  ;
  set_date.denumireloc=req.body.denumireloc  ;
  set_date.denumirecategorie=req.body.denumirecategorie  ;
    
  var ejs_template = fs.readFileSync(path.join(__dirname,'reports','li.ejs'),'utf8'),
       style=fs.readFileSync(path.join(__dirname,'reports','analitica_styles.css'),'utf8');

       let sql_categ=req.body.categorii==="*"?">=1":"="+req.body.categorii;
       let sql_stari=req.body.stari==="*"?"%":req.body.stari;
       let sql_locuri=req.body.locuri==="*"?">=1":"="+req.body.locuri;
    
         
     let sql=`SELECT 
     m.denumire,
     tranzactii.id_reper,
     m.um um,
     g.gestionar gestionar,
     g.i_presedinte presedinte,
     g.i_membru1 membru1,
     g.i_membru2 membru2,
     ifnull(sum(case when op.data < '${req.body.datainceput}' then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocinitial,
     ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.cantitate_debit end),0) ti,
     ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.cantitate_credit end),0) te,
     ifnull(sum(case when op.data <= '${req.body.datasfirsit}' then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocfinal,
     ifnull(sum(case when op.data < '${req.body.datainceput}' then tranzactii.debit-tranzactii.credit end),0) as valoarestocinitial,
     ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.debit end),0) vi,
     ifnull(sum(case when op.data >= '${req.body.datainceput}' and op.data <= '${req.body.datasfirsit}' then tranzactii.credit end),0) ve,
     ifnull(sum(case when op.data <= '${req.body.datasfirsit}' then tranzactii.debit-tranzactii.credit end),0) as valoarestoc
     FROM bifa.tranzactii 
     inner join materiale m on m.id=id_reper
     inner join operatiuni  op on op.id=tranzactii.idAntet
     inner join gestiuni g on g.id = tranzactii.id_gestiune
     where tranzactii.stare_material LIKE '${sql_stari}' and tranzactii.tip_material='${req.body.tipmaterial}'  and id_categ${sql_categ} and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=${req.body.idgestiune} and id_locdispunere${sql_locuri}
     group by id_reper
     having stocinitial>0 or stocfinal>0`;
     let nrcrt=1,tsf=0,tsi=0,rd=0,rc=0,linii=[];
     knex.raw(sql,[]).then(
      r=>{
       // console.log("Raspuns de la query balanta",r)
       r[0].map((linie=>{
        linii.push({
            nrcrt,
            id_reper:linie.id_reper,
            denumire:linie.denumire,
            um:linie.um,
            stocinitial:linie.stocinitial,
            ti:linie.ti,
            te:linie.te,
            stocfinal:linie.stocfinal,
            valoarestocinitial:parseFloat(linie.valoarestocinitial).toFixed(2),
             vi:parseFloat(linie.vi).toFixed(2),
              ve:parseFloat(linie.ve).toFixed(2),
               valoarestoc:parseFloat(linie.valoarestoc).toFixed(2),
               pret:parseFloat(linie.stocfinal).toFixed(2)==0?0:(parseFloat(linie.valoarestoc)/parseFloat(linie.stocfinal)).toFixed(2),
               gestionar:linie.gestionar,
               presedinte:linie.presedinte,
               membru1:linie.membru1,
               membru2:linie.membru2

        })
         nrcrt++;
         tsf+=parseFloat(linie.valoarestoc);
         tsi+=parseFloat(linie.valoarestocinitial);
         rd+=parseFloat(linie.vi);
         rc+=parseFloat(linie.ve);
      }))

      set_date.linii=linii;
      set_date.tsf=tsf.toFixed(2);
      set_date.tsi=tsi.toFixed(2);
      set_date.rd=rd.toFixed(2);
      set_date.rc=rc.toFixed(2);
      set_date.presedinte=linii[0].presedinte
      set_date.gestionar=linii[0].gestionar
      set_date.membru1=linii[0].membru1
      set_date.membru2=linii[0].membru2


       const html = ejs.render(ejs_template, {set_date,style,config});
       res.send(html);
      }
    ).catch(err =>{console.log(err)})

}

/*
pentru stoc initial la fisa de cont

SELECT 
m.denumire,
tranzactii.id_reper,
m.um um,
ifnull(sum(case when op.data < '2020-04-09' then tranzactii.cantitate_debit-tranzactii.cantitate_credit end),0) as stocinitial,

ifnull(sum(case when op.data < '2020-04-09' then tranzactii.debit-tranzactii.credit end),0) as valoarestocinitial

FROM bifa.tranzactii 
inner join materiale m on m.id=id_reper
inner join operatiuni  op on op.id=tranzactii.idAntet
where id_reper=8 and tranzactii.stare_material LIKE '%' and tranzactii.tip_material='M'  and id_categ>=1 and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=1 and id_locdispunere>=1
group by id_reper



pentru tranzactii in interval

SELECT 
op.data,
concat(op.tipoperatiune,op.nrdoc) as explicatii,
tranzactii.um um,
tranzactii.cantitate_debit,
tranzactii.cantitate_credit,
tranzactii.debit,
tranzactii.credit
FROM bifa.tranzactii 
inner join operatiuni  op on op.id=tranzactii.idAntet
where op.data>='2020-04-09' and op.data<='2020-04-13' and id_reper=8 and tranzactii.stare_material LIKE '%' and tranzactii.tip_material='M'  and id_categ>=1 and op.stare='ACTIV' and tranzactii.stare='ACTIV' and id_gestiune=1 and id_locdispunere>=1
*/