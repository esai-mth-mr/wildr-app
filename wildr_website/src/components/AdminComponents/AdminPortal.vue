<template>
  <v-col class="justify-center" style="padding-top: 1rem" cols="12">
    <v-row class="justify-center align-center">
      <v-btn v-on:click="CallApi('feedbacks')">
        Get all feedback
      </v-btn>

      <div style="padding: 1rem"/>
      <div style="padding: 1rem">
        <LogoutButton/>
      </div>
    </v-row>

    <ViewAllFeedback  v-if="data.feedbacks" :feedbacks="data.feedbacks" />
  </v-col>

</template>

<script>
import LogoutButton from "@/components/AdminComponents/LogoutButton";
import {GetAllFeedbacks} from "@/api/admin/AdminApi";
import ViewAllFeedback from "@/components/AdminComponents/ViewAllFeedback";

export default {
  name: "AdminPortal",
  components: {ViewAllFeedback, LogoutButton},
  data: () => ({
    data: {
      emails: null,
      emailsMobile: null,
      sendInviteCodes: null,
      inviteCodeStatusRedeemed: null,
      inviteCodeStatusNotRedeemed: null,
      users: null,
      feedbacks: null
    },
  }),
  methods: {
    CallApi(type) {
      Object.keys(this.data).map(i => this.data[i] = null)
      if (type === 'feedbacks') {
        GetAllFeedbacks()
            .then(r =>
                this.data[type] = r
                    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
            )
            .catch(() => {
              this.$notify({
                group: 'web',
                type: 'error',
                title: 'Error',
                text: "Unauthorized"
              });
            })
      }
    }
  }
}
</script>

<style scoped>

</style>