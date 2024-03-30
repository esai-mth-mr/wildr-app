<template>
  <div style="display: flex; flex-wrap: wrap; justify-content: center; align-content: center;">
    <div v-for="(i, index) in posts" :key="index" style="border: 1px solid black;">
      <div>
        <v-dialog
            v-model="dialogs[index]"
            width="600px"
        >
          <template v-slot:activator="{ on, attrs }">
            <div v-bind="attrs"
                 v-on="on">
              <ThumbnailPost :post="i"/>
            </div>

          </template>
          <v-card>
            <CaptionStr v-if="i.caption" :caption="i.caption"/>
            <MultiPost :post="i"/>
          </v-card>
        </v-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import MultiPost from "@/components/post/MultiPost";
import ThumbnailPost from "@/components/post/ThumbnailPost";
import CaptionStr from "@/components/post/CaptionStr";

export default {
  name: "ThumbnailPostGrid",
  components: {CaptionStr, ThumbnailPost, MultiPost},
  props: {
    posts: Array
  },
  data: () => ({
    dialogs: [],
    key: 0
  }),
  mounted() {
    this.posts.forEach(() => this.dialogs.push(false))
    this.posts.forEach(() => this.comments.push(null))
  },
  methods: {
  }
}
</script>

<style scoped>

</style>