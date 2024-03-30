<template>
  <div>
    <div style="padding-right: 2rem">
      <v-row class="justify-end">
        <v-switch v-model="editMode" label="Edit Mode" color="#50B359"/>
      </v-row>
      <v-row class="justify-end">
        <div>Green column headers are editable</div>
      </v-row>
    </div>
    <div style="padding: 2rem">
      <v-btn v-on:click="nextSet" v-text="'Next'"/>
      <DBTable :items="userData" :headers="items" :jsonKeys="jsonKeys" :editMode="editMode" :canUpdate="canUpdate"
               @update="updateData"/>
      <v-btn v-on:click="nextSet" v-text="'Next'"/>
    </div>
  </div>
</template>

<script>
import DBTable from "@/components/common/DBTable";
import {getUsers, updateUser} from "@/api/UserApi";

export default {
  name: "UserTablePage",
  components: {DBTable},
  mounted() {
    this.getFirstUserData()
  },
  data: () => ({
    userData: [],
    items: [],
    editMode: false,
    jsonKeys: ['_stats', 'activityData', 'strikeData', 'currentScoreData', 'totalPreviousScoreData', 'previousScoreData', 'realIdFaceData', 'realIdFailedVerificationImageData'],
    canUpdate: ['handle', 'name', 'email', 'phoneNumber', 'avatarImage', 'gender', 'suspensionExpirationTS', 'score', 'isSuspended', 'deleteRequestAt', 'realIdVerificationStatus', 'realIdFailedStatusMessage', 'inviteCount', '_stats', 'activityData', 'strikeData', 'currentScoreData', 'totalPreviousScoreData', 'previousScoreData', 'realIdFailedVerificationImageData']
  }),
  methods: {
    async getFirstUserData() {
      const r = (await getUsers(new Date().toISOString(), 10)).data
      if (r.status === "OK") {
        await this.parseUser(r.data)
      } else {
        this.$notify({
          title: "Error",
          type: "error"
        });
      }
    },
    async nextSet() {
      const r = (await getUsers(this.userData[this.userData.length - 1].createdAt, 10)).data
      if (r.status === "OK") {
        const data = r.data
        if (data.length > 0) {
          await this.parseUser(data)
        } else {
          this.$notify({
            title: "Error",
            text: "No more users",
            type: "error"
          });
        }
      } else {
        this.$notify({
          title: "Error",
          type: "error"
        });
      }

    },
    async parseUser(userData) {
      this.items = Object.keys(userData[0]).map(e => {
        return {
          text: e.replace(/([A-Z])/g, (match) => ` ${match}`)
              .replace(/^./, (match) => match.toUpperCase())
              .trim(),
          sortable: false,
          value: e,
          class: this.canUpdate.includes(e) ?'green lighten-5':null
        }
      })
      for (let i = 0; i < this.jsonKeys.length; i++) {
        for (let j = 0; j < userData.length; j++) {
          userData[j][this.jsonKeys[i]] = JSON.stringify(userData[j][this.jsonKeys[i]])
        }
      }
      this.userData = userData
    },
    async updateData(key, id, data) {
      let value;
      try {
        value = this.jsonKeys.includes(key) ? JSON.parse(data) : data
      } catch (e) {
        this.$notify({
          title: "Error",
          text: e,
          type: "error"
        });
        return;
      }
      const response = (await updateUser(id, {[key]: value})).response
      if (response.status === "OK") {
        this.$notify({
          title: "Success",
          text: "updated " + key + " on user id:" + id,
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