<template>
  <div>
    <v-card  min-height="550" class="elevation-5 flex d-flex flex-column justify-lg-space-between" >
      <div style="display:flex; justify-content: center; align-content: center; padding-top: 1rem">
        <div class="circle">
          <v-avatar size="150" >
            <v-img
                :src="image"
                contain
            ></v-img>
          </v-avatar>
        </div>

      </div>
      <v-card-title class="justify-center" style="overflow-y: auto; height:100px">
        <div>
          <div style="font-weight: normal; font-size: 1rem; line-height: 1.5rem">{{title}}</div>
          <h3>{{ name }}</h3>
        </div>
      </v-card-title>
      <v-card-text>
        {{description}}
      </v-card-text>
      <v-card-actions class="justify-center align-end">
        <div v-for="(i, index) in links " :key="index" style="padding-right: 1rem; padding-left: 1rem;">
          <a :href="i.link" style="text-decoration: none;" target="_blank">
            <v-btn icon >
              <v-icon>
                {{i.icon}}
              </v-icon>
            </v-btn>
          </a>

        </div>
      </v-card-actions>

    </v-card>

  </div>
</template>

<script>
export default {
  name: "TeamCard",
  props: {
    image: String,
    title: String,
    name: String,
    description: String,
    links: Array,
  }
}
</script>
<style>
.v-card__text, .v-card__title {
  word-break: normal !important;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center !important;
}
.circle {
display: flex;
  flex-wrap: wrap;
  text-align: center;
  justify-content: center;
  align-content: center;
  background-color:#fff;
  border:2px solid #00B64C;
  height:160px;
  border-radius:50%;
  -moz-border-radius:50%;
  -webkit-border-radius:50%;
  width:160px;
}

</style>