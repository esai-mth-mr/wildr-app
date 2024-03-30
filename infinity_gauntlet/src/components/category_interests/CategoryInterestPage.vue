<template>
  <v-container>
    <div v-if="postsLoading || categoriesLoading">Loading :)</div>
    <div v-else>
      <PostWithCategoryCard
        v-if="posts[postsIndex]"
        :post="posts[postsIndex]"
        :categories="categories"
        ref="postCategoryCard"
        @update-post-categories="updatePostCategories"
      />
    </div>
  </v-container>
</template>

<script>
import PostWithCategoryCard from '@/components/category_interests/PostWithCategoryCard';
import { getUnannotatedPost, addCategoriesToPost } from '@/api/PostApi';
import { getCategories } from '@/api/CategoryApi';
import { EventBus } from '@/store/EventBus';

export default {
  name: 'CategoryInterestPage',
  components: { PostWithCategoryCard },
  async mounted() {
    await this.fetchPosts();
    await this.fetchCategories();
    EventBus.$on('updateTakeDownState', () => {
      this.fetchPosts();
    });
  },
  data: () => ({
    posts: [],
    categories: [],
    postsIndex: 0,
    postsLoading: true,
    categoriesLoading: true,
  }),
  methods: {
    async fetchPosts() {
      const r = (await getUnannotatedPost(new Date().toISOString(), 5, 0)).data;
      console.log('received posts', { posts: r.data });
      if (!r || r.status === 'ERROR') {
        this.postsLoading = false;
        this.$notify({
          title: 'Error',
          type: 'error',
        });
        return;
      }
      if (!r.data.length) {
        this.postsLoading = false;
        this.$notify({
          title: 'Yay',
          text: 'No more posts',
          type: 'info',
        });
        return;
      }
      this.posts = r.data;
      this.postsIndex = 0;
      this.postsLoading = false;
    },
    async fetchCategories() {
      this.categoriesLoading = true;
      const r = (await getCategories()).data;
      console.log('received categories', { categories: r.data });
      if (r.status === 'OK') {
        this.categories = r.data.sort((a, b) =>
          a.name < b.name ? -1 : a.name > b.name ? 1 : 0
        );
      } else {
        this.$notify({
          title: 'Error',
          type: 'error',
        });
      }
      this.categoriesLoading = false;
    },
    async updatePostCategories(selectedCategories) {
      console.log('updating post categories', {
        postId: this.posts[this.postsIndex]?.id,
        selectedCategories: selectedCategories,
      });
      if (!selectedCategories.length) {
        this.$notify({
          title: 'Error',
          text: 'Make sure to add post categories before submission',
          type: 'error',
        });
      }
      const response = (
        await addCategoriesToPost(
          this.posts[this.postsIndex]?.id,
          selectedCategories
        )
      ).response;
      if (!response || response.status === 'ERROR') {
        this.$notify({
          title: 'Error',
          text: 'Error updating categories',
          type: 'error',
        });
        return;
      }
      this.$notify({
        title: 'Success',
        text: 'updated ',
        type: 'success',
      });
      this.moveToNextPost();
    },
    moveToNextPost() {
      this.postsIndex += 1;
      if (this.postsIndex >= this.posts.length - 1) {
        console.log('fetching next page');
        this.fetchPosts();
      }
    },
  },
};
</script>

<style scoped></style>
