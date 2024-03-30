<template>
  <div>
    <LegalPage class="legal" v-if="windowSize.width>750" :legalData="legalData" :tab-map="tabMap"/>
    <LegalPageMobile class="legal" v-else :legalData="legalData" :tab-map="tabMap"/>
  </div>

</template>
<script>

import LegalPage from "@/components/LegalComponents/LegalPage";
import LegalPageMobile from "@/components/LegalComponents/LegalPageMobile";
import termsOfService from "@/assets/legal/terms-of-service.md";
import communityGuidelines from "@/assets/legal/community-guidelines.md";
import privacyPolicy from "@/assets/legal/privacy-policy.md";

export default {
  name: "LegalView",
  components: {LegalPageMobile, LegalPage},
  mounted() {
    this.onResize()
    window.addEventListener('resize', this.onResize);

  },
  data: () => {
    return {
      windowSize: {
        width: 0,
        height: 0
      },
      tabMap: {
        'terms-of-service': 0,
        'privacy-policy': 1,
        'community-guidelines': 2
      },
      legalData: [
        {
          key: 'terms-of-service',
          title: "Terms Of Service",
          content: termsOfService,
        },
        {
          key: 'privacy-policy',
          title: "Privacy Policy",
          content: privacyPolicy,
        },
        {
          key: 'community-guidelines',
          title: "Community Guidelines",
          content: communityGuidelines,
        },
      ]
    }
  },
  methods: {
    onResize() {
      this.windowSize = {width: window.innerWidth, height: window.innerHeight}
    },
  }

}
</script>
<style >
.legal{
  font-family: "Times New Roman", sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
table { border-collapse: collapse; }
td{ border: solid 1px black; padding: 1rem }
tr { border: solid 1px black; }
tr:nth-child(even) {background-color: #f2f2f2;}
</style>