<script>
	//1. 导入uni身份信息管理模块
	import uniIdPagesInit from '@/uni_modules/uni-id-pages/init.js';
	// uniIdPagesInit();
	//2. 导入uniIm
	import uniIm from '@/uni_modules/uni-im/sdk/index.js';
	// 3.引入扩展插件（项目默认引入了，扩展插件uniImMsgReader用于展示消息是否已读）
	import MsgReaderExtension from '@/uni_modules/uni-im-msg-reader/extension.js'
	
	// 引入获取 navbar
	import getSystemInfo from "@/utils/getSystemInfo.js"
	
	export default {
		onLaunch: async function() {
			// 4. 安装uniIm扩展插件
			MsgReaderExtension.install()
			// 5. 初始化uni身份信息管理模块
			uniIdPagesInit();
			// 6. 初始化uniIm
			uniIm.init();
			
			// 初始化 navBar
			getSystemInfo();
		},
		onShow: function() {
			console.log('App Show');
		},
		onHide: function() {
			console.log('App Hide');
		}
	};
</script>

<style lang="scss">
	@import url("@/common/css/iconfont/iconfont.css");
	@import url("@/common/css/common.scss");
</style>