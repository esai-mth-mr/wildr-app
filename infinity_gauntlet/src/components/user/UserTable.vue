<template>
  <div>
    <v-dialog
        v-model="dialog"
        width="800px"
    >
      <UserCard :user="currentUser" :key="key"/>
    </v-dialog>
    <v-data-table
        :loading="loading"
        :headers="headers"
        :items="users"
        :options.sync="options"
        class="elevation-1"
        :footer-props="{
            'items-per-page-options':[10,25,50],
          }"
        @click:row="showDialog"/>
  </div>
</template>

<script>
import UserCard from "@/components/user/UserCard";

export default {
  name: "UserTable",
  components: {UserCard},
  props: {
    users: Array
  },
  watch: {
    options: {
      handler(o) {
        if((o.itemsPerPage!==this.currentItemsPerPage)){
          this.loading = true;
          this.$parent.nextSet(o.itemsPerPage).then(() => {
            this.loading = false
            this.currentItemsPerPage = o.itemsPerPage
          })
        }
        if (o.page * o.itemsPerPage === this.users.length) {
          this.loading = true;
          this.$parent.nextSet(o.itemsPerPage).then(() => {
            this.loading = false
          })
        }
      },
      deep: true,
    },
  },
  data: () => ({
    currentItemsPerPage: 10,
    loading: false,
    headers: [],
    options: {},
    dialog: false,
    key: 0,
    currentUser: {}
  }),
  mounted() {
    this.populateHeaders()
  },
  methods: {
    showDialog(item) {
      this.key++;
      this.currentUser = item;
      this.dialog = true;
    },
    populateHeaders() {
      this.headers = [
        'id',
        'handle',
        'name',
        'email',
        'phoneNumber',
        'score',
        'isSuspended',
        'createdAt'
      ].map(e => {
        return {
          text: e.replace(/([A-Z])/g, (match) => ` ${match}`)
              .replace(/^./, (match) => match.toUpperCase())
              .trim(),
          sortable: false,
          value: e,
        }
      })
    }
  }
}
</script>

<style scoped>

</style>