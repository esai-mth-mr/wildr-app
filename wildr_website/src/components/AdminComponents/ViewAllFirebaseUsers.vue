<template>
  <v-container>
    <div  style="text-align: center; font-size: 2rem; font-weight: bold">Sorted by last logged in</div>
    <v-row class="justify-center align-center">
      <v-col class="d-flex justify-center"
             cols="12" sm="3" md="3" lg="4" xl="4"
             v-for="(i, index) in users"
             :key="index">
        <v-card>
          <v-card-title>{{ i.phoneNumber ? i.phoneNumber : i.email }}</v-card-title>
          <v-card-subtitle>uid: {{ i.uid }}</v-card-subtitle>
          <v-card-text>email verified: {{ i.emailVerified }}</v-card-text>
          <v-card-text>Creation: {{ new Date(i.metadata.creationTime).toLocaleDateString() }}
            {{ new Date(i.metadata.creationTime).toLocaleTimeString() }}
          </v-card-text>
          <v-card-text>Last logged in: {{ new Date(i.metadata.lastSignInTime).toLocaleDateString() }}
            {{ new Date(i.metadata.lastSignInTime).toLocaleTimeString() }}
          </v-card-text>
          <div style="display: flex; flex-direction: row; justify-content: center">
            <div v-for="(j, jIndex) in i.providerData.map(r=>r.providerId)" :key="jIndex">
              <v-icon v-if="j === 'google.com'">
                mdi-google
              </v-icon>
              <v-icon v-if="j === 'apple.com'">
                mdi-apple
              </v-icon>
              <v-icon v-if="j === 'phone'">
                mdi-phone
              </v-icon>
              <v-icon v-if="j === 'password'">
                mdi-email
              </v-icon>
            </div>
          </div>
          <v-card-actions class="justify-center">name: {{ i.displayName ? i.displayName : "NO DISPLAY NAME" }}
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: "ViewAllFirebaseUsers",
  props: {
    users: Array
  }
}
</script>

<style scoped>

</style>