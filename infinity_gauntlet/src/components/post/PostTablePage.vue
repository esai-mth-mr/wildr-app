<template>
  <div>
    <div style="padding-right: 2rem">
      <v-row class="justify-end">
        <v-switch v-model="editMode" label="Edit Mode" color="#50B359"/>
      </v-row>
      <v-row class="justify-end">
        <div>Green column headers are editable</div>
      </v-row>
    </div>
    <div style="padding: 2rem">
      <v-btn v-on:click="nextSet" v-text="'Next'"/>
      <DBTable :items="postData" :headers="items" :jsonKeys="jsonKeys" :editMode="editMode" :canUpdate="canUpdate"
               @update="updateData"/>
      <v-btn v-on:click="nextSet" v-text="'Next'"/>
    </div>
  </div>
</template>

<script>
import DBTable from "@/components/common/DBTable";
import {getPost, updatePost} from "@/api/PostApi";

export default {
  name: "PostPage",
  components: {DBTable},
  mounted() {
    this.getFirstPostData()
  },
  data: () => ({
    postData: [],
    items: [],
    editMode: false,
    jsonKeys: ['multiPostProperties', '_stats', 'properties', 'activityData', 'caption'],
    canUpdate: ['multiPostProperties', '_stats', 'properties', 'activityData', 'caption', 'isPrivate', 'wasBypassed', 'willBeDeleted']
  }),
  methods: {
    async getFirstPostData() {
      const r = (await getPost(new Date().toISOString(), 10, false)).data
      if (r.status === "OK") {
        await this.parsePost(r.data)
      } else {
        this.$notify({
          title: "Error",
          type: "error"
        });
      }
    },
    async nextSet() {
      const r = (await getPost(this.postData[this.postData.length - 1].createdAt, 10, false)).data
      if (r.status === "OK") {
        const data = r.data
        if (data.length > 0) {
          await this.parsePost(data)
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
    async parsePost(postData) {
      this.items = Object.keys(postData[0]).map(e => {
        return {
          text: e.replace(/([A-Z])/g, (match) => ` ${match}`)
              .replace(/^./, (match) => match.toUpperCase())
              .trim(),
          sortable: false,
          value: e,
          class: this.canUpdate.includes(e) ? 'green lighten-5' : null
        }
      })
      for (let i = 0; i < this.jsonKeys.length; i++) {
        for (let j = 0; j < postData.length; j++) {
          postData[j][this.jsonKeys[i]] = JSON.stringify(postData[j][this.jsonKeys[i]])
        }
      }
      this.postData = postData
    },
    async updateData(key, id, data) {
      let value;
      try {
        value = this.jsonKeys.includes(key) ? JSON.parse(data) : data
      } catch (e) {
        this.$notify({
          title: "Error",
          text: e,
          type: "error"
        });
        return;
      }
      const response = (await updatePost(id, {[key]: value})).response
      if (response.status === "OK") {
        this.$notify({
          title: "Success",
          text: "updated " + key + " on post id:" + id,
          type: "success"
        });
      } else {
        this.$notify({
          title: "Error",
          text: "Error updating ",
          type: "error"
        });
      }
    }
  }
}
</script>

<style scoped>

</style>