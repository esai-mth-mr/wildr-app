<template>
<v-app-bar dense flat elevation="0" color="white">
  <v-spacer/>
  <v-icon v-on:click="$router.go()" >mdi-refresh</v-icon>
</v-app-bar>
</template>

<script>
export default {
  name: "AppBar",
}
</script>

<style scoped>

</style>