<template>
  <v-container>
    <v-row class="justify-center align-center">
      <v-col class="d-flex justify-center"
             cols="12" sm="3" md="3" lg="4" xl="4"
             v-for="(i, index) in categories"
             :key="index">
        <v-card>
          <v-card-title v-text="i.name"/>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-text-field v-model="newCategory" placeholder="Add a Category  Comma seperated" solo/>
      <v-btn v-if="!loading" :disabled="newCategory.length===0" v-on:click="multiCategory" v-text="'Add Category'"/>
      <v-progress-circular v-else color="#50B359"/>
    </v-row>

  </v-container>
</template>

<script>
import {addCategory, getCategories} from "@/api/CategoryApi";

export default {
  name: "AddCategoryPage",
  mounted() {
    this.getCategoryList()
  },
  data: () => ({
    categories: [],
    newCategory: '',
    currentPage: 1,
    loading: false,
  }),
  methods: {
    async getCategoryList() {
      const r = (await getCategories()).data
      if (r.status === "OK") {
        this.categories = r.data
      } else {
        this.$notify({
          title: "Error",
          type: "error"
        });
      }
    },
    async addCategory(category) {
      this.loading = true;
      const response = (await addCategory(category)).response

      if (response.status === "OK") {
        await this.getCategoryList();
        this.newCategory = ''
        this.loading = false;
        this.$notify({
          title: "Success",
          text: response.message,
          type: "success"
        });
      } else {
        this.loading = false;
        this.$notify({
          title: "Error",
          text: response.message,
          type: "error"
        });
      }
    },
    multiCategory() {
      this.newCategory.split(',').map(r => r.trim()).forEach(this.addCategory)
    }
  },


}
</script>

<style scoped>

</style>