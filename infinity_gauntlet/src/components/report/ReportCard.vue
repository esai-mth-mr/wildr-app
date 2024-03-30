<template>
  <v-card style="padding: 1rem; text-align: center">
    <v-card-title class="justify-center ">
      <v-col>
        <v-row class="justify-space-around">
          <h2>
            Type:{{ objectType }}
          </h2>
          <h2 style="padding-left:2rem">
            Report Counts: {{ reportData.reportIds.length }}
          </h2>
        </v-row>
        <v-row class="justify-center">
          <h2>Relevant {{ objectType }} Data</h2>
        </v-row>
        <v-row class="justify-center">
          <h4>Time Since {{ getTimePassed() }} </h4>
        </v-row>
      </v-col>
    </v-card-title>
    <div style="color: red" v-if="objectData.willBeDeleted"><b><u>User Deleted</u></b></div>
    <v-card-text v-if="objectType==='POST'">
      <CaptionStr :caption="objectData.caption"/>
      <div><b><u>Troll Detection bypassed by user:</u></b> {{ objectData.wasBypassed }}</div>
      <MultiPost :post="objectData"/>
    </v-card-text>
    <v-card-text class="justify-center align-center" v-else-if="objectType==='COMMENT'|| objectType==='REPLY'"
                 style="border: 5px solid black; margin: 1rem; padding: 1rem;  ">
      <h3>{{ objectType }}</h3>
      <div>{{ objectData.content.segments.map(r => r.segment.chunk).join(' ') }}</div>
      <v-btn v-on:click="getPost" v-text="'Get Post'" v-if="!post"/>
      <div v-else style="border: 5px solid black; margin: 1rem; padding: 1rem;">
        <h3>POST</h3>
        <MultiPost :post="post" :showUser="true"/>
      </div>

    </v-card-text>
    <v-card-text>
      <h2>Relevant User Data</h2>
      <h3>@{{ user.handle }}</h3>
      <div :style="'color:' + getProfileColor(user.score)">
        <b><u>Score:</u></b> {{ user.score }}
      </div>
      <div>
        <b><u>Real Id Status:</u></b> {{ getRealIdVerificationStatus(user.realIdVerificationStatus) }}
      </div>
      <div>
        <b><u>Is Suspended:</u></b> {{ user.isSuspended }}
      </div>
      <StrikeDetails :user="user"/>
    </v-card-text>
    <v-card-actions style="justify-content: center">
      <v-btn color="" rounded dark elevation="3" v-on:click="getReporters">Get Reporters</v-btn>
    </v-card-actions>
    <div>
      <v-row style="padding-top: 2rem" class="justify-center">
        <div v-for="(i, index) in reporters" :key="index"
             style="border: 1px solid black; margin: 1rem; padding: 1rem">
          <div>
            @{{ i.user.handle }}
          </div>

        </div>
      </v-row>
    </div>
    <v-card-actions style="justify-content: center">
      <v-btn color="success" rounded dark elevation="3" v-on:click="accept">Accept</v-btn>
      <v-btn color="error" rounded dark elevation="3" v-on:click="reject">Reject</v-btn>
    </v-card-actions>
    <v-card-actions style="justify-content: center" v-if="showMessage">
      <div>
        <v-select
            color="#50B359"
            v-model="message"
            :items="items"
            label="Why?"
            dense
        />
      </div>
      <v-select v-model="selectedLink" :items="legalLinks" item-text="name" item-value="" label="Community Guidelines"/>
    </v-card-actions>
    <v-card-actions>
      <v-text-field color="#50B359" v-if="message==='Other'" v-model="otherMessage" label="Other"/>
    </v-card-actions>
    <v-card-actions style="justify-content: center" v-if="showConfirm">
      <v-btn rounded
             color="black"
             dark v-on:click="confirm">Confirm
      </v-btn>
    </v-card-actions>
  </v-card>

</template>

<script>
import {getDateTimeSince} from "@/components/common/getDateTimeSince";
import {getReporters, updateReport} from "@/api/ReportApi";
import MultiPost from "@/components/post/MultiPost";
import CaptionStr from "@/components/post/CaptionStr";
import StrikeDetails from "@/components/user/StrikeDetails";
import LegalLinks from "@/assets/community_guidlines_legal_links.json"
import {sendNotification} from "@/api/NotificationApi";
import {sendReportEmail} from "@/api/EmailApi";

export default {
  name: "ReportCard",
  components: {StrikeDetails, CaptionStr, MultiPost},
  props: {
    reportData: Object,
    objectData: Object,
    objectType: String,
    user: Object,
    id: String,
    post: Object
  },
  mounted() {
    this.legalLinks = LegalLinks
  },
  data: () => ({
    showConfirm: false,
    showMessage: false,
    reviewResult: 0,
    rejected: false,
    message: "",
    otherMessage: "",
    reporters: [],
    selectedLink: null,
    items: [
      "Spam",
      "Nudity or Sexual Activity",
      "Racist language or activity",
      "Violence or dangerous organizations",
      "Bullying or harassment",
      "Other"
    ],
    legalLinks: [],
  }),
  methods: {
    accept() {
      this.showConfirm = true
      this.showMessage = true
      this.reviewResult = 2
      this.rejected = false
    },
    reject() {
      this.showConfirm = true
      this.showMessage = false
      this.rejected = true
      this.reviewResult = 1
      this.message = "Rejected Report"
    },
    async confirm() {
      if (this.message === "") {
        this.$notify({
          title: "Error",
          text: "Provide a message",
          type: "error"
        });
        return;
      }
      if (!this.rejected)
        if (!this.selectedLink) {
          this.$notify({
            title: "Error",
            text: "Provide a Community Guideline link",
            type: "error"
          });
          return;
        }
      await this.sendReport()
      this.$emit('update')
      this.showConfirm = false
      this.showMessage = false
      this.reviewResult = 0
      this.message = ""
      this.selectedLink = null
      this.otherMessage = ""
      this.rejected = false
    },
    async getReporters() {
      const reportersData = (await getReporters(this.id)).data
      if (reportersData.status === "OK") {
        if (reportersData.data.length !== 0) {
          this.reporters = reportersData.data
        }
      } else {
        this.$notify({
          title: "Error",
          type: "error"
        });
      }
    },
    getProfileColor(score) {
      if (score <= 2) {
        return "red";
      } else if (score <= 4) {
        return "orange";
      } else {
        return "#50B359";
      }
    },
    async sendReport() {
      const result = (
          await updateReport(
              this.reportData.id,
              'wildr_admin',
              this.reviewResult,
              this.message === 'Other' ? this.otherMessage : this.message,
              this.rejected ? 0 : this.legalLinks[this.legalLinks.findIndex(r => r.name === this.selectedLink)].num
          )
      ).response
      if (result) {
        if (result.status === 'OK') {
          this.$notify({
            title: "Success",
            text: "Updated Report",
            type: "success"
          });
          if (!this.rejected) await this.sendNotification()
        } else {
          this.$notify({
            title: "Error",
            text: "Error Updating report",
            type: "error"
          });
        }
      }
    },
    async sendNotification() {
      const notificationCopy = {
        title: "Your post was reported",
        body: `Reason: ${this.message === 'Other' ? this.otherMessage : this.message}. Please email contact@wildr.com if you have questions regarding this report.`,
      }
      const response = (await sendNotification(
          'USERS',
          notificationCopy.title,
          notificationCopy.body,
          [this.user.id])).response
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
      this.selectedLink = this.legalLinks[this.legalLinks.findIndex(r => r.name === this.selectedLink)]
      const emailResponse = (await sendReportEmail(
          this.reportData.reportedObjectAuthorId,
          this.message === 'Other' ? this.otherMessage : this.message,
          this.selectedLink.link,
          this.selectedLink.num,
          this.selectedLink.name,
          this.reportData.id,)).response
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
    getTimePassed() {
      return getDateTimeSince(new Date(this.reportData.createdAt))
    },
    getRealIdVerificationStatus(num) {
      switch (num) {
        case 0:
          return 'UNVERIFIED';
        case 1:
          return 'PENDING_REVIEW';
        case 2:
          return 'REVIEW_REJECTED';
        case 3:
          return 'VERIFIED';
      }
    },
    getPost() {
      this.$parent.getPost();
    }
  }
}
</script>

<style scoped>
.v-card__text {
  color: black !important;
}
</style>