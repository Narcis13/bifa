<template>
  <router-view />
</template>
<script>
import { defineComponent, provide } from 'vue';
import global from './logic/global/index.js';
export default defineComponent({
  name: 'App',
  setup(){
    provide('global',global);
  }
})
</script>
