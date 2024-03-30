<template>
    <v-btn
        v-on:click="logout"
        rounded
        outlined
        color="red"
    >
      Sign out
    </v-btn>

</template>

<script>
export default {
  name: "LogoutButton",
  methods:{
    logout() {
      this.$store.dispatch('SignOut').then(r=>{
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

</style>