<template>
  <div>
    <UserCountCalendar/>
    <UserTable :users="users"/>
    <v-row class="justify-center justify-center align-center align-content-center" style="padding: 1rem">
      <div>
        <v-text-field v-model="userHandle" label="Get user handle" prefix="@" color="green" @keydown.enter="getUser"/>
      </div>
      <div style="padding: 1rem"/>
      <v-btn v-on:click="getUser" v-text="'Request user by handle'"/>
    </v-row>
    <div style="display: flex; justify-content: center">
      <UserCard v-if="currentUser.handle" :user="currentUser" :key="userCardKey"/>
    </div>

  </div>
</template>

<script>
import {getUserByHandle, getUsers} from "@/api/UserApi";
import UserCard from "@/components/user/UserCard";
import UserTable from "@/components/user/UserTable";
import {EventBus} from "@/store/EventBus";
import UserCountCalendar from "@/components/user/UserCountCalendar";

export default {
  name: "UserPage",
  components: {UserCountCalendar, UserCard, UserTable},
  data: () => ({
    users: [],
    userHandle: '',
    userCardKey: 0,
    currentUser: {},
  }),
  mounted() {
    this.getFirstUserData()
  },
  created() {
    EventBus.$on("updateIsSuspended", (data) => {
      console.log(data)
      if (!this.users) return;
      const index = this.users.findIndex(e => e.id === data.id)
      if (index === -1) return;
      if (index > this.users.length - 1) return;
      this.users[index].isSuspended = data.state
    });
    EventBus.$on("updateTakedown", (data) => {
      console.log(data)
      this.users[this.users.findIndex(e => e.id === data.id)].state = data.state ? 1 : undefined
    });
  },
  methods: {
    async getUser() {
      const r = (await getUserByHandle(this.userHandle)).data
      if (r.status === "OK") {
        this.currentUser = r.data
        this.userCardKey++
      } else {
        this.$notify({
          title: "Error",
          type: "error"
        });
      }
    },
    async getFirstUserData() {
      const r = (await getUsers(new Date().toISOString(), 20)).data
      if (r.status === "OK") {
        this.users = r.data
      } else {
        this.$notify({
          title: "Error",
          type: "error"
        });
      }
    },
    async nextSet(limit) {
      const r = (await getUsers(this.users[this.users.length - 1].createdAt, limit)).data
      if (r.status === "OK") {
        const data = r.data
        if (data.length > 0) {
          this.users = this.users.concat(data)
        } else {
          this.$notify({
            title: "That's all",
            text: "No more users",
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