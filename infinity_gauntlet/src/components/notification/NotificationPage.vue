<template>

  <div>

    <v-container style="width: 400px; background-color: #EBEBEB;  padding: 1.5rem; border-radius: 15px;">
      <v-row class="align-content-center justify-center align-start">
        <img style="width: 50px; height: 50px " src="@/assets/logo.png" alt=""/>
        <div style="padding: .2rem"/>
        <div style="color: black; display: flex;flex-direction: column; align-items: start;">
          <h3 style="color: black; display:inline; width: 230px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: start">
            {{ title }}
          </h3>
          <div style=" width: 250px;white-space: initial; word-wrap: break-word; text-align: start;">{{ body }}</div>
        </div>
        <v-spacer/>
        <div>
          <div style="color: black">now</div>
        </div>
      </v-row>
    </v-container>

    <v-row class="justify-center align-center">
      <div>
        <v-text-field color="#50B359" label="Title" v-model="title"/>
        <v-text-field color="#50B359" label="Body" v-model="body"/>
      </div>
      <div style="padding: 1rem"/>
      <div>
        <v-switch v-model="disableAll" label="Enable All" color="green"/>
        <v-progress-circular v-if="isLoading"/>
        <v-btn v-else dark color="#50B359" :disabled="!disableAll" v-on:click="sendNotification(false)"
               v-text="'Send notification to ALL! users.'"/>
      </div>

    </v-row>

    <div>
      <div style="padding-left: 10rem; padding-right: 10rem;">
        <v-textarea v-model="userIds" color="green" label="User Ids comma seperated" height="100"/>
      </div>
      <div style="padding-left: 10rem; padding-right: 10rem;">
        <v-text-field v-model="marketingTag" color="green" label="marketing tag" />
      </div>
      <v-progress-circular v-if="isLoading"/>
      <v-btn v-else dark color="#50B359" v-on:click="sendNotification(true)" v-text="'Send notification users.'"/>

    </div>
  </div>

</template>

<script>
import {sendNotification} from "@/api/NotificationApi";

export default {
  name: "NotificationPage",
  data: () => ({
    title: '',
    body: '',
    isLoading: false,
    userIds: '',
    marketingTag: '',
    disableAll: false,
  }),
  methods: {
    async sendNotification(sendToUserList) {
      try {
        if (this.title === '') {
          this.$notify({
            title: "Error",
            text: "Please enter a title",
            type: "error"
          });

          return
        }
        if (this.body === '') {
          this.$notify({
            title: "Error",
            text: "Please enter a description",
            type: "error"
          });

          return
        }
        if (this.marketingTag === '') {
          this.$notify({
            title: "Error",
            text: "Please enter a marketing tag",
            type: "error"
          });

          return
        }
        if (sendToUserList && this.userIds === '') {
          this.$notify({
            title: "Error",
            text: "Please add users",
            type: "error"
          });

          return
        }
        this.isLoading = true

        const response = sendToUserList ?
            (await sendNotification('USERS',
                this.title,
                this.body,
                this.userIds.split(',').map(r => r.trim()),
                this.marketingTag))
                .response :
            (await sendNotification('ALL',
                this.title,
                this.body,
                this.marketingTag)
            ).response
        if (response.status === "OK") {
          this.$notify({
            title: "Success",
            text: response.message,
            type: "success"
          });
          this.isLoading = false
        } else {
          this.isLoading = false
          this.$notify({
            title: "Error",
            text: response.errorMessage,
            type: "error"
          });
        }
      } catch (e) {
        this.isLoading = false;
        this.$notify({
          title: "Error",
          type: "error"
        });
      }
    }
  }
}
</script>

<style scoped>

</style>