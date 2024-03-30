<template>
  <v-app id="app">
    <v-main>
      <notifications group="web" position="top right" />
      <notifications group="mobile" position="top center"/>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>

export default {
  name: 'App',

  data: () => ({
    //
  }),
};
</script>

<style>
#app {
  font-family: Nunito, sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.v-btn{
  text-transform: inherit !important;
}
.grecaptcha-badge {
  visibility: hidden !important;
}
.swal2-title{
  font-family: Nunito, sans-serif !important;
  font-weight: bold;
}
.swal2-content{
  font-family: Nunito, sans-serif !important;
}
.swal2-confirm{
  font-family: Nunito, sans-serif !important;
  background-color:#00B64C !important;
}
.v-application {
  font-family: Nunito,sans-serif !important;

}
</style>
