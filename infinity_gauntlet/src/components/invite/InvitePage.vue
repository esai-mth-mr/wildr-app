<template>
  <v-container>
    <v-row class="justify-center align-center">
      <div>
        <v-select v-model="selectedSourceName" :items="sourceName" label="Source Name"/>
        <v-text-field color="#50B359" label="Referral Name (Same as dynamic link)" v-model="referralName"/>
        <v-text-field color="#50B359" label="Referral Handle" prefix="@" v-model="referralHandle"/>
      </div>
      <div style="padding: 1rem"/>
      <v-btn dark color="#50B359" v-on:click="addReferral" v-text="'Add Referral and get code'"/>

    </v-row>
    <div v-if="referralCode!==''">Code: {{ referralCode }}</div>
    <div v-if="referralData">
      <vue-json-pretty :path="'res'"
                       showLength
                       :data="referralData"/>
    </div>
    <v-row class="justify-center align-center">
      <div>
        <v-text-field color="#50B359" label="handle" prefix="@" v-model="handle" v-on:keyup.enter="getInvites"/>
      </div>
      <div style="padding: 1rem"/>
      <v-btn dark v-if="!isLoading" color="#50B359" v-on:click="getInvites" v-text="'Request details'"/>
      <v-progress-circular v-else color="#50B359"/>
    </v-row>

    <h2 v-if="invites.length!==0">Invites</h2>
    <v-row class="justify-center align-center">
      <v-col class="d-flex justify-center"

             v-for="(i, index) in invites.invites"
             :key="index">
        <InviteCard :invite="i" :key="(index+inviteCardKey)"/>
      </v-col>
    </v-row>

  </v-container>

</template>

<script>
import {addInvites, addReferralAndGetInvite, getInvitesByHandle} from "@/api/InviteApi";
import InviteCard from "@/components/invite/InviteCard";
import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';

export default {
  name: "InvitePage",
  components: {InviteCard, VueJsonPretty},
  data: () => ({
    invites: [],
    inviteCardKey: 0,
    userId: '',
    addInviteNum: 0,
    remainingUserInvites: 0,
    isLoading: false,
    isInviteLoading: false,
    handle: '',
    referralName: '',
    referralHandle: '',
    referralData: {},
    referralCode: null,
    sourceName: ['Ambassador', 'Partner', 'Influencer'],
    selectedSourceName: ''
  }),
  methods: {
    async getInvites() {
      if (this.handle === '') {
        this.$notify({
          title: "Error",
          text: "Please enter a handle",
          type: "error"
        });

        return
      }
      this.isLoading = true
      const response = (await getInvitesByHandle(this.handle)).data
      if (response.status === "OK") {
        const inviteData = response.data
        this.invites = inviteData
        this.userId = inviteData.userId
        this.remainingUserInvites = inviteData.remainingUserInvites
        this.isLoading = false
        this.inviteCardKey++;
      } else {
        this.isLoading = false
        this.$notify({
          title: "Error",
          text: response.errorMessage,
          type: "error"
        });
      }
    },
    async addReferral() {
      if (this.referralName === '') {
        this.$notify({
          title: "Error",
          text: "Please enter a name",
          type: "error"
        });

        return
      }
      if (this.referralHandle === '') {
        this.$notify({
          title: "Error",
          text: "Please enter a handle",
          type: "error"
        });

        return
      }
      if (this.selectedSourceName === '') {
        this.$notify({
          title: "Error",
          text: "Please enter a source name",
          type: "error"
        });

        return
      }
      this.isLoading = true
      const response = (await addReferralAndGetInvite(this.referralName, this.referralHandle, this.selectedSourceName)).response
      if (response.status === "OK") {
        this.referralData = response.data
        this.referralCode = response.data.code
        this.isLoading = false
      } else {
        this.isLoading = false
        this.$notify({
          title: "Error",
          text: response.errorMessage,
          type: "error"
        });
      }
    },
    async addInvites() {
      const response = (await addInvites(this.userId.toString(), parseInt(this.addInviteNum))).response
      if (response.status === "OK") {
        this.remainingUserInvites = (parseInt(this.remainingUserInvites) + parseInt(this.addInviteNum))
        this.$notify({
          title: "Success",
          text: "User now has " + this.remainingUserInvites + " invites",
          type: "success"
        });
      } else {
        this.$notify({
          title: "Error",
          text: "Error updating ",
          type: "error"
        });
      }
    }
  }
}
</script>

<style scoped>

</style>