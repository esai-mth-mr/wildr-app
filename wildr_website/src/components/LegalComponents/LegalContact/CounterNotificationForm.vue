<template>
  <v-container>
    <v-card>
      <h1 style="padding-top: 2rem; padding-left: 2rem">Counter Notification Form</h1>
      <VueForm :tableData="tableData" style="padding: 2rem"/>
    </v-card>
  </v-container>
</template>

<script>
import VueForm from "@/components/VueForm/Vue-Form";
import {
  Label,
  BasicInput,
  DateInput,
  EmailInput,
  NumberInput,
  RadioButtons, SubmitButton,
  TextAreaInput, CheckList, UploadButton
} from "@/components/VueForm/FormComponents";
import {SendLegalEmail} from "@/api/Email";

export default {
  name: "CounterNotificationForm",
  components: {VueForm},
  data() {
    let self = this
    return {
      tableData: [
        Label("Reported content details", true),
        BasicInput('name', 'Your full legal name'),
        EmailInput(),
        NumberInput("phoneNumber", "Your phone number"),
        BasicInput("address", "Your Physical Address"),
        BasicInput("username", "Your Wildr username", "A Wildr username can be found in the user's profile page, under the profile picture, shown as \"@xxxxxx\""),
        RadioButtons('yourRole', "Your role", ['You posted the reported content.', "You are an " +
        "authorized representative of the person who posted the video, such as their attorney."]),
        BasicInput("relationship", "Specify your relationship to them"),
        Label("Contact Information", true),
        BasicInput("reportNumber", "Report Number", "Included in the in-app notification sent to the uploader when the content was removed."),
        DateInput("reportDate", "Date and Time reported content was posted", "Included in the in-app notification sent to the uploader when the content was removed"),
        TextAreaInput('reportDescription', "Describe the reported content", null),
        TextAreaInput('identifyLocation', "Identify the location, including the URL, of the content that was reported", null),
        TextAreaInput('additionalDetails', "Additional details about your content or account status", null),
        TextAreaInput('why', "Why you believe your content was reported incorrectly", null),

        UploadButton( "Evidence to substantiate your appeal or counter-claim", "You can show that you have the right to use this content or share how this is a permitted use or exception. This may help provide more context around the situation, but please note that Wildr is not in a position to adjudicate disputes.",
        ),
        Label("Statement", true),
        CheckList('statement', "Confirm that these statements are true before submitting", [
          'I swear, under penalty of perjury, that I have a good faith belief that the content was removed as a result ' +
          'of a mistake or mis-identification of the content.',
          "I consent to the jurisdiction of the Federal District Court for the district in which my address is located," +
          " or if my address is outside of the United States, the judicial district in which Wildr is located, and will" +
          " accept service of process from the claimant."]),
        Label("Signature", true),
        BasicInput('signature', 'Sign your name electronically'),
        SubmitButton((formData) => {
              self.sendData(formData)
            }
        )
      ]
    }
  },
  methods: {
    async sendData(formData) {
      await this.$recaptchaLoaded()
      const reCaptchaToken = await this.$recaptcha('form')
      if (formData.file) formData.filename = document.getElementsByClassName('file')[0].files[0].name;
      SendLegalEmail("Counter Notification Form", formData, reCaptchaToken)
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