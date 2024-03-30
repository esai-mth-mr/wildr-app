<template>
  <div>
    <v-sheet height="64">
      <v-toolbar
          flat
      >
        <v-btn
            outlined
            class="mr-4"
            color="grey darken-2"
            @click="setToday"
        >
          Today
        </v-btn>
        <v-btn
            fab
            text
            small
            color="grey darken-2"
            @click="prev"
        >
          <v-icon small>
            mdi-chevron-left
          </v-icon>
        </v-btn>
        <v-btn
            fab
            text
            small
            color="grey darken-2"
            @click="next"
        >
          <v-icon small>
            mdi-chevron-right
          </v-icon>
        </v-btn>
        <v-toolbar-title v-if="$refs.calendar">
          {{ $refs.calendar.title }} |
          Users this month: {{ getMonthCount() }} |
        </v-toolbar-title>
        <v-toolbar-title v-if="$refs.calendar && new Date().getMonth() ===this.focus.getMonth()"> | {{ neededPerDay }} users needed a day to achieve goal of {{thisMonthsGoal}}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-title v-if="$refs.calendar">
          Total Users: {{ this.totalCount }}
        </v-toolbar-title>
      </v-toolbar>
    </v-sheet>
    <v-sheet height="600">
      <v-calendar
          ref="calendar"
          v-model="focus"
          type="month"
          :events="events"
          event-color="green"
      />
    </v-sheet>
  </div>
</template>

<script>
import {getAllFirebaseUsers} from "@/api/FirebaseApi";
import moment from "moment";
import  "moment-timezone";



export default {
  name: "UserCountCalendar",

  data: () => ({
    focus: new Date(),
    events: [],
    months: {},
    totalCount: 0,
    loading: false,
    thisMonthsGoal: 3000,
    neededPerDay: 0,
    highestDay: 0,
  }),
  mounted() {
    getAllFirebaseUsers()
        .then(r => {
          const dateCounts = Object()
          const monthCounts = Object()
          r.data.data.map(r => {
            const date = moment(new Date(r.metadata.creationTime)).tz('America/Los_Angeles')
            return {
              uid: r.uid,
              createdAtTS: new Date(date.format("ddd MMM Do YYYY")),
              date: date.format("ddd MMM Do YYYY"),
              monthYear: date.format("MMM YYYY"),
            }
          }).sort((a, b) => a.createdAtTS - b.createdAtTS).forEach(e => {
            dateCounts[e.date] = dateCounts[e.date]
                ? ++dateCounts[e.date]
                : 1
            monthCounts[e.monthYear] = monthCounts[e.monthYear]
                ? ++monthCounts[e.monthYear]
                : 1
          })
          Object.entries(dateCounts).forEach(e => {
            const date = moment(e[0], 'ddd MMM Do YYYY').toDate()
            this.events.push({
              name: '',
              start: date,
              end: date,
              color: this.getGreenToRed((e[1]/Math.max(... Object.values(dateCounts)))*100),
            })
            this.events.push({
              name: `${e[1]} new users`,
              start: date,
              end: date,
              color: 'black',
            })
          })

          this.months = monthCounts
          this.loading = true;
          this.totalCount = Object.values(monthCounts).reduce((partialSum, a) => partialSum + a, 0)
          this.neededPerDay = Math.ceil((this.thisMonthsGoal - this.getMonthCount() ) / this.getRemainingDaysInMonth())

          console.log(dateCounts)
          console.log(monthCounts)
          console.log(r.data.data.map(i=>{return {uid: i.uid, date: new Date(i.metadata.creationTime)}}))
        })
  },
  methods: {
    getRemainingDaysInMonth() {
      let date = new Date();
      let time = new Date(date.getTime());
      time.setMonth(date.getMonth() + 1);
      time.setDate(0);
      return (time.getDate() > date.getDate() ? time.getDate() - date.getDate() : 0)+1;
    },
    componentToHex(c) {
      const hex = c.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    },
    getGreenToRed(percent) {
      if (percent > 100) percent = 1001
      const r = percent < 50 ? 255 : Math.floor(255 - (percent * 2 - 100) * 255 / 100);
      const g = percent > 50 ? 255 : Math.floor((percent * 2) * 255 / 100);
      return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(0)

    },
    getMonthCount() {
      return this.months[this.focus.toLocaleString('default', {month: 'short'}) + ' ' + this.focus.getFullYear()]
    },
    setToday() {
      this.focus = new Date()
    },
    prev() {
      this.$refs.calendar.prev()
    },
    next() {
      this.$refs.calendar.next()
    },
  }
}
</script>

<style scoped>

</style>