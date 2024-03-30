<template>
  <v-dialog v-model="dialog" max-width="500">
    <template v-slot:activator="{ on, attrs }">
      <v-btn dark v-bind="attrs" v-on="on">
        Actions
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="text-h5">
        User Actions
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-col class="justify-center">
            <div v-for="(i, index) in actionButtons" :key="index" style="padding:1rem;">
              <v-btn @click="currentButtonAction=i" :disabled="!i.show">{{ i.name }}</v-btn>
            </div>

          </v-col>
        </v-container>
        <v-container>
          <v-col class="justify-center">
            <div v-for="(i, index) in actionButtonTextBox" :key="index" style="padding:1rem;">
              <v-btn v-on:click="showTextBox(i)" :disabled="!i.show">{{ i.name }}</v-btn>
            </div>
          </v-col>
        </v-container>
        <v-container>
          <v-text-field v-model="reason" v-if="currentButtonTextBoxAction" label="Enter reason"/>
        </v-container>
      </v-card-text>
      <v-card-actions v-if="currentButtonTextBoxAction">
        <div>
          Are you sure you want to {{ currentButtonTextBoxAction.name }}
        </div>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="dialog = false">
          No
        </v-btn>
        <v-btn color="green darken-1" text :disabled="!currentButtonTextBoxAction"
               v-on:click="triggerAction(currentButtonTextBoxAction)">
          Yes
        </v-btn>
      </v-card-actions>
      <v-card-actions v-if="currentButtonAction">
        <div>
          Are you sure you want to {{ currentButtonAction.name }}
        </div>
        <v-spacer></v-spacer>
        <v-btn color="green darken-1" text @click="dialog = false">
          No
        </v-btn>
        <v-btn color="green darken-1" text :disabled="!currentButtonAction"
               v-on:click="triggerAction(currentButtonAction)">
          Yes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {rejectVerifiedRealId, respawn, suspend, takedown, unsuspend} from "@/api/UserApi";
import {EventBus} from "@/store/EventBus";
import {sendNotification} from "@/api/NotificationApi";

export default {
  name: "UserActionsDialog",
  props: {
    user: {required: true, type: Object},
  },
  mounted() {
    this.updateStatus()
  },
  created() {
    EventBus.$on("updateIsSuspended", (data) => {
      this.updateStatus(data)
    });
  },
  data: () => ({
    dialog: false,
    actionButtons: [
      {
        name: "Suspend",
        action: "suspend",
        show: true,
      },
      {
        name: "Un Suspend",
        action: "unsuspend",
        show: false,

      },
      {
        name: "Takedown",
        action: "takedown",
        show: true,
      },
      {
        name: "Respawn",
        action: "respawn",
        show: false,
      },

    ],
    actionButtonTextBox: [
      {
        name: "Reject Real Id",
        action: "rejectRealId",
        show: false,
      },
    ],
    textBox: false,
    currentButtonAction: null,
    currentButtonTextBoxAction: null,
    reason: ""
  }),
  methods: {
    updateStatus(data) {
      const suspendIndex = this.actionButtons.findIndex((item) => item.action === "suspend")
      const unsuspendIndex = this.actionButtons.findIndex((item) => item.action === "unsuspend")
      const takedownIndex = this.actionButtons.findIndex((item) => item.action === "takedown")
      const respawnIndex = this.actionButtons.findIndex((item) => item.action === "respawn")
      const rejectRealIdIndex = this.actionButtonTextBox.findIndex((item) => item.action === "rejectRealId")
      if (data) {
        this.actionButtons[suspendIndex].show = true;
        this.actionButtons[unsuspendIndex].show = true;
        this.actionButtons[takedownIndex].show = true;
        this.actionButtons[respawnIndex].show = true;
      }
      if (this.user.isSuspended) {
        this.actionButtons[suspendIndex].show = false;
        this.actionButtons[unsuspendIndex].show = true;
      }
      if (this.user.state) {
        this.actionButtons[respawnIndex].show = true;
        this.actionButtons[takedownIndex].show = false;
      } else {
        this.actionButtons[respawnIndex].show = false;
        this.actionButtons[takedownIndex].show = true;
      }
      if (this.user.realIdVerificationStatus === 3) {
        this.actionButtonTextBox[rejectRealIdIndex].show = true;
      }
    },
    async triggerAction(whichAction) {
      switch (whichAction.action) {
        case "suspend": {
          await this.suspend()
          this.currentButtonAction = null
          this.currentButtonTextBoxAction = null
          break;
        }
        case "unsuspend": {
          await this.unsuspend()
          this.currentButtonAction = null
          this.currentButtonTextBoxAction = null
          break;
        }
        case "takedown": {
          await this.takedown()
          this.currentButtonAction = null
          this.currentButtonTextBoxAction = null
          break;
        }
        case "respawn": {
          await this.respawn()
          this.currentButtonAction = null
          this.currentButtonTextBoxAction = null
          break;
        }
        case "rejectRealId": {
          if(!this.reason|| this.reason===""){
            this.$notify({
              title: "Error",
              text: "Please enter a reason",
              type: "error"
            });
            return
          }
          await this.rejectRealId()
          this.currentButtonAction = null
          this.currentButtonTextBoxAction = null
          break;
        }
      }
    },
    async suspend() {
      const r = (await suspend(this.user.id)).response
      if (r.status === "OK") {
        this.$notify({
          title: "Success",
          text: "User Suspended successfully",
          type: "success"
        });
        EventBus.$emit('updateIsSuspended', {id: this.user.id, state: true})
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
    async unsuspend() {
      const r = (await unsuspend(this.user.id)).response
      if (r.status === "OK") {
        this.$notify({
          title: "Success",
          text: "User Un=suspended successfully",
          type: "success"
        });
        EventBus.$emit('updateIsSuspended', {id: this.user.id, state: false})
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
    async takedown() {
      const r = (await takedown(this.user.id)).response
      if (r.status === "OK") {
        this.$notify({
          title: "Success",
          text: "User taken down successfully",
          type: "success"
        });
        EventBus.$emit('updateTakedown', {id: this.user.id, state: true})
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
      const r = (await respawn(this.user.id)).response
      if (r.status === "OK") {
        this.$notify({
          title: "Success",
          text: "User respawned successfully",
          type: "success"
        });
        EventBus.$emit('updateTakeDown', {id: this.user.id, state: false})
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
    showTextBox(currentButtonAction){
      this.textBox = true;
      this.currentButtonTextBoxAction=currentButtonAction
    },
    async rejectRealId() {
      const r = (await rejectVerifiedRealId(this.user.id, this.reason)).response
      if (r.status === "OK") {
        this.$notify({
          title: "Success",
          text: "User rejected successfully",
          type: "success"
        });
        const response = (await sendNotification('USERS', "Your Real ID Verification was rejected", "Tap to try again.", [this.user.id])).response
        if (response.status === "OK") {
          this.$notify({
            title: "Success",
            text: response.message,
            type: "success"
          });

        } else {
          this.$notify({
            title: "Error sending passed",
            text: "Notification didn't send",
            type: "error"
          });
        }
        EventBus.$emit('rejectRealId', {id: this.user.id, state: false})
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