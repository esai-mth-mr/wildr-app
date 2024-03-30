<template>
  <v-app-bar color="white">
    <img v-on:click="$router.push('/')" :src="require('@/assets/full_logo.svg')" height="100" width="100" alt="logo" style="object-fit: contain;">
    <v-spacer/>
    <div v-for="(i, index) in navButtons" :key="index" style="padding: .2rem">
      <v-btn text :to="i.route" color="#292934">
        {{ i.name }}
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script>
export default {
  name: "NavBar",
  props:{
    navButtons: Array,
  },
  data() {
    return {
      drawer: false,
    }
  }
}
</script>

<style scoped>

</style>