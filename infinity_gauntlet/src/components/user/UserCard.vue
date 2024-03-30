<template>
  <v-card class="justify-center align-center align-content-center" width="800">
    <div v-if="user.isSuspended" style="color:indianred">
      Suspended
    </div>
    <UserActionsDialog :user="user"/>
    <v-card-title>@{{ user.handle }}</v-card-title>
    <v-card-title>{{ user.email ? user.email : user.phoneNumber }}</v-card-title>
    <v-card-title v-if="user.name">Name: {{ user.name }}</v-card-title>
    <v-card-subtitle>uid: {{user.id}}</v-card-subtitle>
    <v-card-subtitle>{{ new Date(user.createdAt).toDateString() }} {{ new Date(user.createdAt).toLocaleTimeString() }}
    </v-card-subtitle>
    <div :style="'color:' + getColor()">Score: {{ user.score }}</div>
    <v-card-text>Real Id Status: {{ getRealIdStatus() }}</v-card-text>
    <v-card-text>
      <v-row class="justify-center">
        <div v-if="user.avatarImage">
          <div>Profile Photo</div>
          <v-avatar size="100">
            <v-img :src="user.avatarImage"/>
          </v-avatar>
        </div>
        <div style="padding: 1rem"/>
        <div v-if="user.realIdVerificationStatus === 3">
          <div>Real Id Photo</div>
          <v-avatar size="100">
            <v-img :src="user.realIdFaceUrl"/>
          </v-avatar>
        </div>
      </v-row>
    </v-card-text>
    <v-card-text v-if="user.pronoun"> Pronoun: {{ user.pronoun }}</v-card-text>
    <v-card-text v-if="user.bio"> bio: {{ user.bio }}</v-card-text>
    <v-card-text>
      <StrikeDetails :user="user"/>
    </v-card-text>
    <ThumbnailPostGrid :posts="posts"/>
  </v-card>
</template>

<script>
import StrikeDetails from "@/components/user/StrikeDetails";
import {getProfileColor, getRealIdVerificationStatus} from "@/components/user/UserCommons";
import {getUserFeed} from "@/api/FeedApi";
import ThumbnailPostGrid from "@/components/post/ThumbnailPostGrid";
import UserActionsDialog from "@/components/user/UserActionsDialog";

export default {
  name: "UserCard",
  components: {UserActionsDialog, ThumbnailPostGrid, StrikeDetails},
  props: {
    user: Object
  },
  data: () => ({
    posts: [],
  }),
  mounted() {
    this.getPosts()
  },
  methods: {
    async getPosts() {
      this.posts = (await getUserFeed(this.user.id)).data.data
    },
    getRealIdStatus() {
      return getRealIdVerificationStatus(this.user.realIdVerificationStatus);
    },
    getColor() {
      return getProfileColor(this.user.score)
    }
  }
}
</script>

<style scoped>

</style>