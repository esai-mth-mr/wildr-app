<template>
  <v-container>
    <v-card>
      <h1 style="padding-top: 2rem; padding-left: 2rem">Share your feedback</h1>
      <VueForm :tableData="tableData" style="padding: 2rem"/>
    </v-card>
  </v-container>
</template>

<script>
import VueForm from "@/components/VueForm/Vue-Form";
import {
  CheckList,
  BasicOptionalInput,
  EmailInput,
  Label,
  RadioButtons,
  SubmitButton, TextAreaInput, UploadButton, BasicInput,
} from "@/components/VueForm/FormComponents";
import {SendLegalEmail} from "@/api/Email";

export default {
  name: "FeedbackForm",
  components: {VueForm},
  data() {
    let self = this
    return {
      tableData: [
        Label('Tell us about a problem you\'d like to report or feedback that you have about your experience with TikTok. Information shared will only be used to respond to your report.'),
        Label("Contact information", true),
        BasicInput('name', "Your Full name"),
        EmailInput(),
        BasicOptionalInput("username", "Your Wildr username (Optional)", "A Wildr username can be found in the user's profile page, under the profile picture, shown as \"@xxxxxx\""),
        RadioButtons('topic', "Topic",
            [
              'General account inquiry',
              "Account ban/suspension",
              "Report a bug/Feature request",
              "Wildr Creator Fund",
              "Wildr for Business",
              "Report inappropriate content",
            ]),
        RadioButtons('more', "Tell us more",
            [
              'Login issue',
              "Recover account",
              "Age verification",
              "Phone or email settings",
              "Deleted account",
              "Hacked account",
              "Banned account",
              "Account Security Notification",
              "Other",
            ]),
        TextAreaInput("additionalInfo", "How can we help?"),
        UploadButton("Attachment", "You can upload an screenshot to share details related to your feedback"),
        Label('Declaration', true),
        CheckList('statement', "Confirm that these statements are true before submitting", [
          "I ensure, to the best of my ability and knowledge, that all the information disclosed above is accurate and true.",
          "By submitting, I acknowledge and consent that Wildr will process my data in accordance with Wildr's Privacy Policy.",
        ]),
        SubmitButton((formData) => self.sendData(formData))
      ]

    }
  },
  methods: {
    async sendData(formData) {
      await this.$recaptchaLoaded()
      const reCaptchaToken = await this.$recaptcha('form')
      if (formData.file) formData.filename = document.getElementsByClassName('file')[0].files[0].name;
      SendLegalEmail("Feedback Form", formData, reCaptchaToken)
          .then(() => {
            this.$notify({
              group: 'web',
              type: 'success',
              title: 'Success',
              text: "Email Sent Successfully"
            })
          })
          .catch(() => {
            this.$notify({
              group: 'web',
              type: 'error',
              title: 'Error',
              text: "There was an error sending your legal request. Please contact legal@wildr.com directly."
            });
          })
    }
  }
}
</script>

<style scoped>

</style>