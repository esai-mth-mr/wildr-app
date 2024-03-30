<template>
  <LandingPage v-if="windowSize.width>=1200" :windowSize="windowSize" :video="video"/>
  <LandingPageMobile v-else :windowSize="windowSize" :video="video"/>
</template>
<script>


import LandingPage from "@/components/LandingPageComponents/LandingPage";
import LandingPageMobile from "@/components/LandingPageComponents/LandingPageMobile";

export default {
  name: 'HomeView',
  components: {LandingPageMobile, LandingPage},
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
      video: require('@/assets/LandingPage/Video.mp4')


    };
  },
  methods: {
    onResize() {
      this.windowSize = {width: window.innerWidth, height: window.innerHeight}
    },
  }
}
</script>
<style>
</style>
