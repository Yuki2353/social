<template>
	<view>
		<view v-for="(item,index) in dataList" :key="_id">
			<saren-message-item @readMessage="readMessage" :msgInfo="item"></saren-message-item>
		</view>
	</view>
</template>

<script>
	import messageMixin from "@/common/mixin/sarenMessageList.js"
	
	export default {
		mixins: [messageMixin],
		data() {
			return {
				
			}
		},
		methods: {
			
		},
	}
</script>

<style>

</style>
