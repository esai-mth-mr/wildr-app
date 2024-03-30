<template>
  <v-card width="600" style="padding: 2rem">
    <v-card-title v-if="invite.utmName">UTM name: {{ invite.utmName }}</v-card-title>
    <v-card-title>Code: {{ invite.code }}</v-card-title>
    <v-card-subtitle v-if="invite.redeemedByUserIds">Amount: {{ invite.redeemedByUserIds.length }}</v-card-subtitle>
    <v-row class="justify-center align-center">
      <v-col class="d-flex justify-center"
             v-for="(i, index) in users"
             :key="index">
        <v-card>
          <v-card-title>@{{ i.handle }}</v-card-title>
          <v-card-text v-if="i._stats.postCount ">Post Count: {{ i._stats.postCount }}</v-card-text>
          <v-card-text v-if="i.realIdVerificationStatus">Real id verified: {{ i.realIdVerificationStatus === 3 }}
          </v-card-text>
          <v-card-text v-else>Real id verified: false
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>

import {getUsersByIds} from "@/api/UserApi";

export default {
  name: "InviteCard",
  props: {
    invite: Object
  },
  mounted() {
    this.getUsers()
  },
  data: () => ({
    users: []
  }),
  methods: {
    async getUsers() {
      if (!this.invite.redeemedByUserIds) return
      const response = (await getUsersByIds(this.invite.redeemedByUserIds)).response
      if (response.status === "OK") {
        this.users = response.data
      } else {
        this.$notify({
          title: "Error",
          text: "Error getting users ",
          type: "error"
        });
      }
    }
  }
}
</script>

<style scoped>

</style>