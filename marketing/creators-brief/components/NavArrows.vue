<template>
  <footer class="absolute bottom-0 right-0 p-2">
    <button
      v-if="$slidev.nav.currentPage !== 1"
      class="icon-btn bottom-0 right-0 p-2"
      title="Previous"
      @click="$slidev.nav.prev"
    >
      <carbon:arrow-left />
    </button>

    <button
      class="icon-btn bottom-0 right-0 p-2"
      v-if="$slidev.nav.currentPage !== $slidev.nav.total"
      title="Next"
      @click="$slidev.nav.next"
    >
      <carbon:arrow-right />
    </button>
  </footer>
</template>
