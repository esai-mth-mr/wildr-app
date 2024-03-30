<template>
  <div>
    <div v-if="post.state" style="color:indianred">
      TAKEN DOWN
    </div>
    <h3 v-if="post.wasBypassed" style="color: red">Toxic Bypassed</h3>
    <h3 v-if="post.multiPostProperties.length>1" style="color: green">Multi post</h3>
    <div v-if="post.multiPostProperties[0].type==='TextPostProperties'"
         style=" overflow-y: scroll; height: 250px; width: 150px; display: flex; justify-content: center;">
      {{ post.multiPostProperties[0].bodyStr }}
    </div>
    <div v-else-if="post.multiPostProperties[0].type==='ImagePostProperties'">
      <v-img height="250" width="150" contain :src="post.multiPostProperties[0].imageFile.path"/>
    </div>
    <div v-else-if="post.multiPostProperties[0].type==='VideoPostProperties'">

      <video height="250" width="150" controls>
        <source :src="post.multiPostProperties[0].videoFile.path" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
  </div>
</template>

<script>


export default {
  name: "ThumbnailPost",
  props:{
    post: Object
  },

}
</script>

<style scoped>

</style>