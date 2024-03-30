<template>
  <div>
    <vue-scroll-snap :fullscreen="true">
      <v-row style="padding-top: 2rem" class="justify-center">
        <v-col cols="12" md="4" v-for="(i, index) in teamData" :key="index">
          <div class="item">

            <TeamCard :image="i.image" :title="i.title" :name="i.name" :description="i.description" :links="i.links"/>

          </div>
        </v-col>
      </v-row>
    </vue-scroll-snap>
  </div>
</template>

<script>
import TeamCard from "@/components/TeamComponents/TeamCard";
import VueScrollSnap from "vue-scroll-snap";
export default {
  name: "TeamPageMobile",
  components: {TeamCard, VueScrollSnap},
  props: {teamData: Array}
}
</script>

<style>


.item {
  padding-left: 1rem;
  padding-right: 1rem;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>