<template>
  <v-card style="padding: 1rem; text-align: center">
    <v-card-text>
      <CaptionStr v-if="post.caption" :caption="post.caption" />
      <h3 v-if="userData.handle">@{{ userData.handle }}</h3>
      <div v-if="post.state" style="color: indianred">TAKEN DOWN</div>
      <v-btn v-else v-on:click="getUser" v-text="'Request user'" />
      <MultiPost :post="post" />
    </v-card-text>
    <v-row class="justify-center align-center">
      <v-col
        class="d-flex"
        cols="12"
        sm="5"
        md="4"
        lg="2"
        xl="2"
        v-for="(i, index) in categories"
        :key="index"
      >
        <v-switch
          class="toggle-switch"
          color="green"
          v-model="selectedCategories"
          inset
          :label="i.name"
          :value="i.id"
        />
      </v-col>
    </v-row>
    <v-card-actions style="justify-content: center">
      <v-btn
        rounded
        color="black"
        v-on:click="handleConfirm"
        dark
        class="confirm-button"
        >Confirm
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import MultiPost from '@/components/post/MultiPost';
import CaptionStr from '@/components/post/CaptionStr';

import { getUser } from '@/api/UserApi';

export default {
  name: 'PostWithCategoryCard',
  components: { CaptionStr, MultiPost },
  props: {
    post: Object,
    categories: Array,
  },
  data() {
    return {
      userData: {},
      selectedCategories: [],
    };
  },
  methods: {
    getUser() {
      getUser(this.post.authorId).then(r => (this.userData = r.data.data));
    },
    handleConfirm() {
      this.$emit('update-post-categories', this.selectedCategories);
      this.selectedCategories = [];
    },
  },
};
</script>

<style scoped>
.confirm-button {
  font-size: x-large;
}

.toggle-switch {
  padding: 0.25em;
  margin-left: 1em;
}
</style>
