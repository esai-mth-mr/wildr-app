<template>
  <v-container fluid fill-height class="landingPage">
    <v-row class="justify-center ">
      <v-col cols="12" sm="4" xl="4">
        <v-container>

          <div :style="'height='+(windowSize.height/1.6)+'; width:'+(windowSize.width/3)+'; border-radius: 100px' ">
            <video muted autoplay loop :height="windowSize.height/1.6" :width="windowSize.width/4"
                   style="object-fit:scale-down; padding: 13px 20px 13px 20px">
              <source :src="video" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>
        </v-container>
      </v-col>

      <v-col cols="12" sm="2" md="5" xl="4" class="cardStyle">
        <v-container>
          <h1 style="font-size: 4rem; line-height: 1; letter-spacing: -2px; color:#00B64C">
            The world’s first toxicity-free social network
          </h1>
        </v-container>
        <v-container>
          <p style="font-size: 1.5rem; line-height: 1.3; justify-content: center; color: rgba(0, 0, 0, 0.6);">
            Live like nobody’s watching. Your wildest moments should be celebrated, not hated.
          </p>
          <p style="font-size: 1rem; line-height: 1.3; justify-content: center; color: gray;">
            Monetization features coming soon! 🎉
          </p>
        </v-container>
        <v-container>
          <h2 style="color: #292934">Get wild on the app</h2>
        </v-container>
        <v-container >
          <v-row class="justify-center align-center align-content-center">
            <div>
              <a href="https://play.google.com/store/apps/details?id=com.wildr.app">
                <v-img src="@/assets/LandingPage/google-play-badge.svg" contain width="175" max-height="50"/>
              </a>
            </div>

            <div style="padding: 1rem"/>
            <div>
              <a href="https://apps.apple.com/us/app/wildr/id1604130204">
                <v-img src="@/assets/LandingPage/App_Store_Badge.svg" contain width="175" max-height="50"/>
              </a>
            </div>


          </v-row>
        </v-container>

      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import {SendEmail} from "@/api/Email";

export default {
  name: "LandingPage",
  props: {windowSize: Object, video: Object},
  data: () => {
    return {
      email: '',
      loading: false,
    }
  },
  methods: {
    async sendEmail() {
      this.loading = true
      await this.$recaptchaLoaded()
      const reCaptchaToken = await this.$recaptcha('login')
      if (/.+@.+\..+/.test(this.email)) {
        SendEmail(this.email, reCaptchaToken)
            .then(r => {
              this.loading = false
              if (r.isSuccessful) {
                this.email = '';
                this.$fire({
                  title: "Thank you for joining the waitlist.",
                  text: "We’ll send you an invite code once it’s your turn.",
                  type: "success",
                  timer: 5000
                })
              } else {
                this.$fire({
                  title: "Error",
                  text: r.message,
                  type: "error",
                  timer: 5000
                })
              }
            })
            .catch(error => {
              this.loading = false
              this.$fire({
                title: "Error",
                text: error.message,
                type: "error",
                timer: 5000
              })

            })
      } else {
        this.loading = false
        await this.$fire({
          title: "Error",
          text: 'Please enter a valid email',
          type: "error",
          timer: 5000
        })
      }
    }
  }
}
</script>

<style scoped>

.landingPage {
  height: 90vh;
  width: 100%;
  background-color: white;
}

video {
  border-radius: 70px;
  overflow: hidden;
}

.cardStyle {
  text-align: center;
  display: flex;
  align-content: center;
  justify-content: center;
  flex-wrap: wrap;
  align-items: stretch;
}

.v-card__text, .v-card__title {
  word-break: normal !important;
}

</style>