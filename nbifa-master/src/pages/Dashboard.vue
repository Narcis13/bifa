<template>
  <div class="q-pa-md row items-start q-gutter-md">
    <q-card class="my-card">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">PAAP</div>
        <div class="text-subtitle2">Planul anual al achizitiilor publice</div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="around">
        <q-btn @click="$router.push('/paap')" flat>Opereaza</q-btn>
        <q-btn flat>Rapoarte</q-btn>
      </q-card-actions>
    </q-card>

    <q-card class="my-card">
      <q-card-section class="bg-purple text-white">
        <div class="text-h6">Referate necesitate</div>
        <div class="text-subtitle2">Angajamente bugetare/legale</div>
      </q-card-section>

      <q-card-actions align="around">
        <q-btn @click="$router.push('/referatenecesitate')" flat>Opereaza</q-btn>
        <q-btn flat>Rapoarte</q-btn>
      </q-card-actions>
    </q-card>

    <q-card class="my-card">
      <q-card-section class="bg-teal text-white">
        <div class="text-h6">Contracte</div>
        <div class="text-subtitle2">Proceduri achizitie</div>
      </q-card-section>

      <q-card-actions  align="around">
        <q-btn @click="$router.push('/contracteproceduri')" flat>Opereaza</q-btn>
        <q-btn flat>Rapoarte</q-btn>
      </q-card-actions>
    </q-card>

    <q-card class="my-card">
      <q-card-section class="bg-grey-8 text-white">
        <div class="text-h6">Comenzi/Receptii</div>
        <div class="text-subtitle2">Lichidare angajamente</div>
      </q-card-section>

      <q-card-actions  align="around">
        <q-btn flat>Opereaza</q-btn>
        <q-btn flat>Rapoarte</q-btn>
      </q-card-actions>
    </q-card>

    <!--  ALOP CARD -->        
    
    <q-card class="my-card">
      <q-card-section>
       <q-list bordered>
          <q-expansion-item
            group="somegroup"
            icon="explore"
            label="ALOP"
            default-opened
            header-class="text-primary"
          >
            <q-card>
              <q-card-section>
                  <q-btn class="full-width q-ma-xs" color="indigo" no-caps>
                    Angajamente<br>Bugetare
                  </q-btn>
                  <q-btn class="full-width q-ma-xs" color="indigo" no-caps>
                     Lichidari<br>Receptii
                  </q-btn>
                  <q-btn class="full-width q-ma-xs" color="indigo" no-caps>
                     Ordonantari<br>Plata
                  </q-btn>
              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-separator />

          <q-expansion-item group="somegroup" icon="perm_identity" label="Nomenclatoare" header-class="text-teal">
            <q-card>
              <q-card-section>

                  <q-btn class="full-width q-ma-xs" color="teal" no-caps>
                    Prevederi<br>Bugetare
                  </q-btn>
                  <q-btn class="full-width q-ma-xs" color="teal" no-caps>
                     Furnizori
                  </q-btn>

              </q-card-section>
            </q-card>
          </q-expansion-item>

          <q-separator />

          <q-expansion-item group="somegroup" icon="shopping_cart" label="Administrare" header-class="text-purple">
            <q-card>
              <q-card-section>
                 <q-btn class="full-width q-ma-xs" color="purple" no-caps>
                    Categorii<br>repere
                  </q-btn>
              </q-card-section>
            </q-card>
          </q-expansion-item>
          
        </q-list>
      </q-card-section>
    </q-card>

  </div>
</template>

<script>
export default {

}
</script>

<style lang="sass" scoped>
.my-card
  width: 100%
  max-width: 250px
</style>
