<template>
  <div>
    <v-btn v-on:click="ping">Test Server</v-btn>
    <v-btn v-on:click="$router.push('/real-id')">Real Id</v-btn>
    <v-btn v-on:click="$router.push('/category')">Category</v-btn>
    <v-btn v-if="isDev()" v-on:click="$router.push('/report')">Report</v-btn>
    <v-btn  v-on:click="$router.push('/users')">Users</v-btn>
    <v-btn  v-on:click="$router.push('/posts')">Posts</v-btn>
    <v-btn  v-on:click="$router.push('/real-id-verified')">Real Id Verified</v-btn>
    <v-btn v-if="isDev()" v-on:click="$router.push('/notification')">Notification</v-btn>
    <div>{{ pingResponse }}</div>
    <SuperAdminButtons v-if="showSuperAdmin" />
  </div>
</template>

<script>
import {getRequest} from "@/api/common";
import SuperAdminButtons from "@/components/home/SuperAdminButtons";

export default {
  name: "RoutingButtons",
  components: {SuperAdminButtons},
  data: () => ({
    pingResponse: '',
    showSuperAdmin: false,
  }),
  mounted() {
   this.showSuperAdmin = this.$route.query.power=== 'on'
  },
  methods: {
    async ping() {
      this.pingResponse = (await getRequest('ping')).data
    },
    isDev(){
      return process.env.VUE_APP_ENV==='DEV';
    },
  }
}
</script>

<style scoped>

</style>