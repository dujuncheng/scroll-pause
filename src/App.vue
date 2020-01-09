<template>
  <div id="app">
    <ScrollContainer :hooks=" '._title-hook' ">
      <Content></Content>
    </ScrollContainer>
  </div>
</template>

<script>
import Content from './components/content.vue'
import ScrollContainer from './components/scroll-container.vue'

export default {
  name: 'app',
  components: {
    Content,
    ScrollContainer
  }
}
</script>

<style>
</style>
