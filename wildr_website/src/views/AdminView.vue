<template>
  <v-container>
    <LoginButton v-if="!isLoggedIn"/>
    <AdminPortal v-else/>
  </v-container>

</template>

<script>
import LoginButton from "@/components/AdminComponents/LoginButton";
import {EventBus} from "@/store/EventBus";
import AdminPortal from "@/components/AdminComponents/AdminPortal";

export default {
  name: "AdminView",
  components: {AdminPortal, LoginButton},
  data: () => ({
    isLoggedIn: false
  }),
  created() {
    EventBus.$on("checkLoginStatus", () => {
      this.isLoggedIn = this.$store.getters.isAuthenticated;
    });
  },
  mounted() {
    EventBus.$emit('checkLoginStatus')
  }

}
</script>

<style scoped>

</style>