export function uf(){
    console.log('Merge uf!');
}

export function vercif(v){
	console.log('Verific IBAN...')
    if ( v.length>10 ) return false;
    var cifra_control=v.substr(v.length-1, 1);
    var cif=v.substr(0, v.length-1);
    while (cif.length!=9){
        cif='0'+cif;
    }
    var suma=parseInt(cif.charAt(0)) * 7 + parseInt(cif.charAt(1)) * 5 + parseInt(cif.charAt(2)) * 3 + parseInt(cif.charAt(3)) * 2 + parseInt(cif.charAt(4)) * 1 + parseInt(cif.charAt(5)) * 7 + parseInt(cif.charAt(6)) * 5 + parseInt(cif.charAt(7)) * 3 + parseInt(cif.charAt(8)) * 2;

    suma=suma*10;
    var rest=suma%11;
    if ( rest==10 ) rest=0;

    if (rest==cifra_control) return true;
    else return false;
}

var judete = [{"judet":"ALBA"},
					{"judet":"ARAD"},
					{"judet":"ARGES"},
					{"judet":"BACAU"},
					{"judet":"BIHOR"},
					{"judet":"BISTRITA-NASAUD"},
					{"judet":"BOTOSANI"},
					{"judet":"BRAILA"},
					{"judet":"BRASOV"},
					{"judet":"BUZAU"},
					{"judet":"CALARASI"},
					{"judet":"CARAS-SEVERIN"},
					{"judet":"CLUJ"},
					{"judet":"CONSTANTA"},
					{"judet":"COVASNA"},
					{"judet":"DIMBOVITA"},
					{"judet":"DOLJ"},
					{"judet":"GALATI"},
					{"judet":"GIURGIU"},
					{"judet":"GORJ"},
					{"judet":"HARGHITA"},
					{"judet":"HUNEDOARA"},
					{"judet":"IALOMITA"},
					{"judet":"IASI"},
					{"judet":"ILFOV"},
					{"judet":"MARAMURES"},
					{"judet":"MEHEDINTI"},
					{"judet":"MURES"},
					{"judet":"NEAMT"},
					{"judet":"OLT"},
					{"judet":"PRAHOVA"},
					{"judet":"SALAJ"},
					{"judet":"SATU MARE"},
					{"judet":"SIBIU"},
					{"judet":"SUCEAVA"},
					{"judet":"TELEORMAN"},
					{"judet":"TIMIS"},
					{"judet":"TULCEA"},
					{"judet":"VASLUI"},
					{"judet":"VILCEA"},
					{"judet":"VRANCEA"}];

export function veriban(v){
                        if(v.length==24){
                                var partial=v.substr(4,40)+v.substr(0,4);
                                var tab={};
                                tab['A']='10';
                                tab['B']='11';
                                tab['C']='12';
                                tab['D']='13';
                                tab['E']='14';
                                tab['F']='15';
                                tab['G']='16';
                                tab['H']='17';
                                tab['I']='18';
                                tab['J']='19';
                                tab['K']='20';
                                tab['L']='21';
                                tab['M']='22';
                                tab['N']='23';
                                tab['O']='24';
                                tab['P']='25';
                                tab['Q']='26';
                                tab['R']='27';
                                tab['S']='28';
                                tab['T']='29';
                                tab['U']='30';
                                tab['V']='31';
                                tab['W']='32';
                                tab['X']='33';
                                tab['Y']='34';
                                tab['Z']='35';
                                
                                for (var key in tab) {
                                for(var i=0;i<10;i++){
                                partial=partial.replace(key,tab[key]);
                                }
                                }
                                function smod(ss) {
                                    var parts = Math.ceil(ss.length/7);
                                    var remainer = "";
                                    for (var i = 1; i <= parts; i++) {
                                        remainer = String(parseFloat(remainer+ss.substr((i-1)*7, 7))%97); }
                                    return remainer; }
                                if(smod(partial)=='1')
                            return true;
                            else
                            return false;
                            }
                            else{
                            if(v.length>0)
                            return false;
                            else
                            return true;
                        }
                        
                        
                        
                        }