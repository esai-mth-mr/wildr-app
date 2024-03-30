<template>
  <v-card>
    <v-card-title class="justify-center">Handle: @{{ user.handle }}</v-card-title>
    <v-card-subtitle>
      <v-img :src="user.realIdFaceUrl" contain height="150"/>
    </v-card-subtitle>
    <v-card-text>
      <v-row>
        <v-col v-for="(i, index) in user.realIdFailedVerificationImageData" :key="index">
          <div>
            <div>
              Is Smiling: {{ i.isSmiling }}
            </div>
            <div>{{ getEmoji(i.handGesture) }}</div>
            <v-img :src="i.imageUrl"  contain height="150"/>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions style="justify-content: center">
      <v-btn color="success" rounded dark elevation="3" v-on:click="accept">Accept</v-btn>
      <v-btn color="error" rounded dark elevation="3" v-on:click="reject">Reject</v-btn>
    </v-card-actions>
    <v-card-actions style="justify-content: center" v-if="showMessage">
      <v-select
          v-model="message"
          :items="items"
          label="Why?"
          dense
      ></v-select>
    </v-card-actions>
    <v-card-actions style="justify-content: center" v-if="showConfirm">
      <v-btn  class="error" rounded
             color="primary"
             dark v-on:click="confirm">Confirm</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import {updateRealIdStatus} from "@/api/RealIdApi";
import {sendNotification} from "@/api/NotificationApi";
import {sendRealIdEmail} from "@/api/EmailApi";

export default {
  name: "RealIdCard",
  props: {
    user: Object,
  },
  data: () => ({
    showConfirm: false,
    showMessage: false,
    message: "",
    passCopy:{
      title: "You're Real ID verified! ✅",
      body: "Tap to start commenting on posts"
    },
    failCopy:{
      title: "Sorry, we couldn't verify your Real ID 😔",
      body: "Tap to try again!"
    },
    items: [
      "Your face didn't match your photo",
      "One or more of your images did not follow instructions",
      "The photo didn't show your face clearly",
      "An object was obstructing your face",
      "We detected that this is not your real image",
      "Your account has been taken down due to violating our community policy, therefore we are unable to verify you"
    ]
  }),
  methods: {
    async confirm() {
      if (!this.showMessage) {
        const response = (await updateRealIdStatus(true, this.user.id)).response
        if (response.status === "OK") {
          this.$notify({
            title: "Success",
            text: "User Verified",
            type: "success"
          });
          this.sendNotification(true)
          this.$emit("next");
        } else {
          this.$notify({
            title: "Error",
            text: response.message,
            type: "error"
          });
        }
      } else {
        if(this.message===""){
          this.$notify({
            title: "Error",
            text: "Provide a message",
            type: "error"
          });
          return;
        }
        const response = (await updateRealIdStatus(false, this.user.id, this.message)).response
        if (response.status === "OK") {
          this.$notify({
            title: "Success",
            text: "User Rejected",
            type: "success"
          });
          this.sendNotification(false)
          this.$emit("next");
        } else {
          this.$notify({
            title: "Error",
            text: response.errorMessage,
            type: "error"
          });
        }
      }

    },
    async sendNotification(pass) {
      const response =
          pass?(await sendNotification('USERS', this.passCopy.title, this.passCopy.body, [this.user.id])).response
              :(await sendNotification('USERS', this.failCopy.title, this.message + ". " + this.failCopy.body, [this.user.id])).response
      if (response.status === "OK") {
        this.$notify({
          title: "Success",
          text: response.message,
          type: "success"
        });

      } else {
        this.$notify({
          title: "Error sending passed",
          text: "Notification didn't send",
          type: "error"
        });
      }
      const emailResponse = (await sendRealIdEmail(pass, this.user.id,this.message)).response
      if (emailResponse.status === "OK") {
        this.$notify({
          title: "Success",
          text: "Sent email",
          type: "success"
        });
        this.isLoading = false
      } else {
        this.isLoading = false
        this.$notify({
          title: "Error Sending email",
          text: "Either user doesn't have email or something went wrong",
          type: "error"
        });
      }
    },
    accept() {
      this.showConfirm = true
      this.showMessage = false
    },
    reject() {
      this.showConfirm = true
      this.showMessage = true
    },
    getEmoji(number) {
      switch (number) {
        case 0:
          return "✌️";
        case 1:
          return "👍";
        case 2:
          return "👎";
        case 3:
          return "🤞";
        case 4:
          return "👊";
        case 5:
          return "🤟";
        case 6:
          return "✋";
        case 7:
          return "🤙";
        case 8:
          return "☝️";
      }
    }
  }
}
</script>

<style scoped>

</style>