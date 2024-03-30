<template>
  <div>
    <vue-scroll-snap :fullscreen="true" id="scrollSnap">
      <div class="item"
           style=" align-content: center; display: flex; justify-content: center; flex-direction: column; text-align: center;">
        <div>
          <h1>
            The world’s first
          </h1>
          <h1>
            toxicity-free
          </h1>
          <h1>
            social network</h1>
        </div>
        <div style="padding: 1rem"/>
        <p style="font-size: 1.5rem; line-height: 1.3; color: rgba(0, 0, 0, 0.6);">Live like nobody’s watching. Your
          wildest moments should be celebrated, not hated.</p>
        <p style="font-size: 1rem; line-height: 1.3; color: rgba(0, 0, 0, 0.6);">
          Monetization features coming soon! 🎉
        </p>
      </div>
      <div class="item" style="position: relative;">
        <div class="center" style="">
          <v-card :height="windowSize.height-100" :width="windowSize.width" color="transparent" elevation="0">
            <div class="iPhoneScreens">
              <video playsinline muted autoplay loop :height="windowSize.height-100" :width="windowSize.width"
                     style="object-fit:scale-down; padding:12px 15px 12px 15px ">
                <source :src="video" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            </div>
          </v-card>

        </div>
      </div>
      <div class="item" id="invite">
        <div style="display: flex; flex-direction: column; text-align: center;">
          <h2 style="color: #292934">Get wild on the app</h2>
          <div style="padding: .5rem"/>
          <v-container >
            <v-row class="justify-center align-center align-content-center">
              <div>
                <a href="https://wildr.com/invite/website">
                  <v-img src="@/assets/LandingPage/google-play-badge.svg" contain  width="135" height="40" />
                </a>
              </div>
              <div style="padding: 1rem"/>
              <div>
                <a href="https://wildr.com/invite/website">
                  <v-img src="@/assets/LandingPage/App_Store_Badge.svg" contain  width="135" max-height="40"/>
                </a>
              </div>
            </v-row>
          </v-container>
        </div>
      </div>


    </vue-scroll-snap>
  </div>
</template>

<script>
import {SendEmail} from "@/api/Email";
import VueScrollSnap from "vue-scroll-snap";

export default {
  name: "LandingPageMobile",
  components: {VueScrollSnap},
  props: {windowSize: Object, video: String},

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
      if (/.+@.+\..+/.test(this.email))
        SendEmail(this.email, reCaptchaToken).then(r => {
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

      else {
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

<style>

.item {
  width: 100%;
  height: 100%;
  display: flex;
  padding-left: 1rem;
  padding-right: 1rem;
  justify-content: center;
  align-items: center;
}

.scroll-snap-container {
  height: 100vh;
}

video {
  border-radius: 50px;
  overflow: hidden;
}

.v-card__text, .v-card__title {
  word-break: normal !important;
}

h1 {
  font-size: 3.0rem;
  line-height: 1;
  letter-spacing: -2px;
  color: #00B64C;
  text-align: center;
}

</style>