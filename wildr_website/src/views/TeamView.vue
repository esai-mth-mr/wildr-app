<template>
  <TeamPage v-if="windowSize.width>=1200" :teamData="teamData"/>
  <TeamPageMobile v-else :teamData="teamData"/>
</template>
<script>
import TeamPage from "@/components/TeamComponents/TeamPage";
import TeamPageMobile from "@/components/TeamComponents/TeamPageMobile";
export default {
  name: "TeamView",
  components: {TeamPageMobile, TeamPage},
  mounted() {
    this.onResize()
    window.addEventListener('resize', this.onResize);
  },
  data:()=> {
    return {
      windowSize: {
        width: 0,
        height: 0
      },
      teamData: [
        {
          name: 'Om Swami',
          title: 'Founder',
          image: require('../assets/TeamImages/Swamiji.jpg'),
          description: "Serial Entrepreneur - sold his last profitable company to the multi-billion-dollar Future Group. Om Swami is an advanced Meditator, Monk and bestselling author of 15+ books. He is the founder of Os.me, blacklotus.app and sadhana.app. His previous experience includes Barclays, Deloitte, News Corp, Westfield, University of Technology, Sydney and UWS.",
          links: [{link: "https://en.wikipedia.org/wiki/Om_Swami", icon: "fab fa-wikipedia-w"}, {link: "https://omswami.com/", icon: "fas fa-globe"}]
        },
        {
          name: 'Melissa Ravi',
          title: 'CEO, Co-Founder',
          image: require('../assets/TeamImages/Melissa.jpg'),
          description: 'Marketing leader with deep expertise in building growth marketing programs from zero to one and beyond. Melissa is passionate about utilizing her extensive payments and marketing background to develop a more real and kinder online space for everyone. Her previous experience includes PayPal, Visa, Deutsche Bank, Brandeis University and Singapore Management University.',
          links: [{link: 'https://www.linkedin.com/in/melissa-ravi-88a6b221/', icon: 'fab fa-linkedin'}]
        },
        {
          name: 'Vidit Drolia',
          title: 'CTO, Co-Founder',
          image:  require('../assets/TeamImages/Vidit.jpg'),
          description: 'Engineering leader at Robinhood with extensive technical expertise building products from zero to one and scaling to millions of users. Vidit believes in using technology to change the world for the better. His previous experience includes Google, Microsoft, Yahoo, Carnegie Mellon University and Singapore Management University.',
          links: [{link: 'https://www.linkedin.com/in/vidit-drolia/', icon: 'fab fa-linkedin'}]
        }
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
</style>