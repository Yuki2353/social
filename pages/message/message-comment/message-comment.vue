<template>
	<view>
		<mescroll-body @init="mescrollInit" @down="downCallback" @up="upCallback" :down="downOption" :up="upOption">
			<view v-for="(item,index) in dataList" :key="_id">
				<saren-message-item @readMessage="readMessage" :msgInfo="item"></saren-message-item>
			</view>
		</mescroll-body>
	</view>
</template>

<script>
	import messageMixin from "@/common/mixin/sarenMessageList.js"
	
	export default {
		mixins: [messageMixin],
		data() {
			return {
				// 数据配置
				dataOption: {
					method: "getCommentMessage"
				},
			}
		},
		methods: {
			
		},
	}
</script>

<style>

</style>
