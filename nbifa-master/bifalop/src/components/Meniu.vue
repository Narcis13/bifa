<template>
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
                  <q-btn class="full-width q-ma-xs" color="indigo"  to="a" no-caps>
                    Angajamente<br>Bugetare / Legale
                  </q-btn>
                  <q-btn class="full-width q-ma-xs" color="indigo" to="l" no-caps>
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
                  <q-btn class="full-width q-ma-xs" color="teal" to="f" no-caps>
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
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
    name:'Meniu'
})
</script>

<style lang="sass" scoped>
.my-card
  width: 100%
  max-width: 250px
</style>