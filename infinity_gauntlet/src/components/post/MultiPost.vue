<template>
  <div>
    <div v-if="post.captionNegativeConfidenceValue" style="color:indianred">
      Caption Troll Detected
    </div>
    <PostActionsDialog :post="post"/>
    <div v-if="post.state" style="color:indianred">
      TAKEN DOWN
    </div>
    <div v-if="post.accessControl">
      <div v-if="post.accessControl.postVisibilityAccessData.access === 4" style="color: orangered">
        Inner circle post
      </div>
    </div>
    <div v-if="post.sensitiveStatus !== null" style="color:indianred">
      Sensitive
    </div>
    <div >
      id: {{post.id}}
    </div>
    <div style="font-weight: bold" v-if="showUser">
      User: @{{user.handle}}
    </div>
    <v-row style="padding-top: 2rem" class="justify-center">
      <div v-for="(i, index) in post.multiPostProperties" :key="index"
           style="border: 5px solid black; margin: 1rem; padding: 1rem">
        <div v-if="i.negativeConfidenceValue" style="color:indianred">
          Troll Detected on Post
        </div>
        <div v-if="i.type==='TextPostProperties'" style="height: 250px; width: 150px; overflow-y: scroll; padding: 0">
          <h3>Text Post {{ index + 1 }}/{{ post.multiPostProperties.length }}</h3>
          {{ i.bodyStr }}
        </div>
        <div v-else-if="i.type==='ImagePostProperties'">
          <h3>Image Post {{ index + 1 }}/{{ post.multiPostProperties.length }}</h3>
          <v-img height="250" width="150" contain :src="i.imageFile.path"/>
        </div>
        <div v-else-if="i.type==='VideoPostProperties'">
          <h3>Video Post {{ index + 1 }}/{{ post.multiPostProperties.length }}</h3>
          <video height="250" controls>
            <source :src="i.videoFile.path" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </v-row>
    <CommentReply :post="post"/>
  </div>

</template>

<script>
import PostActionsDialog from "@/components/post/PostActionsDialog";
import CommentReply from "@/components/post/CommentReply";
import {getUser} from "@/api/UserApi";

export default {
  name: "MultiPost",
  components: {CommentReply, PostActionsDialog},
  props: {
    post: Object,
    showUser: {
      default: false,
      type: Boolean
    }
  },
  data: () => ({
    user: {}
  }),
  mounted() {
    if(this.showUser)
    this.getUserFromPost()
  },
  methods:{
    async getUserFromPost(){
      this.user = (await getUser(this.post.authorId)).data.data
      console.log(this.user)
    }
  }

}
</script>

<style scoped>

</style>