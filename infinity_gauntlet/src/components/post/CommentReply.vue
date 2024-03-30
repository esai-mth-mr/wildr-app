<template>
  <v-container>
    <v-btn v-if="comments==null" :key="key" v-on:click="getCommentsReplies()">
      Request Comments
    </v-btn>
    <div>
      <v-expansion-panels focusable>
        <v-expansion-panel
            v-for="(j, jIndex) in comments"
            :key="jIndex"
        >
          <v-expansion-panel-header>
            <div :style="'color: '+ (j.negativeConfidenceValue?'red':'')+';'">
              <v-row>
                <v-avatar v-if="j.author.avatar">
                  <v-img :src="j.author.avatar"/>
                </v-avatar>
                <div style="padding: 1rem"/>
                <div>@{{ j.author.handle }}</div>
                <div style="padding: 1rem"/>
                <div>{{ j.comment }}</div>
                <div v-if="j.negativeConfidenceValue!=null">{{ j.negativeConfidenceValue }}</div>
                <div v-if="j.state" style="color:indianred">
                  TAKEN DOWN
                </div>
              </v-row>
            </div>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-row v-for="(k, kIndex) in j.replies" :key="kIndex">
              <div style="padding: 2rem"/>
              <v-avatar v-if="k.author.avatar">
                <v-img :src="k.author.avatar"/>
              </v-avatar>
              <div style="padding: 1rem"/>
              <div>@{{ k.author.handle }}</div>
              <div style="padding: 1rem"/>
              <div>{{ k.reply }}</div>
              <div v-if="k.state " style="color:indianred">
                TAKEN DOWN
              </div>
            </v-row>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

  </v-container>
</template>

<script>
import {getCommentReplies} from "@/api/CommentReplyApi";

export default {
  name: "CommentReply",
  props: {
    post: Object
  },
  data: () => ({
    comments: null,
    key: 0
  }),
  methods: {
    async getCommentsReplies() {
      const r = (await getCommentReplies(this.post.commentFeedId)).data
      if (r.status === "OK") {
        this.comments = this.parseCommentsReply(r.data);
        this.key++;
      } else {
        this.$notify({
          title: "Error",
          type: "error"
        });
      }
    },
    parseCommentsReply(commentReply) {
      return commentReply.map(e => {
        return {
          author: {
            handle: e.comment.author.handle,
            avatar: e.comment.author.avatarImage,
            score: e.comment.author.score,
          },
          comment: e.comment.content.segments.map(i => i.segment.chunk).join().trim(),

          replies: e.replies.map(i => {
            return {
              author: {
                handle: i.author.handle,
                avatar: i.author.avatarImage,
                score: i.author.score,
              },
              reply: i.content.segments.map(j => j.segment.chunk).join().trim()
            }
          })
        }
      })
    }
  }
}
</script>

<style scoped>

</style>