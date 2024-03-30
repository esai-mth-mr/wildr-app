<template>
  <v-data-table
      :headers="headers"
      :items="items"
      item-key="name"
      class="elevation-1"
      :hide-default-footer="true"
  >
    <template v-slot:body="{ items, headers }" >
      <tbody>
      <tr v-for="(item,idx) in items" :key="idx">
        <td v-for="(header,key) in headers" :key="key">
          <div v-if="canUpdate.includes(header.value) && editMode">
            <v-edit-dialog
                @save="updateData(header.value, item.id, item[header.value])"
                :return-value.sync="item[header.value]"
                large
            >
              <vue-json-pretty :path="'res'"
                               :deep="1"
                               showLength
                               :data="jsonKeys.includes(header.value) ? JSON.parse(item[header.value]): item[header.value]"/>
              <template v-slot:input>
                <v-textarea
                    color="#50B359"
                    v-model="item[header.value]"
                    label="Edit"
                    :value="item[header.value]"
                />
              </template>
            </v-edit-dialog>
          </div>
          <div v-else>
            <vue-json-pretty :path="'res'"
                             :deep="1"
                             showLength
                             :data="jsonKeys.includes(header.value) ? JSON.parse(item[header.value]): item[header.value]"/>
          </div>
        </td>
      </tr>
      </tbody>
    </template>

  </v-data-table>
</template>

<script>

import VueJsonPretty from "vue-json-pretty";
import 'vue-json-pretty/lib/styles.css';

export default {
  name: "DBTable",
  components: {VueJsonPretty},
  props: {
    headers: Array,
    items: Array,
    jsonKeys: Array,
    canUpdate: Array,
    editMode: Boolean,
  },
  data: () => ({}),
  methods: {
    updateData(key, id, data) {
      this.$emit('update',key, id, data);
    }
  }
}
</script>

<style scoped>

</style>