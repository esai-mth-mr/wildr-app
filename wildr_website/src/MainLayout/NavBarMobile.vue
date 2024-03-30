<template>
  <div>
    <v-app-bar absolute>
      <v-app-bar-nav-icon @click="drawer = true"></v-app-bar-nav-icon>
      <img v-on:click="$router.push('/')" :src="require('@/assets/fulllogo.png')" height="100" width="100" alt="logo" style="object-fit: contain;">
    </v-app-bar>
    <v-navigation-drawer
        v-model="drawer"
        absolute
        temporary
    >
      <v-list nav dense>
        <v-list-item-group v-model="group">
          <v-list-item v-for="(i, index) in navButtons" :key="index" :to="i.route">
            <v-list-item-title style="color: #292934">{{ i.name }}</v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
  </div>
</template>

<script>
export default {
  name: "NavBarMobile",
  props:{
    navButtons: Array,
  },
  data: () => ({
    drawer: false,
    group: null,
  }),
}
</script>

<style scoped>

</style>