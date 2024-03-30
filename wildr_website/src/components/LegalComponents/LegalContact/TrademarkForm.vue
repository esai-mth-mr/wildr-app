<template>
  <v-container>
    <v-card>
      <h1 style="padding-top: 2rem; padding-left: 2rem">Report trademark infringement</h1>
      <VueForm :tableData="tableData" style="padding: 2rem"/>
    </v-card>
  </v-container>

</template>

<script>
import VueForm from "@/components/VueForm/Vue-Form";
import {
  Label,
  BasicInput,
  EmailInput,
  NumberInput,
  RadioButtons, SubmitButton,
  TextAreaInput, CheckList, UploadButton, BasicOptionalInput
} from "@/components/VueForm/FormComponents";
import {SendLegalEmail} from "@/api/Email";

export default {
  name: "TrademarkForm",
  components: {VueForm},
  data() {
    let self = this
    return {
      tableData: [
        Label('Fill out this form to report content that you believe infringes your trademark.'),
        Label("Contact information", true),
        Label("Your contact info may be shared with the person who posted the content that you're reporting. You may prefer to provide your business or professional contact info"),
        BasicInput('name', 'Your full legal name'),
        BasicInput('trademarkOwnerName', 'Name of the trademark owner'),
        EmailInput(),
        NumberInput("phoneNumber", "Your phone number"),
        BasicInput("address", "Your Physical Address"),
        Label('Issue Type', true),
        RadioButtons('issueType', "Is this an issue related to counterfeit goods?",
            [
              'Yes',
              "No",
            ]),
        Label('Trademark ownership', true),
        Label("A report alleging infringement or violation of legal rights must come from the trademark owner or " +
            "someone authorized to report on their behalf. If you aren't the trademark owner or an authorized " +
            "representative, we won't be able to process your report."),
        RadioButtons('relationship', "Your relationship to the copyright owner",
            [
              'I am the trademark owner',
              "I am a host, officer, or director (non-legal) of the trademark owner",
              "I am the legal counsel to the trademark owner",
              "I am an employee of the trademark owner",
              "I am an authorized agent of the trademark owner"
            ]),
        UploadButton("trademark", "If you are authorized to act on behalf of the trademark owner, " +
            "upload a copy of the power of attorney. Including all of the necessary documents will help us " +
            "process your request more efficiently."),

        Label('Trademark registration info', true),
        BasicInput('jurisdictionRegistration', "Jurisdiction of registration"),
          BasicInput('registrationNumber', "Registration number"),
          BasicInput("trademarkedGoodsServiceClass", "Trademarked goods and service class"),
          BasicOptionalInput("trademarkRecord", "URL of your trademark record (optional)"),
        Label("Content to report", true),
        TextAreaInput('urls', "Enter the URL(s) for the content you are reporting on Wildr ", null),
          BasicInput("infringementDescription", "Description of how you believe the content has infringed upon your trademark"),
        Label("Statement", true),
        CheckList('statement', "Confirm that these statements are true before submitting", [
          "Description of how you believe the content has infringed upon your trademark",
          "I state under penalty of perjury that the above information is accurate, and that I am the trademark owner or am authorized to act on behalf of the trademark owner.",
          "I acknowledge that all information submitted in my trademark infringement notification may be forwarded to the uploader of the content."
        ]),
        Label("Signature", true),
        BasicInput('signature', 'Sign your name electronically', "Include the signature of the trademark owner or an authorized representative of the copyright owner. You can enter your full legal name as your electronic signature."),
        SubmitButton((formData) => self.sendData(formData))
      ]
    }
  },
  methods: {
    async sendData(formData) {
      await this.$recaptchaLoaded()
      const reCaptchaToken = await this.$recaptcha('form')
      if (formData.file) formData.filename = document.getElementsByClassName('file')[0].files[0].name;
      SendLegalEmail("Trademark Form", formData, reCaptchaToken)
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