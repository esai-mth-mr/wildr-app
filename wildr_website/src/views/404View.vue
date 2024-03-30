<template>
<div class="center">
  <div>
    <h1>404</h1>
  </div>
  <div>

    <v-btn color="#00B64C" class="theme--dark" rounded v-on:click="$router.push('/')" style="">Go Home</v-btn>
  </div>
</div>
</template>

<script>
export default {
  name: "404View"
}
</script>

<style scoped>
.center{
  display: flex;
  place-content: center;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
}
</style>