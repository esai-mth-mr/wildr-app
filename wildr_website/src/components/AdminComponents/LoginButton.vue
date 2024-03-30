<template>
  <v-container class="">
        <v-btn
            v-on:click="googleLogin"
            rounded
            outlined
            color="red"
            class="center"
        >
          <v-icon style="padding-right: 1rem">mdi-google</v-icon>
          Google Login
        </v-btn>
  </v-container>

</template>

<script>
export default {
  name: "LoginButton",
  methods:{
      googleLogin() {
        this.$store.dispatch('Login').then(r=>{
          this.$notify({
            group: 'web',
            type: 'success',
            title: 'Success',
            text: r
          });
        })
        .catch(error=>{
          this.$notify({
            group: 'web',
            type: 'error',
            title: 'Error',
            text: error
          });
        })

     }
  }
}
</script>

<style scoped>
.center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 10px;
}
</style>