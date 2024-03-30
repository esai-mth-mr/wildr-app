<template>
  <div>
    <NavBar v-if="windowSize.width>=1200" :navButtons="navButtons"/>
    <NavBarMobile v-else style="z-index: 2000" :navButtons="navButtons"/>
    <router-view/>
  </div>
</template>

<script>
import NavBar from "@/MainLayout/NavBar";
import NavBarMobile from "@/MainLayout/NavBarMobile";

export default {
  name: "MainLayout",
  components: {NavBarMobile, NavBar},
  mounted() {
    this.onResize()
    window.addEventListener('resize', this.onResize);
  },
  data:()=> {
    return {
      windowSize: {
        width: 0,
        height: 0
      },
      navButtons: [
        {
          name: "Home",
          route: "/",
        },
        // {
        //   name: "Team",
        //   route: "/team",
        // },
        {
          name: "Contact",
          route: "/contact",
        }
      ]
    };
  },
  methods: {
    onResize() {
      this.windowSize = {width: window.innerWidth, height: window.innerHeight}
    },
  }
}
</script>

<style scoped>

</style>