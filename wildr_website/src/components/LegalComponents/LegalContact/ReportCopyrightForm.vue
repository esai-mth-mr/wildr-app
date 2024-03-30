<template>
  <v-container>
    <v-card>
      <h1 style="padding-top: 2rem; padding-left: 2rem">Report copyright infringement</h1>
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
  TextAreaInput, CheckList, UploadButton
} from "@/components/VueForm/FormComponents";
import {SendLegalEmail} from "@/api/Email";

export default {
  name: "ReportCopyrightForm",
  components: {VueForm},
  data() {
    let self = this
    return {
      tableData: [
        Label("Reported content details", true),
        Label('Your contact info may be shared with the person who posted the content that you\'re reporting. You may prefer to provide your business or professional contact info'),
        BasicInput('name', 'Your full legal name'),
        BasicInput('copyrightOwnerName', 'Name of the copyright owner'),
        EmailInput(),
        NumberInput("phoneNumber", "Your phone number"),
        BasicInput("address", "Your Physical Address"),
        Label('Copyright ownership', true),
        Label('A report alleging infringement or violation of legal rights must come from the copyright owner or ' +
            'someone authorized to report on their behalf. If you aren\'t the copyright owner or an authorized ' +
            'representative, we won\'t be able to process your report.'),
        RadioButtons('relationship', "Your relationship to the copyright owner",
            [
              'I am the copyright owner',
              "I am a host, officer, or director (non-legal) of the copyright owner",
              "I am the legal counsel to the copyright owner",
              "I am an employee of the copyright owner",
              "I am an authorized agent of the copyright owner"
            ]),
        Label('Evidence of rights and authorization', true),
        Label('Provide a certificate, license agreement, and/or other materials to prove you are the copyright owner. ' +
            'This is critical to show proof of authority. You can upload a scanned copy of these materials.\n' +
            '\n' +
            'If you are authorized to act on behalf of the copyright owner, upload a copy of the power of attorney. ' +
            'If you don\'t have a power of attorney, upload a signed statement to explain your relationship to the ' +
            'copyright owner. Including all of the necessary documents will help us process your ' +
            'request more efficiently.'),
        UploadButton("Evidence of rights and authorization", "Provide a certificate, license agreement, and/or " +
            "other materials to prove you are the copyright owner. This is critical to show proof of authority. You can " +
            "upload a scanned copy of these materials. If you are authorized to act on behalf of the copyright owner, " +
            "upload a copy of the power of attorney. If you don't have a power of attorney, upload a signed statement to" +
            " explain your relationship to the copyright owner. Including all of the necessary documents will help us " +
            "process your request more efficiently."),
        Label("Content to report", true),
        TextAreaInput('urls', "Enter the URL(s) for the content you are reporting on Wildr ", null),
        Label("About your copyrighted work", true),
        RadioButtons('copyrightedType', "Type of copyrighted work",
            [
              'Video',
              "Original Music",
              "Non-Music Audio",
              "Photo / Picture",
              "Logo",
              "Other",
            ]),
        BasicInput("copyrightedDescription", "Description of copyrighted work", "Include a clear and " +
            "complete description of your copyrighted work that you believe was infringed."),
        Label("Statement", true),
        CheckList('statement', "Confirm that these statements are true before submitting", [
          "I have a good faith belief that the reported use of the material, in the manner complained of, is not authorized by the copyright owner, its agent, or the law.",
          "I state under penalty of perjury that the above information is accurate, and that I am the copyright owner or am authorized to act on behalf of the copyright owner.",
          "I acknowledge that all information submitted in my copyright infringement notification may be forwarded to the uploader of the content, to lumendatabase.org, or otherwise made public in any way by Wildr or a third party."
        ]),
        Label("Signature", true),
        BasicInput('signature', 'Sign your name electronically', "Include the signature of the copyright owner or an authorized representative of the copyright owner. You can enter your full legal name as your electronic signature."),
        SubmitButton((formData) => self.sendData(formData))
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