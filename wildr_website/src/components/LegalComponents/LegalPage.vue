<template>
  <div>
    <v-app-bar color="white">
      <img :src="require('@/assets/fulllogo.png')" height="100" width="100" alt="logo" style="object-fit: contain;">
    </v-app-bar>
    <v-container class="fill-height container--fluid">
      <v-card style="padding: 1rem;">
        <v-tabs color="#00B64C" vertical v-model="currentTab">
          <v-tab v-for="(i, index) in legalData" :key="index" v-on:click="onTabChange(i.key)"
                 style="display: flex;justify-content: start;">
            <div>{{ i.title }}</div>
          </v-tab>
          <v-tab-item v-for="(i, index) in legalData" :key="index">
            <v-card flat>

              <div v-html="markdownToHtml(i.content)" style="padding-left: 2rem; padding-right: 2rem;"/>
            </v-card>
          </v-tab-item>
        </v-tabs>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import {marked} from "marked"
export default {
  name: "LegalPage",
  mounted() {
    this.currentTab = this.tabMap[this.$router.currentRoute.params.doc];
    if(document.location.hash) {
      setTimeout(()=> {
        console.log( )
        document
            .getElementById(document.location.hash.substring(1))
            .scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }

  },
  props:{
    legalData: Array,
    tabMap: Object,
  },
  data: () => ({
    currentTab: 2,
  }),
  methods: {
    markdownToHtml(data) {
      return marked(data);
    },
    onTabChange(doc) {
      this.$router.replace({params: {doc}})
    }
  }
}
</script>

<style >

</style>