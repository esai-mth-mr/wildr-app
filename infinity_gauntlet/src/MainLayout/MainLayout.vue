<template>
  <div>
    <AppBar />
    <router-view />
  </div>

</template>

<script>
import AppBar from "@/MainLayout/AppBar";
export default {
  name: "MainLayout",
  components: {AppBar}
}
</script>

<style scoped>

</style>