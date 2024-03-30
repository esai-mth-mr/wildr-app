<template>
  <div>
    <div style="color: black">
      <ThumbnailPostGrid :posts="posts"/>
    </div>
    <v-btn text v-on:click="nextSet" v-text="'Load More'"/>
  </div>
</template>

<script>
import ThumbnailPostGrid from "@/components/post/ThumbnailPostGrid";
import {getPost} from "@/api/PostApi";
import {EventBus} from "@/store/EventBus";

export default {
  name: "PostPage",
  components: {ThumbnailPostGrid},
  data: () => ({
    posts: [],
  }),
  created() {
    EventBus.$on("updateTakeDownState", (data) => {
      this.posts[this.posts.findIndex(e=>e.id===data.id)].state = data.state
      this.posts[this.posts.findIndex(e=>e.id===data.id)].sensitiveStatus = data.sensitiveStatus?true:null
    });
  },
  mounted() {
    this.getFirstPostData()
  },
  methods: {
    async getFirstPostData() {
      const r = (await getPost(new Date().toISOString(), 10, true)).data
      if (r.status === "OK") {
        this.posts = r.data;
      } else {
        this.$notify({
          title: "Error",
          type: "error"
        });
      }
    },
    async nextSet() {
      const r = (await getPost(this.posts[this.posts.length - 1].createdAt, 10, true)).data
      if (r.status === "OK") {
        const data = r.data
        if (data.length > 0) {
          this.posts = this.posts.concat(data)
        } else {
          this.$notify({
            title: "Error",
            text: "No more posts",
            type: "error"
          });
        }
      } else {
        this.$notify({
          title: "Error",
          type: "error"
        });
      }

    },

  }
}
</script>

<style scoped>

</style>