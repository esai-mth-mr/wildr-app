<template>
  <div>
    <div v-if="windowSize.width<1200" style="padding-bottom: 4rem;"/>
    <v-img class="wave" src="@/assets/wave.svg"/>
    <div
        style=" padding-top:2rem;  display: flex; justify-content: center; align-content: center; flex-direction: column;">
      <h1 style="font-size: 2.5rem;  color:#00B64C; text-align: center;">Chat with us!
      </h1>
    </div>
    <div style=" display: flex; justify-content: center; align-content: center;">
    </div>
    <v-container style="padding-top: 5rem">
      <v-row class="justify-center align-center">
        <v-col cols="10" md="6" lg="5" sm="6">
          <v-row v-for="(i, index) in information" :key="index" style="padding: 1rem;" class="">
            <v-hover>
              <v-card width="500"  class="textCard" slot-scope="{ hover}" :elevation="hover?5:1">
                <div class="justify-center">
                  <v-avatar color="#00B64C">
                    <div style="font-size: 2rem;" >{{ i.emoji }}</div>
                  </v-avatar>
                </div>
                <div style="padding: .5rem; color: #292934">{{ i.text }}</div>
              </v-card>

            </v-hover>

          </v-row>
        </v-col>
        <v-col cols="10" md="6" lg="5" sm="6">
          <v-container>

            <v-card class="px-5" style="" >
              <v-form ref="registerForm" v-model="valid" lazy-validation>
                <v-row>
                  <v-col cols="12">
                    <div style="display: flex;">
                      <p style="font-weight: bold; font-size: 2rem; color: #292934">Send us a message
                      </p>
                    </div>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                        v-model="name"
                        label="Name"
                        required
                        outlined
                        :rules="nameRules"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                        v-model="email"
                        outlined
                        :rules="emailRules" label="E-mail" required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                        v-model="subject"
                        label="Subject"
                        required
                        outlined
                        :rules="nameRules"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-textarea
                        auto-grow
                        :counter="500"
                        outlined
                        v-model="message"
                        :rules="messageRules"
                        color="#00B64C"
                        name="input-7-4"
                        label="Message">

                    </v-textarea>

                  </v-col>
                  <v-col class="d-flex ml-auto justify-center align-center" cols="12">
                    <div v-if="loading">
                      <v-progress-circular indeterminate color="#00B64C" :width="5"/>
                    </div>
                    <v-btn v-else x-large block dark color="#00B64C" @click="validate">Send Message</v-btn>
                  </v-col>
                </v-row>
                <div style="color: gray; text-align: center; padding: .5rem; font-size: 10px">
                  This site is protected by reCAPTCHA and the Google
                  <a href="https://policies.google.com/privacy">Privacy Policy</a> and
                  <a href="https://policies.google.com/terms">Terms of Service</a> apply.
                </div>
              </v-form>
            </v-card>
          </v-container>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>

import {SendContact} from "@/api/Contact";

export default {
  name: "ContactUs",
  mounted() {
    this.onResize()
    window.addEventListener('resize', this.onResize);
  },
  data: () => ({
    loading: false,
    information: [
      {
        emoji: "💰",
        text: "Looking to invest?",
      },
      {
        emoji: "👨‍💻",
        text: "Want to build with us?",
      },
      {
        emoji: "🥳",
        text: "Want to collaborate with us?",
      }
    ],
    name: '',
    subject: '',
    email: '',
    message: '',
    valid: true,
    nameRules: [
      v => !!v || "Required",
      v => v.length > 2 || "Name should at least be 3 characters"
    ],
    windowSize: {
      width: 0,
      height: 0
    },
    emailRules: [
      v => !!v || "Required",
      v => /.+@.+\..+/.test(v) || "Email must be valid"
    ],
    messageRules: [
      v => !!v || "Required",
      v => (v || '').length <= 500 || "Message can't exceed 500 characters",
      v => v.length > 4 || "Name should at least be 5 characters"
    ]
  }),
  methods: {
    onResize() {
      this.windowSize = {width: window.innerWidth, height: window.innerHeight}
    },
    async validate() {
      if (this.$refs.registerForm.validate()) {
        this.loading = true
        await this.$recaptchaLoaded()
        const reCaptchaToken = await this.$recaptcha('contact')
        SendContact({name: this.name, email: this.email, subject: this.subject, message: this.message}, reCaptchaToken)
            .then(() => {
              this.loading = false
              this.$refs.registerForm.reset();
              this.$fire({
                title: 'Thank you for getting in touch!',
                text: "We appreciate you contacting us. Someone from our team will get back in touch with you soon! Have a great day. ",
                type: "success",
                timer: 5000
              })
            })
            .catch(() => {
              this.loading = false
              this.$fire({
                title: "Oops! Something went wrong.",
                text: "Please try again later",
                type: 'error',
                timer: 5000
              });
            })
      }
    }
  }
}
</script>

<style scoped>
.textCard {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 1rem;
}

.wave {
  position: fixed;
  bottom: 0;
  height: 50%;
  width: 100%;

}


</style>