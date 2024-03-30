<template>
  <v-container>
    <div  style="text-align: center; font-size: 2rem; font-weight: bold">Sorted by feedback recorded</div>
    <v-row class="justify-center align-center">
      <v-col class="d-flex justify-center"
             cols="12" sm="3" md="3" lg="4" xl="4"
             v-for="(i, index) in feedbacks"
             :key="index">
        <v-card>
          <v-card-title>{{ i.email ? i.email : "Anonymous" }}</v-card-title>
          <v-card-subtitle v-if="i.displayName">Name: {{ i.displayName }}</v-card-subtitle>
          <v-card-subtitle v-if="i.uid">uid: {{ i.uid }}</v-card-subtitle>
          <v-card-text>{{ i.message}}</v-card-text>
          <v-card-text>{{ new Date(i.time).toLocaleDateString() }} {{ new Date(i.time).toLocaleTimeString() }}
          </v-card-text>
          <v-card-actions class="justify-center" v-if="i.name">name: {{ i.name }}
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "ViewAllFeedback",
  props: {
    feedbacks: Array
  }
}
</script>

<style scoped>

</style>