<template>
  <div>
    <v-text-field v-model="pageNum" type="number" v-on:change="paginate"/>
    <div style="display: flex; flex-wrap: wrap; justify-content: center">
      <v-btn v-on:click="filterData('error')">Error</v-btn>
      <v-btn v-on:click="filterData('log')">Log</v-btn>
      <v-btn v-on:click="filterData('debug')">debug</v-btn>

    </div>
    <div style="display: flex; flex-wrap: wrap; justify-content: center; ">
      <v-btn v-for="(i, index) in allFrom"
             style="margin: 0.24rem 1rem"
             v-on:click="filterByFrom(i)"
             :key="index">{{i}}</v-btn>

    </div>
    <div style="display: flex; flex-wrap: wrap; justify-content: center">
      <v-btn v-on:click="reset">Reset</v-btn>
    </div>

    <v-row class="justify-center align-center">
      <v-col class="d-flex justify-center"
             cols="12" sm="3" md="3" lg="3" xl="4"
             v-for="(i, index) in parsed"
             :key="index">
        <v-card>
          <template v-slot:title>
            {{ i.type }} {{ i.from }}
          </template>

          <template v-slot:subtitle>
            {{ new Date(i.timestamp).toDateString() }} {{ new Date(i.timestamp).toTimeString() }}
          </template>

          <template v-slot:text>
            <div>
              {{ i.log }}
            </div>
            <div>
              <vue-json-pretty :data="i.data" showLength deepCollapseChildren :deep="1"/>
            </div>
          </template>
        </v-card>

      </v-col>
    </v-row>
  </div>
</template>

<script>
import json from '@/assets/output.json'
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';

export default {
  name: 'HelloWorld',

  data: () => ({
    filteredData: json,
    parsed: [],
    pageNum: 1,
    pageSize: 50,
    allFrom:  [],
  }),
  components: {
    VueJsonPretty,
  },
  mounted() {
    this.paginate()
    this.allFrom = [...new Set(json.map(({from})=>from))];
  },
  methods: {
    paginate() {
      this.parsed = this.filteredData.slice((parseInt(this.pageNum) - 1) * this.pageSize, parseInt(this.pageNum) * this.pageSize);
    },
    filterByType(type) {
      this.pageNum = 1
      this.parsed = json.filter(f => f.type === type)
    },
    filterByFrom(from) {
      this.pageNum = 1
      this.parsed = json.filter(f => f.from === from)
    },
    reset() {
      this.filteredData = json;
    }
  }

}
</script>
