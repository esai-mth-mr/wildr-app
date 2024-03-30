<template>
  <div class="center">
    <div style="font-weight: bolder; font-size: 5rem; text-align: center">
      {{ emails.length }} unique emails!
    </div>
    <div class="scroll">
      <div class="box">
        <v-row    v-for="(i, index) in emails" :key="index" class="  item">
          <v-checkbox color="green" v-model="selectedEmails" :label="i" :value="i"/>
        </v-row>

      </div>
    </div>
    <v-progress-circular
        v-if="isLoading"
        :size="70"
        :width="7"
        color="green"
        indeterminate
    ></v-progress-circular>
    <div v-else style="padding-top: 1rem">
      <v-btn color="green" :disabled="selectedEmails.length===0" rounded v-text="'Send'" v-on:click="send"/>
    </div>

  </div>
</template>

<script>
import {SendInviteCodeEmails} from "@/api/admin/AdminApi";

export default {
  name: "ViewAllEmails",
  props: {
    emails: Array,
  },
  data: () => ({
    selectedEmails: [],
    isLoading: false,
  }),
  methods:{
    send(){
      this.isLoading = true;
      SendInviteCodeEmails(this.selectedEmails)
          .then(r => {
            this.isLoading = false;
            this.$notify({
              group: 'web',
              type: 'success',
              title: 'Success',
              text: r
            });
          }).catch(r => {
        this.isLoading = false;
        this.$notify({
          group: 'web',
          type: 'error',
          title: 'Error',
          text: r
        });
      })
    }
  }
}
</script>

<style scoped>
.center {
  display: flex;
  justify-content: center;
  align-content: center;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
  padding-top: 1rem;
}
.box {
  display: grid;
  grid-auto-flow: row dense;
  width:80vw;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  grid-template-rows: repeat(2, 1fr);
}
.scroll {
  overflow-x: hidden;
  overflow-y: scroll;
  height: 70vh;
}
.item{
  padding-left: 2rem;
}
.theme--light.v-btn {
  color: rgb(255 255 255);
}

</style>