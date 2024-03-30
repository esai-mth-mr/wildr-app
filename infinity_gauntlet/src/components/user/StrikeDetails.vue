<template>
  <div v-if=" user.strikeData" style="border: 2px solid black; margin: 1rem; padding: 2rem; ">
    <div>
      <b><u>Strike Details</u></b>
    </div>
    <div><b><u>Current Strike Count: </u></b>{{ user.strikeData.currentStrikeCount }}</div>
    <v-container style="padding: 2rem">
      <v-row class="justify-center align-center">
        <div class="d-flex justify-center"
             v-for="i in ['first', 'second', 'third']" :key="i"
        >

          <v-card style="margin: 2rem">
            <v-card-title>
              {{ i }} strike
            </v-card-title>
            <v-card-text>
              <div><b><u>Count:</u></b> {{ user.strikeData[i + 'StrikeCount'] }}</div>
              <div v-if="user.strikeData[i + 'StrikeExpiryTS']">Expiry:
                {{ new Date(user.strikeData[i + 'StrikeExpiryTS']).toDateString() }}
              </div>
              <div v-else>No Expiry</div>
            </v-card-text>
          </v-card>
        </div>
      </v-row>
    </v-container>


  </div>
  <div v-else>
    No previous strikes
  </div>
</template>

<script>
export default {
  name: "StrikeDetails",
  props: {
    user: Object
  }
}
</script>

<style scoped>

</style>