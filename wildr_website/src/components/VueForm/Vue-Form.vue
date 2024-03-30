<template>
  <vue-form-generator :schema="schema" :model="getModels()" :options="formOptions" style="padding-top:2rem"/>
</template>

<script>
import VueFormGenerator from "vue-form-generator";
import "vue-form-generator/dist/vfg.css";

export default {
  name: "Vue-Form",
  components: {
    "vue-form-generator": VueFormGenerator.component
  },
  props: {
    tableData: Array,
  },
  data() {
    return {
      schema: {
        fields: this.tableData
      },
      formOptions: {
        validateAfterLoad: false,
        validateAfterChanged: true,
        validateAsync: true
      }
    }
  },
  methods: {
    getModels() {
      return this.tableData.reduce((prev, cur) => (prev[cur.model] ? prev[cur.model] = null : null, prev), {})
    }
  }
}
</script>

<style>
fieldset {
  border: 0;
}
.field-label.featured{
  font-size: 1.5em;
}
.vue-form-generator .field-label span{
  margin: 0;
}
.v-application .error{
  background-color: transparent !important;
}
.vue-form-generator .field-submit input{
  background-color: #00B64C !important;
  border-color: #00B64C !important;
}
</style>