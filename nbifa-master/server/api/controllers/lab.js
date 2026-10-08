const knex =require('../../db.js');
const fs = require("fs");   
const path=require("path");
const moment = require('moment');
let config = require('./reports/config.json');
let ejs = require('ejs');
   

module.exports.toate = (req,res,next) => {

    let set_date={};
    
    
         var ejs_template = fs.readFileSync(path.join(__dirname,'reports','un_document.ejs'),'utf8'),
        style=fs.readFileSync(path.join(__dirname,'reports','styles.css'),'utf8');

       knex.select(['operatiuni.idtipoperatiuni', 'operatiuni.tipoperatiune', 'operatiuni.data' ,'operatiuni.nrdoc', {categorie:'categorii.denumire'}, {gestiune:'gestiuni.denumire'}, {loc:'locuri.denumire'}, {material:'materiale.denumire'},'tranzactii.um','tranzactii.cantitate_debit','tranzactii.cantitate_credit','tranzactii.pret','tranzactii.debit','tranzactii.credit','tranzactii.stare_material'])
       .from('tranzactii')
       .innerJoin('operatiuni','operatiuni.id','tranzactii.idAntet')
       .innerJoin('categorii','categorii.id','tranzactii.id_categ')
       .innerJoin('gestiuni','gestiuni.id','tranzactii.id_gestiune')
       .innerJoin('locuri','locuri.id','tranzactii.id_locdispunere')
       .innerJoin('materiale','materiale.id','tranzactii.id_reper')
       .whereRaw('tranzactii.stare=? and tranzactii.idAntet = ? ',['ACTIV',21])
       .then( rows=>{
           //console.log(rows)
           let totaldebit=0,totalcredit=0;
           rows.forEach(r=>{
               r.debit=parseFloat(r.debit).toFixed(2);
               totaldebit+=parseFloat(r.debit);
               r.credit=parseFloat(r.credit).toFixed(2);
               totalcredit+=parseFloat(r.credit)
               r.pret=parseFloat(r.pret).toFixed(2);
               r.data=moment(r.data).format('DD/MM/YYYY');
           }) 
            set_date.tipoperatiune=rows[0].tipoperatiune;
            set_date.nrdoc=rows[0].nrdoc;
            set_date.datadoc=rows[0].data;
            set_date.gestiune=rows[0].gestiune;
            set_date.loc=rows[0].loc;
            set_date.stare=rows[0].stare_material
            set_date.linii=rows;
            set_date.totaldebit=totaldebit;
            set_date.totalcredit=totalcredit;

           const html = ejs.render(ejs_template, {set_date,style,config});
           res.send(html);

       })
       .catch(err =>{console.log(err)})


    
    
}