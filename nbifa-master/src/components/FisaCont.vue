<template>
     <q-table
      dense
      separator="cell"
      title="Fisa de cont analitica"
      :data="setdate"
      :columns="columns"
      :pagination.sync="pagination"
      >

                 <template v-slot:top>

                          <q-btn class="on-right" icon="print" flat dense color="green"  label="Print" @click="raportPrintat" />
                          
                </template>
                      
    </q-table>
</template>
<script>
import axios from 'axios';
export default {
    name:'FisaCont',
    props:['setdate','total','parametrii'],
    data(){
            return {
                pagination: {

                page: 1,
                rowsPerPage: 12
                // rowsNumber: xx if getting data from a server
             },
                columns: [
                        { name: 'data', align: 'center', label: 'Data', field: 'data' },
                        { name: 'explicatii', label: 'Explicatii', field: 'explicatii',align: 'left' },
                        { name: 'um', align: 'center', label: 'UM', field: 'um' },
                        { name: 'ci', align: 'right', label: 'Intrari', field: 'ci' },
                        { name: 'ce', align: 'right', label: 'Iesiri', field: 'ce' },
                        { name: 'cs', align: 'right', label: 'Sold', field: 'cs' },
                        { name: 'vi', align: 'right', label: 'Val. intrata', field: 'vi' },
                        { name: 've', align: 'right', label: 'Val. iesita', field: 've' },
                        { name: 'vs', align: 'right', label: 'Sold', field: 'vs' }
                        

                ]
                        }
                },
                created(){
                    console.log('Component fisa de cont creat!');
                },
                methods:{
                    raportPrintat(){
                           const token=this.$store.getters.token;
                            var that=this;
                            axios.post(process.env.host+'balante/rapfisacont',this.parametrii,{responseType:'blob',headers:{"Authorization" : `Bearer ${token}`}}).then(
                                res => {
                                    const file = new Blob([res.data], {
                                                type: "text/html"
                                            });

                                    // saveAs(file,'pdfNou.pdf');
                                    let newWindow = window.open('/','fisacont')
                                    newWindow.onload = () => {
                                            newWindow.location = URL.createObjectURL(file);
                                            
                                        };
                                    newWindow.document.title="Fisa de cont analitica"     
                                }
                            ).catch(err=>{
                                    //  console.log('Eroare.............',err.response.data.message)
                                        this.$q.notify({
                                            color: 'negative',
                                            timeout:1500,
                                            position:'top',
                                            icon: 'delete',
                                            message: `ATENTIE! `
                                        })
                                })
                            }
                }
            }
            </script>