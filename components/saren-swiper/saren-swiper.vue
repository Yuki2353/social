<template>
	<view>
		<swiper autoplay indicator-dots indicator-color="#f7f7f7" indicator-active-color="#ff6a6c">
			<swiper-item class="wh-full padding-lr">
				<view class="wh-full">
					<image class="wh-full border-radius" src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-7e00db99-ad65-4b9f-a74b-61bccb92b124/e3dd53b7-5106-408a-967b-9586a953e448.jpg" mode="aspectFill"></image>
				</view>
			</swiper-item>
			<swiper-item class="wh-full padding-lr">
				<view class="wh-full">
					<image class="wh-full border-radius" src="https://vkceyugu.cdn.bspapp.com/VKCEYUGU-7e00db99-ad65-4b9f-a74b-61bccb92b124/e3dd53b7-5106-408a-967b-9586a953e448.jpg" mode="aspectFill"></image>
				</view>
			</swiper-item>
		</swiper>
	</view>
</template>

<script>
	export default {
		name:"saren-swiper",
		data() {
			return {
				
			};
		}
	}
</script>

<style scoped lang="scss">
	swiper {
		width: 100%;
		height: 240rpx;
		
	}
</style>