<template>
  <v-container class="team">
       <v-row style="padding-top: 2rem" class="justify-center ma-2">
      <v-col    v-for="(i, index) in teamData" :key="index">
        <TeamCard :image="i.image" :title="i.title" :name="i.name" :description="i.description" :links="i.links"/>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import TeamCard from "@/components/TeamComponents/TeamCard";

export default {
  name: "TeamPage",
  components: {TeamCard},
  props: {teamData: Array},
}
</script>

<style scoped>
.team {
  height: 100%;
  background-color: white;
}
</style>