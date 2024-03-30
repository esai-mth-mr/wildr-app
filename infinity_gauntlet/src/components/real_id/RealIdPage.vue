<template>
  <div>
    <RealIdCard v-if="!completed" @next="next" :user="currentUser" :key="currentIndex"/>
    <h1 v-else>Your all done!</h1>

  </div>
</template>

<script>
import {getRealIdManualReview} from "@/api/RealIdApi";
import RealIdCard from "@/components/real_id/RealIdCard";

export default {
  name: "RealIdPage",
  components: {RealIdCard},
  async mounted() {
    this.realIdData = (await getRealIdManualReview()).data.users
    if(this.realIdData.length===0){
      this.completed=true;
    }
    else this.currentUser = this.realIdData[this.currentIndex]
  },
  data: () => ({
    realIdData: [],
    currentIndex: 0,
    currentUser: {},
    completed: false,
  }),
  methods:{
    next(){
      if(this.realIdData.length-1===this.currentIndex){
        this.completed=true
      }
      else this.currentUser = this.realIdData[++this.currentIndex]
    }
  }
}
</script>

<style scoped>

</style>