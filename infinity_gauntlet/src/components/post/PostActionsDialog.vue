<template>
  <v-dialog
      v-model="dialog"
      max-width="500"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
          dark
          v-bind="attrs"
          v-on="on"
      >
        Actions
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-h5">
        Post Actions
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-col class="justify-center">
            <div v-for="(i, index) in actionButtons" :key="index" style="padding:1rem;">
              <v-btn @click="currentButtonAction=i" :disabled="!i.show">{{ i.name }}</v-btn>
            </div>

          </v-col>
        </v-container>
      </v-card-text>
      <v-card-actions
          v-if="currentButtonAction">
        <div>
          Are you sure you want to {{ currentButtonAction.name }}
        </div>
        <v-spacer></v-spacer>
        <v-btn
            color="green darken-1"
            text
            @click="dialog = false"
        >
          No
        </v-btn>
        <v-btn
            color="green darken-1"
            text
            :disabled="!currentButtonAction"
            v-on:click="triggerAction(currentButtonAction)"
        >
          Yes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {respawn, sensitive, takeDown, un_sensitive} from "@/api/PostApi";
import {EventBus} from "@/store/EventBus";
import {suspend} from "@/api/UserApi";

export default {
  name: "PostActionsDialog",
  props: {
    post: {required: true, type: Object},
  },
  mounted() {
    this.updateStatus();
  },
  data: () => ({
    dialog: false,
    actionButtons: [
      {
        name: "Take Down",
        action: "takeDown",
        show: true,
      },
      {
        name: "Suspend User",
        action: "suspendAuthor",
        show: true,
      },
      {
        name: "Respawn",
        action: "respawn",
        show: false,
      },
      {
        name: "Mark as sensitive",
        action: "sensitive",
        show: true,
      },
      {
        name: "Un mark as sensitive",
        action: "un-sensitive",
        show: false,
      }
    ],
    currentButtonAction: null
  }),
  created() {
    EventBus.$on("updateTakeDownState", (data) => {
      this.updateStatus(data)
    });
  },
  methods: {
    updateStatus(data){
      const takeDownIndex = this.actionButtons.findIndex((item) => item.action === "takeDown")
      const respawnIndex = this.actionButtons.findIndex((item) => item.action === "respawn")
      const sensitiveIndex = this.actionButtons.findIndex((item) => item.action === "sensitive")
      const unSensitiveIndex = this.actionButtons.findIndex((item) => item.action === "un-sensitive")
      if(data){
        this.actionButtons[takeDownIndex].show = true;
        this.actionButtons[respawnIndex].show = true;
        this.actionButtons[sensitiveIndex].show = true;
        this.actionButtons[unSensitiveIndex].show = true;
      }
      if (this.post.state) {
        this.actionButtons[takeDownIndex].show = false;
        this.actionButtons[respawnIndex].show = true;

      }
      if(this.post.sensitiveStatus ==null){
        this.actionButtons[sensitiveIndex].show = true;
        this.actionButtons[unSensitiveIndex].show = false;
      }else{
        this.actionButtons[sensitiveIndex].show = false;
        this.actionButtons[unSensitiveIndex].show = true;
      }
    },
    triggerAction(whichAction) {
      this.currentButtonAction = whichAction
      switch (whichAction.action) {
        case "takeDown": {
          this.takeDown()
          break;
        }
        case "respawn": {
          this.respawn()
          break;
        }
        case "suspendAuthor": {
          this.suspendAuthor()
          break
        }
        case "sensitive": {
          this.sensitive()
          break;
        }
        case "un-sensitive": {
          this.un_sensitive()
          break;
        }
      }
    },
    async suspendAuthor() {
      const r = (await suspend(this.post.authorId)).response
      if (r.status === "OK") {
        this.$notify({
          title: "Success",
          text: "User suspended successfully",
          type: "success"
        });
        this.dialog = false;
      } else {
        this.$notify({
          title: "Error",
          text: "Operation failed",
          type: "error"
        });
        this.dialog = false;
      }
    },
    async takeDown() {
      const r = (await takeDown(this.post.id)).response
      if (r.status === "OK") {
        this.$notify({
          title: "Success",
          text: "Post taken down successfully",
          type: "success"
        });
        EventBus.$emit('updateTakeDownState', {id: this.post.id, state: true})
        this.dialog = false;
      } else {
        this.$notify({
          title: "Error",
          text: "Operation failed",
          type: "error"
        });
        this.dialog = false;
      }
    },
    async respawn() {
      const r = (await respawn(this.post.id)).response
      if (r.status === "OK") {
        this.$notify({
          title: "Success",
          text: "Post respawned successfully",
          type: "success"
        });
        EventBus.$emit('updateTakeDownState', {id: this.post.id, state: false})
        this.dialog = false;
      } else {
        this.$notify({
          title: "Error",
          text: "Operation failed",
          type: "error"
        });
        this.dialog = false;
      }
    },
    async sensitive() {
      const r = (await sensitive(this.post.id)).response
      if (r.status === "OK") {
        this.$notify({
          title: "Success",
          text: "Post marked as sensitive successfully",
          type: "success"
        });
        EventBus.$emit('updateTakeDownState', {id: this.post.id, sensitiveStatus: true})
        this.dialog = false;
      } else {
        this.$notify({
          title: "Error",
          text: "Operation failed",
          type: "error"
        });
        this.dialog = false;
      }
    },
    async un_sensitive() {
      const r = (await un_sensitive(this.post.id)).response
      if (r.status === "OK") {
        this.$notify({
          title: "Success",
          text: "Post marked as un-sensitive successfully",
          type: "success"
        });
        EventBus.$emit('updateTakeDownState', {id: this.post.id, sensitiveStatus: false})
        this.dialog = false;
      } else {
        this.$notify({
          title: "Error",
          text: "Operation failed",
          type: "error"
        });
        this.dialog = false;
      }
    }


  }
}
</script>

<style scoped>

</style>