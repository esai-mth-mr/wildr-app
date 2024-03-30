<template>
<v-container>
  <div v-if="redeemed" style="text-align: center; font-size: 2rem; font-weight: bold">Sorted by last redeemed</div>
  <div v-else style="text-align: center; font-size: 2rem; font-weight: bold">Sorted by code sent time</div>
  <v-row class="justify-center align-center" >
    <v-col class="d-flex justify-center"
           cols="12" sm="3" md="3" lg="4" xl="4"
           v-for="(i, index) in status"
           :key="index">
      <v-card >
        <v-card-title>{{i.email}}</v-card-title>
        <v-card-subtitle>Time Sent: {{new Date(i.timeSent).toDateString()}} {{new Date(i.timeSent).toLocaleTimeString()}} </v-card-subtitle>
        <v-card-text>Redeemed {{i.timeRedeemed?` at ${new Date(i.timeRedeemed).toDateString()} ${new Date(i.timeRedeemed).toLocaleTimeString()}`:'No'}}</v-card-text>
        <v-card-actions>code:{{i.code}}</v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</v-container>
</template>

<script>
export default {
  name: "InviteCodeStatus",
  props:{status: Array, redeemed: Boolean}
}
</script>

<style scoped>

</style>