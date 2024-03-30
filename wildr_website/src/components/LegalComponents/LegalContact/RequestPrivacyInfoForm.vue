<template>
  <v-container>
    <v-card>
      <h1 style="padding-top: 2rem; padding-left: 2rem">Request privacy information</h1>
      <VueForm :tableData="tableData" style="padding: 2rem 2rem 0 2rem;"/>
      <div style="color: gray; font-size: 10px; padding: 0 2rem 2rem 2rem;" >
        Visit our
        <a href="/legal/privacy-policy">Privacy Policy</a>
        to learn more about how we collect, use, and share personal information. Our
        <a href="/legal/community-guidelines">Community Guidelines</a> what types of content are considered privacy violations.
      </div>
    </v-card>
  </v-container>
</template>

<script>
import VueForm from "@/components/VueForm/Vue-Form";
import {
  BasicOptionalInput,
  CheckList, CountrySelect,
  EmailInput,
  Label,
  RadioButtons,
  SubmitButton
} from "@/components/VueForm/FormComponents";

export default {
  name: "RequestPrivacyInfo",
  components: {VueForm},
  data: () => ({
    tableData: [
      Label('Wildr values your privacy and safety, and we believe in data transparency. Fill out this form to:\n' +

          'Request information about your data\n' +
          'Report a privacy violation\n' +
          'Ask about a particular privacy issue'),
      Label("Contact information", true),
      CountrySelect(),
      EmailInput(),
      BasicOptionalInput("username", "Your Wildr username (Optional)", "A Wildr username can be found in the user's profile page, under the profile picture, shown as \"@xxxxxx\""),
      Label("Privacy and safety request", true),
      RadioButtons('request', "What is your request? ",
          [
            'Request information or action about account data',
            "Report a privacy violation",
            "Report an underage user",
            "Other",
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
      Label('Declaration', true),
      CheckList('statement', "Confirm that these statements are true before submitting", [
        "I ensure, to the best of my ability and knowledge, that all the information disclosed above is accurate and true.",
        "By submitting, I acknowledge and consent that TikTok will process my data in accordance with Wildr's Privacy Policy.",
      ]),
      SubmitButton((formData) => console.log(formData))

    ]


  }),
}
</script>

<style scoped>

</style>