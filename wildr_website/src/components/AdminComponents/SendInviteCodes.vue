<template>
  <div>
    <v-progress-circular
        v-if="isLoading"
        :size="70"
        :width="7"
        color="green"
        indeterminate
    ></v-progress-circular>
    <div v-else>
      <v-textarea color="green" label="Enter emails seperated by commas" v-model="emails"/>
      <v-btn v-on:click="CallSendEmails">Send</v-btn>
    </div>
  </div>
</template>

<script>
import {SendInviteCodeEmails} from "@/api/admin/AdminApi";

export default {
  name: "SendInviteCodes",
  data: () => ({
    emails: "",
    isLoading: false,
  }),
  methods: {
    validateEmail(email) {
      return new RegExp(/[\w-]+@([\w-]+\.)+[\w-]+/gm).test(email);
    },
    CallSendEmails() {
      const emails = this.emails.split(',').map(r => r.trim())
      for (const i of emails) {
        if (!this.validateEmail(i)) {
          this.$notify({
            group: 'web',
            type: 'error',
            title: 'Error',
            text: "There are one or more invalid emails"
          });
          return;
        }
      }
      this.isLoading = true;
      SendInviteCodeEmails(emails).then(r => {
        this.isLoading = false;
        this.$notify({
          group: 'web',
          type: 'success',
          title: 'Success',
          text: r
        });
      }).catch(r => {
        this.isLoading = false;
        this.$notify({
          group: 'web',
          type: 'error',
          title: 'Error',
          text: r
        });
      })
    }
  }
}
</script>

<style scoped>

</style>