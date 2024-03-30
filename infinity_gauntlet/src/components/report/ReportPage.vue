<template>
  <div style="padding: 2rem">
    <div v-if="reportData.length!==0">
      <v-pagination
          v-model="currentIndex"
          :length="reportData.length"
          circle
      />
      <ReportCard
          :id="reportData[currentIndex-1].reviewEntity.id"
          :reportData="reportData[currentIndex-1].reviewEntity"
          :objectType="reportData[currentIndex-1].objectType"
          :objectData="reportData[currentIndex-1].object"
          :user="reportData[currentIndex-1].user"
          :post="post"
          @update="updateReport"
          :key="currentIndex"
      />
      <v-pagination
          v-model="currentIndex"
          :length="reportData.length"
          circle
      />
    </div>
    <div v-else>
      <h1>No new reports</h1>
    </div>


  </div>

</template>

<script>

import {getReports} from "@/api/ReportApi";
import ReportCard from "@/components/report/ReportCard";
import {getPostFromCommentReply} from "@/api/CommentReplyApi";

export default {
  name: "ReportPage",
  components: {ReportCard},
  mounted() {
    this.getFirstReportData()
  },
  data: () => ({
    reportData: [],
    items: [],
    currentIndex: 1,
    post: null,
  }),
  watch:{
    currentIndex(){
      this.post = null
    }
  },
  methods: {
    async getFirstReportData() {
      const reportData = (await getReports(new Date().toISOString(), 100)).data
      if(reportData.status ==="OK"){
        if(reportData.data.length!==0){
          this.reportData = reportData.data
          this.post = await this.getPost()
        }
      }else{
        this.$notify({
          title: "Error",
          type: "error"
        });
      }
    },
    updateReport(){
      this.reportData.splice(this.currentIndex-1, 1)
    },
    async getPost(){
      const objectType = this.reportData[this.currentIndex-1].objectType;
      if(objectType ==='COMMENT'||objectType ==='REPLY'){
        const response = (await getPostFromCommentReply(objectType, this.reportData[this.currentIndex-1].object.id)).data
        if(response.status==='OK'){
          this.post = response.data
        }
      }
    }
  }
}
</script>

<style scoped>

</style>