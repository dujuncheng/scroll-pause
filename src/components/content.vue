<template>
	<div class="im-message">
		<div :key="index" class="message-item" v-for="(item, index) in messageList">
			<h1 v-if="index % 100 === 0" class="_title-hook" data-during="1000">这里是hooks, 到这里会停止</h1>
			{{item.text}}
		</div>
	</div>
</template>

<script>
	import EventBus from '../event-bus.js'
	export default {
		name: 'app',
		data() {
			return {
				messageList: [
					{
						text: ''
					}
				]
			}
		},
		mounted() {
			EventBus.$on('scroll_pause', function (data) {
				console.log(data)
			})
		},
		created() {
			for (let i = 0; i < 1000; i++) {
				this.messageList.push({
					text: '这是很多很多很多内容噢' + i
				})
			}
		}
	}
</script>

<style lang="less">
	.im-message {
		.message-item {
			text-align: center;
		}
		.comp1 {
			position: fixed;
			left: 30px;
			top: 300px;
			color: red;
		}
	}
</style>
