<template>
  <v-container>
    <v-row class="justify-center align-center">
      <div>
        <v-text-field color="green" v-model="password" type="password" label="Password"/>
      </div>
      <div style="padding: 1rem"/>
      <v-btn v-on:click="verify" v-text="'Enter'"/>
    </v-row>
    <div v-if="shouldShow">
      <v-btn v-if="isProd()" v-on:click="$router.push('/report')">Report</v-btn>
      <v-btn v-on:click="$router.push('/post-table')">Post Table</v-btn>
      <v-btn v-on:click="$router.push('/invite')">Invite</v-btn>
      <v-btn v-on:click="$router.push('/user-table')">User Table</v-btn>
      <v-btn v-on:click="$router.push('/add-category')">Add Category</v-btn>
      <v-btn v-on:click="$router.push('/notification')">Notification</v-btn>
    </div>

  </v-container>
</template>

<script>
import bcrypt from 'bcryptjs';

export default {
  name: "SuperAdminButtons",
  data: () => ({
    password: '',
    shouldShow: false
  }),
  methods: {
    async verify() {
      bcrypt.compare(this.password,`$2a$10$${process.env.VUE_APP_PASSWORD_HASH}`, (err, res) => this.shouldShow = res)
    },
    isProd() {
      return process.env.VUE_APP_ENV === 'PROD'
    }
  }
}
</script>

<style scoped>

</style>