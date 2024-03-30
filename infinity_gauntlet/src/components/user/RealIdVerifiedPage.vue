<template>
  <v-container>
    <v-date-picker
        v-model="dates"
        range
        color="green lighten-1"
    />
    <div>
      <v-btn :disabled="dates.length!==2" color="green" dark v-on:click="getUsers" v-text="'Request: ' + dates[0] +'->'+ dates[1]"/>
    </div>

    <div style="display: flex; flex-wrap: wrap; justify-content: center; align-content: center;">
      <div v-for="(user, index) in users" :key="index" style="border-style: solid; border-color: black">
        <UserActionsDialog :user="user"/>
        <div style="padding: 1rem"/>
        <div>{{user.id}}</div>
        <v-avatar size="100">
          <v-img :src="user.realIdFaceUrl"/>
        </v-avatar>
        <div>@{{user.handle}}</div>
      </div>
    </div>
  </v-container>
</template>

<script>
import {getRealIdVerifiedFaces} from "@/api/UserApi";
import UserActionsDialog from "@/components/user/UserActionsDialog";

export default {
  name: "RealIdVerifiedPage",
  components: {UserActionsDialog},
  data: () => ({
    dates: [],
    users: [],
  }),
  methods: {
    async getUsers() {
      const response = await getRealIdVerifiedFaces(this.dates[0], this.dates[1])
      console.log(response)
      this.users = response.data.data
    }
  }
}
</script>

<style scoped>

</style>