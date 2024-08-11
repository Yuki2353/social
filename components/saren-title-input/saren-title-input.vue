<!-- 输入组件 -->
<!-- 结构为：标题 + 输入内容 -->
<!-- 输入可以输入：
1. 文字 text min~max字数
2. 数字 number min~max范围
3. 姓名 name 正则
4. 电话号码 phone 正则 
5. 固定电话 fixedPhone 正则
6. 邮箱地址 email 正则
7. 邮政编码 postCode 正则
8. 身份证号 idNumber 正则
9. 微信号 wx 正则
10. QQ号 QQ 正则
11. 时间 time min~max范围（自动）
12. 日期 date min~max范围（自动）
13. 日期时间 datetime min~max范围（自动）
14. 地区 region 不为空
15. 地址 address 不在此组件内，见addressInput
16. 多行数组 textarea
-->

<template>
	<view>
		<view class="padding-lr border-line dflex row" v-if="type !== 'textarea'">
			<!-- 标题 -->
			<text class="title" v-if="showTitle">{{title}}</text>
			<!-- 时间输入 -->
			<picker v-if="type === 'time'" @change="timeChange" mode="time" :value="content"
				:start="min === null? '00:00': min" :end="max === null? '23:59': max"
				class="input dflex">
				<text class="input gray" v-if="content === ''">{{placeholderText}}</text>
				<text class="input" v-else>{{content}}</text>
			</picker>
			<!-- 日期输入 -->
			<view v-else-if="type === 'date'" class="input dflex">
				<uni-datetime-picker class="input"
					type="date"
					return-type="string"
					:start="min === null? '0000-01-01': min" :end="max === null? '3000-01-01': max"
					:border="false"
					v-model="content"
					:placeholder="placeholderText"
				/>
			</view>
			<!-- 日期 + 时间输入 -->
			<view v-else-if="type === 'datetime'" class="input dflex">
				<uni-datetime-picker class="input"
					type="datetime"
					return-type="string"
					:border="false"
					v-model="content"
					:placeholder="placeholderText"
					:start="min === null? '0000-01-01 00:00:01': min" :end="max === null? '3000-01-01 23:59:59': max"
				/>
			</view>
			<!-- 地区选择 -->
			<picker v-else-if="type === 'region'" @change="regionChange" mode="region" :value="content"
				class="input dflex">
				<text class="input gray" v-if="content === ''">{{placeholderText}}</text>
				<text class="input" v-else>{{content}}</text>
			</picker>
			<!-- 数字输入 -->
			<input v-else-if="type === 'number'" type="number"
				class="input" v-model.number="content" 
				:placeholder="placeholderText" placeholder-class="placeholder" />
			<!-- 其余均为文字 -->
			<input v-else type="text"
				class="input" v-model="content" 
				:placeholder="placeholderText" placeholder-class="placeholder" />
		</view>
		<view v-else class="padding-lr border-line ">
			<view class="title" v-if="showTitle">{{title}}</view>
			<textarea
				class="input-area margin-top-xs" v-model="content" 
				:placeholder="placeholderText" placeholder-class="placeholder" />
		</view>
	</view>
</template>

<script>
	import regs from "@/utils/regExp/index.js";
	
	export default {
		name:"titleInput",
		// 数据
		data() {
			return {
				content: "",
			};
		},
		props: {
			"title": {
				type: String,
				required: true
			},
			"showTitle": {
				type: Boolean,
				default: true
			},
			"placeholderText": {
				type: String,
				required: true
			},
			"type": {
				type: String,
				required: true
			},
			"min": {
				default: null
			},
			"max": {
				default: null
			}
		},
		// 方法
		methods: {
			// picker绑定函数
			timeChange(event) {
				console.log("选择时间", event);
				this.content = event.detail.value;
			},
			dateChange(event) {
				console.log("选择日期", event);
				this.content = event.detail.value;
			},
			regionChange(event) {
				console.log("选择地区", event);
				this.content = event.detail.value;
			},
			// 获取 min~max 类型数据
			getMinMax(content, compare, min, max, postfix) {
				let res = {
					success: true,
					data: content
				};
				if (min === null && max === null) {
					
				}
				else if (min === null && max !== null) {
					if (compare > max) {
						res.success = false;
						res.errMsg = `${this.title}最多输入${max}${postfix}`;
					}
				}
				else if (min !== null && max === null) {
					if (compare < min) {
						res.success = false;
						res.errMsg = `${this.title}最少输入${min}${postfix}`;
					}
				}
				else {
					if (compare < min || compare > max) {
						res.success = false;
						res.errMsg = `${this.title}输入${min}~${max}${postfix}`;
					}
				}
				return res;
			},
			// 获取正则表达式类型
			getReg(content, reg) {
				let res = {
					success: true,
					data: content
				};
				if (reg(content) === false) {
					res.success = false;
					res.errMsg = `请输入正确的${this.title}`;
				}
				return res;
			},
			// 获取不为空的数据
			getNotEmpty(content) {
				let res = {
					success: true,
					data: content
				};
				if (content === "" || content === null || content === undefined) {
					res.success = false;
					res.errMsg = `${this.title}不为空`;
				}
				return res;
			},
			// 跳过检测
			getNoCheck(content) {
				let res = {
					success: true,
					data: content
				};
				return res;
			},
			// ***
			// 父组件主动获取子组件的内容
			getInfo() {
				let type = this.type;
				if (type === "text" || type === "textarea") {
					return this.getMinMax(this.content, this.content.length, this.min, this.max, "个字");
				}
				else if (type === "number") {
					return this.getMinMax(this.content, this.content, this.min, this.max, "");
				}
				else if (type === "region") {
					return this.getNotEmpty(this.content);
				}
				else if (type === "date" ||type === "time" || type === "datetime") {
					return this.getNotEmpty(this.content);
				}
				else {
					return this.getReg(this.content, regs[this.type]);
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.row {
		background: #fff;
		position: relative;
		height: 110rpx;
		
		.title {
			flex-shrink: 0;
			width: 150rpx;
			font-size: 28rpx;
		}
		.input {
		    flex: 1;
		    font-size: 30rpx;
		    padding-left: 0;
			height: inherit;
		}
	}
	.input-area {
		font-size: 30rpx;
		padding-left: 0;
		width: 100%;
		height: 500rpx;
	}
</style>