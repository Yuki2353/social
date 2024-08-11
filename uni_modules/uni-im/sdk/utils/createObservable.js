// #ifdef VUE2
import Vue from 'vue'
export const $watch = Vue.watch
// #endif

// #ifdef VUE3
import {reactive,watch} from 'vue'
export const $watch = watch
// #endif


export default function(data,name = 'imObservableData'){
	if(typeof uni[name] == 'undefined'){
		// #ifdef VUE2
		// 通过Vue.observable创建一个可响应的对象
		data = Vue.observable(data)
		// #endif
		
		// #ifdef VUE3
		// 通过Vue.observable创建一个可响应的对象
		data = reactive(data)
		// #endif
		uni[name] = data
	}
	return uni[name]
}