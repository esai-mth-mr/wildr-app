<template>
  <div>
    <v-app-bar v-if="!isMobile()">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"/>
      <img :src="require('@/assets/fulllogo.png')" height="100" width="100" alt="logo" style="object-fit: contain;">
    </v-app-bar>
    <v-navigation-drawer
        v-model="drawer"
        absolute
        temporary
    >
      <v-list
          nav
          dense
      >
        <v-list-item-group v-model="group">
          <v-list-item v-for="(i, index) in legalData" :key="index">
            <v-list-item-title>{{ i.title }}</v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
    <div v-html="markdownToHtml(legalData[group].content)"
         style="padding-left: 2rem; padding-right: 2rem; padding-top: 1rem;"/>
  </div>
</template>

<script>

import {marked} from "marked";

export default {
  name: "LegalPageMobile",
  mounted() {
    this.group = this.tabMap[this.$router.currentRoute.params.doc];

  },
  props: {
    legalData: Array,
    tabMap: Object
  },
  watch: {
    group(index) {
      this.drawer = false
      this.onTabChange(this.legalData[index].key)
    },
  },
  data: () => ({
    drawer: false,
    group: null,
  }),
  methods: {
    markdownToHtml(data) {
      return marked(data);
    },
    onTabChange(doc) {
      let isMobile = this.isMobile();
      isMobile ?
          this.$router.replace({params: {doc}, query: {mobile: isMobile.toString()}})
          : this.$router.replace({params: {doc}})

    },
    isMobile() {
      return this.$router.currentRoute.query.mobile === 'true'
    }
  }
}
</script>

<style scoped>

</style>