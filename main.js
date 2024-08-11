import App from './App'
import $api from "./common/js/common.js"
import share from "./common/mixin/share.js"
import store from './store'
import storeMixin from "./store/mixin.js"
import uniIdMixin from "./store/uni-id-mixin.js"

// vue2注册
// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'

// 混入vuex
Vue.mixin(storeMixin);
// 混入分享
Vue.mixin(share);
// 混入uniId
Vue.mixin(uniIdMixin);

// 全局方法
Vue.prototype.$api = $api;

Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
	store,
  ...App
});
app.$mount();
// #endif

// vue3注册
// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App);
  
  // 混入分享
  app.mixin(share);
  // 混入vuex
  app.use(store);
  app.mixin(storeMixin);
  // 混入uniId
  app.mixin(uniIdMixin);
  
  // 全局方法
  app.config.globalProperties.$api = $api;
  
  return {
    app
  }
}
// #endif