<template>
  <div>
    <b><u>Caption:</u></b> {{
      caption.segments.length === 0 ? 'No CaptionStr' : caption.segments.map(r => r.segment.chunk).join(' ')
    }}
  </div>
</template>

<script>
export default {
  name: "CaptionStr",
  props: {
    caption: Object
  }
}
</script>

<style scoped>

</style>