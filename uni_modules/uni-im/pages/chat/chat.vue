<template>
  <view id="uni-im-chat" class="uni-im-chat" :class="{'pc':isWidescreen}">
    <!-- #ifdef H5 -->
    <!-- web-pc端会话标题 -->
    <text v-if="isWidescreen" id="web-pc-chat-title" :selectable="true">{{navTitle}}</text>
    <!-- H5端 左上角显示未读消息数 ，app端使用setTitleNViewButtonBadge设置，小程序端暂未支持-->
    <view @click="tapUnreadCount" class="unread_count" v-if="unread_count != 0">
      {{ unread_count > 99 ? '99+' : unread_count }}
    </view>
    <!-- #endif -->

    <!-- 消息列表 -->
    <uni-im-msg-list :conversationId="conversation.id" ref="msg-list" 
      @showControl="showControl" @longpressMsgAvatar="onLongpressMsgAvatar"
      @retriesSendMsg="retriesSendMsg" class="msg-list"
      @clickItem="onclickMsgList" @putChatInputContent="putChatInputContent" :chooseMore="chooseMoreMsg"
      :checkedMsgList.sync="checkedMsgList"
    ></uni-im-msg-list>
    
    <!-- 聊天数据输入框 键盘弹出后要抬高底部内边距 全面屏的安全距离 -->
    <text v-if="conversation.leave" class="disable-chat-foot">- 你不是此群成员 -</text>
    <text v-else-if="conversation.isMuteAllMembers" class="disable-chat-foot">-  全群禁言禁止输入 -</text>
    <view v-else class="chat-foot">
      <uni-im-chat-input
        ref="chat-input"
        v-model="chatInputContent"
        :keyboardMaxHeight="keyboardMaxHeight"
        :keyboardHeight="keyboardHeight"
        @showAboutMenber="showAboutMenber"
        @confirm="chatInputConfirm"
        @input="onInput"
        @sendSoundMsg="sendSoundMsg"
        @sendCodeMsg="beforeSendMsg"
      >
        <template #about-msg>
          <view class="answer-msg" v-if="answerMsg !== false">
            <text class="answer-msg-text">{{getNicknameByUid(answerMsg.from_uid)}}：{{answerMsgNote(answerMsg)}}</text>
            <uni-icons class="close-icon" @click="answerMsg = false" type="clear" color="#ccc" size="18px"></uni-icons>
          </view>
        </template>
      </uni-im-chat-input>
      
      <view v-if="chooseMoreMsg" class="toolbar">
        <view class="item" @click="shareMsg(checkedMsgList)">
          <view class="icons-box">
            <uni-icons size="35" type="redo"></uni-icons>
          </view>
          <text class="title">逐条转发</text>
        </view>
        <view class="item" @click="shareMsg(checkedMsgList,true)">
          <view class="icons-box">
            <uni-icons size="35" type="paperplane"></uni-icons>
          </view>
          <text class="title">合并转发</text>
        </view>
        <view class="item" @click="toolBarNext">
          <view class="icons-box">
            <uni-icons size="35" type="folder-add"></uni-icons>
          </view>
          <text class="title">收藏</text>
        </view>
        <view class="item" @click="toolBarNext">
          <view class="icons-box">
            <uni-icons size="35" type="download"></uni-icons>
          </view>
          <text class="title">保存至电脑</text>
        </view>
        <view class="item" @click="toolBarNext">
          <view class="icons-box">
            <uni-icons size="35" type="trash"></uni-icons>
          </view>
          <text class="title">删除</text>
        </view>
        <uni-icons @click="chooseMoreMsg = false" color="#999" size="35" type="closeempty"></uni-icons>
      </view>
    </view>

    <msg-popup-control ref="msg-popup-control" @answer="setAnswerMsg" @share="shareMsg" @chooseMore="chooseMoreMsg = true;checkedMsgList = $event"></msg-popup-control>

    <template v-if="aboutMenberIsShow && (isWidescreen ? memberList.length != 0 : 1 )">
      <view class="member-list-mark" @click.stop="aboutMenberIsShow = false"></view>
      <view class="member-list-box">
        <view class="head">
          <view class="close">
            <uni-icons @click="aboutMenberIsShow = false" type="back" color="#000" size="12px"></uni-icons>
          </view>
          <text class="title">选择提醒的人</text>
        </view>
        <uni-search-bar v-if="!isWidescreen" v-model="aboutUserKeyword" placeholder="搜索" cancelButton="none" class="search" />
        <scroll-view class="member-list" :scroll-y="true" :scroll-top="memberListScrollTop" :show-scrollbar="true">
          <view v-for="(item,index) in memberList" :key="item._id" class="member-list-item"
            :class="{'member-list-item-active':callAboutUid == item.users._id}" @mouseover="callAboutUid = item.users._id"
            @click="setCallAboutUid(item.users._id)" :id="'a'+item.users._id">
            {{item.users.nickname}}
          </view>
          <view class="null-about-menber-tip" v-if="memberList.length === 0">没有与"{{aboutUserKeyword}}"相关成员</view>
        </scroll-view>
      </view>
    </template>


    <!-- #ifdef H5 -->
    <uni-im-share-msg id="uni-im-share-msg" ref="share-msg"></uni-im-share-msg>
    <!-- #endif -->
    
    
    <view style="position: fixed;top: 200px;left: 0;background-color: #FFFFFF;z-index: 9999;">
      <!-- aboutMenberIsShow：{{aboutMenberIsShow}}-
      keyboardMaxHeight:{{keyboardMaxHeight}}
      aboutUserKeyword:{{aboutUserKeyword}}-
			conversation.leave:{{conversation.leave}}
      chatInputContent:{{chatInputContent}}
			keyboardHeight:{{keyboardHeight}}
			systemInfo.osName:{{systemInfo.osName}}
      chooseMoreMsg:{{chooseMoreMsg}}
      checkedMsgList:{{checkedMsgList}} -->
		</view>
  </view>
</template>

<script>
  import uniIm from '@/uni_modules/uni-im/sdk/index.js';
  import msgPopupControl from '@/uni_modules/uni-im/components/uni-im-msg/popup-control.vue';
  import {markRaw} from "vue";

  import {
    store as uniIdStore
  } from '@/uni_modules/uni-id-pages/common/store';
  

  let shiftKeyPressed = false;
  let lastKeyDown = ""
  let currentCursor = ''

/**
 * chat 组件，渲染一个完整的会话，包括头部、消息列表、输入区。
 * 
 * @module
 * 
 * @see 用于渲染消息列表的组件 {@link module:uni-im-msg-list}
 */
  export default {
    components: {
      msgPopupControl
    },
    data() {
      return {
        // 当前会话对象
        conversation: {
          id: false,
          leave:false,
          title: ''
        },
        navTitle:"",//导航栏标题
        keyboardHeight: 0,
        keyboardMaxHeight: 0,
        answerMsg: false,
        callAboutUid: false,
        aboutMenberIsShow: false,
        inputCursor: '',
        // @用户时的搜索词
        aboutUserKeyword: '',
        memberListScrollTop: 0,
        chooseMoreMsg: false,
        checkedMsgList: [],
        // 聊天输入框内容
        chatInputContent: '',
      };
    },
    props: {
      // #ifdef VUE3
      conversation_id: {
        default: ''
      }
      // #endif
    },
    computed: {
      ...uniIm.mapState(['currentConversationId', 'conversationDatas', 'isWidescreen', 'systemInfo']),
      unread_count() {
        // 所有会话的未读消息数
        const unreadCount = uniIm.conversation.unreadCount()

        // #ifdef APP-PLUS
        // 给标题栏返回按钮添加数字角标，表示有几条其他会话的未读消息数
        plus.webview.currentWebview().setTitleNViewButtonBadge({
          index: 0,
          text: unreadCount
        })
        // #endif

        return unreadCount
      },
      group_member() {
        let group_member = this.conversation.group_member
        if (!this.callAboutUid && typeof group_member == 'object') {
          this.callAboutUid = Object.keys(this.conversation.group_member)[0]
        }
        return group_member
      },
      memberList() {
        // 当前输入框已经@了的用户id 要过滤掉 
        let callUidList = this.getCallUid()
        
        let group_member = this.group_member || {}
        let memberList = []
        for (let key in group_member) {
          let member = group_member[key]
          if(member.users.nickname){
            let nickname = member.users.nickname.toLowerCase()
            if (nickname.indexOf(this.aboutUserKeyword.toLowerCase()) != -1 && !callUidList.includes(member.users._id)) {
              memberList.push(member)
            }
          }
        }
        if (memberList.length) {
          // 按昵称排序
          memberList.sort((a, b) => {
            return a.users.nickname.localeCompare(b.users.nickname)
          })
          this.callAboutUid = memberList[0].users._id
          return memberList
        } else {
          // 注意：没有数据时也不需要隐藏aboutMenberIsShow，因为用户可能回删@用户的关键词
          return []
        }
      },
      //当前用户自己的uid
      current_uid() {
        return uniIdStore.userInfo._id;
      }
    },
    created() {
      // console.log('chat created',this.systemInfo)
      // 监听推送消息
      this.onImMsg = (res) => {
        if(uniIm.isDisabled){
          return console.log('uniIm isDisabled')
        }
        //获取透传内容
        const {
          type,
          data
        } = res.data.payload;
        //判断消息类型是否为im，且为当前页面对应会话消息
        if (
          type == "uni-im" 
          && data.conversation_id == this.currentConversationId 
          && data.from_uid != this.current_uid 
          && uniIm.utils.isReadableMsg(data)
        ) {
          // 已经打开相应会话时，收到消息，则设置此会话为已读。注意无需判断，本地会话未读数是否为0，因为云端可能不为0
          this.conversation.clearUnreadCount();
          console.log('聊天页面-收到消息: ', JSON.stringify(res));
          // 需要重新设置滚动条的高，以至于用户可以立即看到（即：滚动到最后一条消息）
          // console.log(66666);

          // 注：为兼容web-PC端这里必须使用setTimeout 0
          setTimeout(() => {
            this.$refs['msg-list']?.notifyNewMsg()
          }, 0);
        }
      }
      uniIm.onMsg(this.onImMsg);
      
      // 优化 提前拿到键盘高度，防止第一次在会话点击输入框时，输入框抬起慢。（缺省值300，是为了解决模拟器调试没有键盘高度而设置）
      this.keyboardMaxHeight = uniIm.keyboardMaxHeight || 300

      // #ifdef H5
      //通过监听窗口变化 获取键盘弹出或收起事件
      window.addEventListener('resize', () => {
        if (this.currentConversationId) {
          this.showLast(0);
        }
      })
      // #endif

      this.onKeyboardHeightChange = ({
        height
      }) => {
        this.keyboardHeight = height
        // console.log('height',height)
        if (height > this.keyboardMaxHeight) {
          this.keyboardMaxHeight = height
        }
        this.$nextTick(() => {
          this.showLast();
        });
      }
      // #ifndef H5
      // 监听键盘高度变化显示最后一条消息
      uni.onKeyboardHeightChange(this.onKeyboardHeightChange);
      // #endif
      
      // #ifdef H5
      const oldWindowHeight = window.innerHeight;
      window.onresize = ()=>{
        this.onKeyboardHeightChange({"height": oldWindowHeight - window.innerHeight})
      }
      // #endif
    },
    mounted() {
      // #ifdef H5
      // 以下为实现拖拽或粘贴图片至聊天页面，直接发送的逻辑
      const chatBodyDom = document.getElementById("uni-im-chat")
      // 阻止默认事件
      chatBodyDom.addEventListener(
        'dragover',
        function(event) {
          event.preventDefault();
        },
        false
      );
      // 拖拽结束时触发
      chatBodyDom.addEventListener(
        'drop',
        e => {
          //取消默认浏览器拖拽效果
          e.preventDefault();
          //获取文件对象
          let fileList = e.dataTransfer.files;
          if (fileList.length == 0) {
            return false;
          }
          const [file] = fileList
          let fileType = file.type.split('/')[0] || 'file'
          if (fileType === 'image') {
            let blobUrl = window.URL.createObjectURL(file);
            if(this.chatInputContent === ''){
              this.$refs["chat-input"].setContent(`<img src="${blobUrl}" />`)
            }else{
              this.$refs["chat-input"].addHtmlToCursor(`<img src="${blobUrl}" />`)
            }
            return false; // 拖拽图片内容进入输入框先不发送
          }
          // 其他文件类型，直接发送
          let {
            name,
            size
          } = file
          // console.log(78979798,fileList);
          const blobUrl = window.URL.createObjectURL(file);
          this.uploadFileAndSendMsg({
              tempFiles:[{
                size,
                name,
                path:blobUrl,
                fileType
              }]
          })
        },
        false
      );

      const chatInput = document.querySelector('.pc .uni-im-editor');
      if (chatInput) {
        //键盘按下时
        let oldValue = ''
        chatInput.addEventListener('keydown',async e => {
          if (this.aboutMenberIsShow) {
            if(e.key == 'Enter'){
              if(this.memberList.length){
                console.log('选中要@的人')
                this.setCallAboutUid(this.callAboutUid)
              }
            }else if(["ArrowUp", "ArrowDown"].includes(e.key)){
              console.log('上下箭头选择@谁')
              let index = this.memberList.findIndex(i => i.users._id == this.callAboutUid)
              // console.log('index',index);
              if (e.key == "ArrowUp") {
                index--
              } else {
                index++
              }
              if (index < 0 || index > this.memberList.length - 1) {
                index = 0
              }
              this.callAboutUid = this.memberList[index].users._id
              // 防止选中的成员看不到，触发滚动
              this.memberListScrollTop = (index - 3) * 50
              // console.log('this.memberListScrollTop',this.memberListScrollTop);
              e.preventDefault();
            }else if(["ArrowLeft", "ArrowRight"].includes(e.key)){
              this.aboutMenberIsShow = false
            }else if(e.key == 'Backspace'){
              setTimeout(() => {
                // 获取e.target 元素内不包含在标签内的文字内容
                let newValue = e.target.innerText
                console.log('删除键',newValue,oldValue);
                // 拿到newValue 和 oldValue 中 包含的@字符的个数
                let newAtN = newValue.replace(/[^@]/g, "").length
                let oldAtN = oldValue.replace(/[^@]/g, "").length
                if(newAtN === 0 || newAtN < oldAtN){
                  console.log('删除了@成员的昵称');
                  this.aboutMenberIsShow = false
                }
                oldValue = newValue
              }, 0);
            }
          }
        })
      }
      
      // #endif
    },
    onShow() {
      if (this.conversation.id) {
        // 用于打开会话窗口后，切换到后台，再切回时设置当前会话id。
        uniIm.currentConversationId = this.conversation.id

        // 用于从后台切到前台时，设置当前会话为已读
        this.clearConversationUnreadCount()
      }
    },
    onUnload() {
      // console.log('onUnload');
      
      // 关闭监听消息推送事件
      uniIm.offMsg(this.onImMsg);
      
      // #ifndef H5
      uni.offKeyboardHeightChange(this.onKeyboardHeightChange)
      // #endif
      
      //页面销毁之前销毁 全局变量 正在聊天的用户的id
      uniIm.currentConversationId = false
      // console.log('beforeDestroy');
      // 关闭sound播放
      uniIm.audioContext.stop()
    },
    beforeDestroy() {
      //页面销毁之前销毁 全局变量 正在聊天的用户的id
      uniIm.currentConversationId = false
      // console.log('beforeDestroy');
      // 关闭sound播放
      uniIm.audioContext.stop()
    },
    onHide() {
      uniIm.currentConversationId = false
      // 关闭sound播放
      uniIm.audioContext.stop()
    },
    async onLoad(param) {
      for (const key in param) {
        try{
          param[key] = JSON.parse(param[key])
        }catch(_){}
      }
      //调用load方法，因为pc宽屏时本页面是以组件形式展示。如$refs.chatView.loadconversation_id()执行
      await this.load(param);
    },
    onBackPress(e) {
      console.log('onBackPress',e);
      if(this.aboutMenberIsShow){
        this.aboutMenberIsShow = false
        return true
      }
    },
    watch: {
      // 监听群昵称变化
      'conversation.title':{
        handler(){
          this.updateNavTitle()
        },
        deep:true,
        immediate:true
      },
      // 监听群成员数变化
      'conversation.group_member':{
        handler(){
          this.updateNavTitle()
        },
        deep:true,
        immediate:true
      }
    },
    methods: {
      async load(param) {
        this.answerMsg = false
        // conversation_id = "single_eff0518ad35e16a8a025cc8af03e0388"
        if(this.conversation.id){
          // 设置（含清空）上一个会话的chatInputContent 实现多个会话之间的草稿功能
          this.conversation.chatInputContent = this.chatInputContent
        }

        // console.log('conversation_id',conversation_id);
        this.conversation = await uniIm.conversation.get(param)
        // 初始化会话的chatInputContent
        this.chatInputContent = this.conversation.chatInputContent
        // this.conversation.call_list = []
        // console.log('this.conversation',this.conversation)
        

        //设置全局的app当前正在聊天的会话id（注：本页面可能是直达页）
        uniIm.currentConversationId = this.conversation.id
        this.$nextTick(() => {
          this.$refs['msg-list'].init()
        })

        // console.log('this.conversation',this.conversation);
        
        //debug用模拟一次性自动发送100条数据
        // for (var i = 0; i < 20; i++) {
        // 	this.chatInputContent = '这是第'+i+'条消息'
        // 	this.beforeSendMsg()
        // }*/
        
        // 清除当前会话未读数
        this.clearConversationUnreadCount()
        
        // #ifdef H5
        if(this.isWidescreen){
          // 切换到新的会话后把输入焦点设置到输入框（考虑到可能有草稿文字，需延迟设置）
          setTimeout(() => {
            this.$refs["chat-input"]?.focus()
          }, 100)
        }
        // #endif
      },
      clearConversationUnreadCount(){
        if(this.conversation.unread_count){
          this.conversation.clearUnreadCount();
        }
      },
      onclickMsgList(){
        this.$refs["chat-input"]?.setShowMore(false)
        uni.hideKeyboard()
      },
      putChatInputContent(value){
        this.$refs["chat-input"]?.setContent(value)
      },
      getNicknameByUid(uid) {
        let users = uniIm.users[uid]
        if (users) {
          return users.nickname
        } else {
          return ''
        }
      },
      answerMsgNote(answerMsg) {
        return uniIm.utils.getMsgNote(answerMsg)
      },
      onChatInputFocus() {
        // console.log('onChatInputFocus');
        this.$refs["chat-input"]?.focus()
      },
      uploadFileAndSendMsg({tempFiles}){
        // console.log(res, 'image');
        // console.log('this.uploadFileAndSendMsg res',res);
        tempFiles.forEach(async tempFile => {
          // console.log('tempFile~',tempFile);
          const {
            path:url,
            name,
            size
          } = tempFile;
          let {fileType} = tempFile
          if (!['image', 'video'].includes(fileType)) {
            fileType = 'file'
          }
          // console.log('fileType===>', fileType);
          // console.error('tempFile~~~~~~~~~', tempFile,size/1000/1024+'mb');
          const sizeMB = size/1000/1024
          if(fileType == 'image' && sizeMB > 2){
            return uni.showToast({
              title: '图片大小不能超过2mb',
              icon: 'none'
            });
          } else if(sizeMB > 100){
            return uni.showToast({
              title: '文件大小不能超过100mb',
              icon: 'none'
            });
          }
          
          const data = {};
          const fileInfo = {
            url,
            size,
            name
          };
          if(fileType == 'image'){
            const {width,height} = await uni.getImageInfo({src:url});
            fileInfo.width = width
            fileInfo.height = height
          }
          data[fileType] = fileInfo
          let msg = await this.beforeSendMsg(data,false)
          // console.log('~~~beforeSendMsg',msg);
          try{
            const result = await uniCloud.uploadFile({
              filePath: tempFile.path,
              cloudPath: Date.now() + uniCloud.getCurrentUserInfo().uid + '.' + name.split('.').pop(),
            });
            // console.log('result.fileID',result.fileID);
            msg.body.url = result.fileID
            await this.updateMsg(msg)
            this.sendMsg(msg)
          }catch(e){
            console.error('uploadFile error:',e)
          }
          
        });
      },
      async chooseFileSendMsg(type,_config={}) {
        // console.log('type',type);
        //先创建发送消息的
        let objFn = {
          'image':()=>{
            uni.chooseImage({
            	// count:9,
              crop:{
                "quality":100,
                "width":800,
                "height":800
              },
            	// sourceType,
            	// extension,
            	success:res=> beforeUploadFileAndSendMsg(res,'image'),
            	"fail":alertFail
            });
          },
          'video':()=>{
            uni.chooseVideo({
              sourceType: ['camera', 'album'],
              success:res=> beforeUploadFileAndSendMsg(res,'video'),
              "fail":alertFail
            });
          },
          'all':()=>{
            let chooseFile = uni.chooseFile;
            // #ifdef MP-WEIXIN
            chooseFile = wx.chooseMedia;
            // #endif
            chooseFile({
            	type: 'all',
            	// count:10,
              sourceType:['album','camera'],
            	"success":this.uploadFileAndSendMsg,
            	"fail":alertFail
            })
          }
        };
        objFn[type]();
        
        const _this = this;
        function beforeUploadFileAndSendMsg(res,fileType){
          // console.log(111,res)
          // 视频只能选择单文件，为了参数统一，这里转成数组
          if(fileType == 'video'){
            // #ifndef H5
            res.tempFile = {
              size: res.size,
              width: res.width,
              height: res.height
            }
            // #endif
            res.tempFile.path = res.tempFilePath
            res.tempFiles = [res.tempFile]
          }
          res.tempFiles.forEach(item=>{
            //如果没有type，默认为：用户选择的类型
            if(!item.fileType){
              item.fileType = fileType
            }
            // 如果没有name，默认为：用户id+随机数+时间戳生成一个
            if(!item.name){
             item.name = _this.current_uid + Math.random().toString(36).substr(2) + Date.now()
            }
          })
          // console.log(222,res)
          _this.uploadFileAndSendMsg(res)
        }
        function alertFail(res){
          console.error('res',res);
          // uni.showModal({
          //   content: JSON.stringify(res),
          //   showCancel: false
          // });
        }
        
      },
      sendSoundMsg(sound){
        this.beforeSendMsg({sound})
      },
      onInput(e) {
        // console.log('onInput',e.data);
        // 记录按下@之后的内容
        const enterText = e.data
        if(this.aboutMenberIsShow && enterText && enterText != '@'){
          setTimeout(()=>{
            // 输入法正在输入中
            let isComposing = false
            // #ifdef H5
            // isComposing = this.isWidescreen ? document.querySelector('#uni-im-chat-input').isComposing : e.isComposing
            // #endif
            if (isComposing) {
              console.log('输入法正在输入中')
            }else{
              this.aboutUserKeyword += enterText
            }
          },0)
        }else{
          this.aboutUserKeyword = ""
        }
        
      },
      async setAnswerMsg(msgId) {
        this.answerMsg = this.conversation.msgList.find(msg => msg._id == msgId)
        this.$refs["chat-input"]?.focus()
      },
      async chatInputConfirm() {
        if(this.aboutMenberIsShow && this.memberList.length){
          console.log('正在执行选中要@的人，不发送数据')
          return
        }
        if (typeof this.chatInputContent == 'object'){
          // 富文本（图文混排、@某人）消息
          // 把字符串中带url的链接转为html的a标签的形式。1.将字符串，按是否为标签，切割为数组
          const htmlStr = this.chatInputContent.html.split(/(<[^>]+>)/)
                  // 2.找到不以<开头的字符串内的url并替换为 html的a
                  .map(str=>str.startsWith('<') ? str : uniIm.utils.replaceUrlToLink(str))
                  .join('')
          // 先插到消息列表
          let msg = await this.beforeSendMsg({
            "rich-text":uniIm.utils.parseHtml(htmlStr)
          },false)
          
          // 上传消息中的图片
          let promiseArr = []
          msg.body.forEach(async item=>{
            if(item.type === 'text'){
              item.text = item.text.trim();
            }else if(item.name === 'img'){
              promiseArr.push(new Promise((resolve,reject)=>{
                uni.getImageInfo({
                  src:item.attrs.src,
                  success:res=>{
                    item.attrs.width = res.width
                    item.attrs.height = res.height
                    resolve()
                  },
                  fail:reject
                });
              }))
              
              if(item.attrs.src.indexOf('blob:http') === 0){
                promiseArr.push(new Promise((resolve,reject)=>{
                  uniCloud.uploadFile({
                    filePath: item.attrs.src,
                    cloudPath: Date.now() + uniCloud.getCurrentUserInfo().uid + '.' + name.split('.').pop(),
                  }).then(res=>{
                    item.attrs.src = res.fileID
                    // console.log('上传成功',res);
                    resolve()
                  }).catch(e=>{
                    reject()
                  })
                }))
              }
            }
          })
          await Promise.all(promiseArr)
          // 传完更新
          await this.updateMsg(msg)
          // 执行发送
          this.sendMsg(msg)
        }else{
          // 把this.chatInputContent中的&nbsp;变成空格，再把头尾的空格去掉
          this.chatInputContent = this.chatInputContent.replace(/&nbsp;/g, ' ').trim()
          // 普通消息
          await this.beforeSendMsg()
        }
      },
      showAboutMenber(){
        if(!this.conversation.group_id){
          return // 非群聊会话无需@用户的功能
        }
        // #ifdef MP
        return // 小程序暂不支持@用户的功能
        // #endif
        
        uni.hideKeyboard()
        this.aboutUserKeyword = '';
        console.log('showAboutMenber',this.memberList[0]);
        this.callAboutUid = this.memberList[0].users._id
        this.aboutMenberIsShow = true
      },
      async beforeSendMsg(param = {},_continue = true) {
        console.log('beforeSendMsg',{param});
        let msg = {
          type: 'text',
          to_uid: this.conversation.friend_uid,
          conversation_id: this.conversation.id,
          group_id: this.conversation.group_id,
          client_create_time: Date.now(),
          from_uid: uniCloud.getCurrentUserInfo().uid,
          state: 0,
          body: this.chatInputContent
        }
        // 根据传入的参数设置消息类型和内容
        for (let key in param) {
          if (param[key]) {
            msg.type = key
            msg.body = JSON.parse(JSON.stringify(param[key]))
          }
        }
        // 如果是文本类型需要做一些处理
        if (msg.type === 'text') {
          //清除空格
          msg.body = msg.body.trim();
          // 阻止发送空消息
          if (!msg.body.length) {
            this.resetChatInput()
            return uni.showToast({
              title: '不能发送空消息',
              icon: 'none'
            });
          }
        }

        //如果是回复某一条消息，需要带上相关id
        if (this.answerMsg !== false) {
          msg.about_msg_id = this.answerMsg._id
        }

        // 消息列表追加此消息。此时消息状态值为0，表示发送中
        let resMsg = this.conversation.msgList.push(msg)
        
        // 代码是另一个输入框，这里不能清空
        if(msg.type !== 'code'){
          this.resetChatInput()
        }

        this.$nextTick(() => {
          this.showLast()
        })
        msg.state = 0
        // console.error('sendMsg-sendMsg-sendMsg', msg);
        // 存到本地数据库
        await this.conversation.msgManager.localMsg.add(msg)
        // console.log('msg被localMsg.add引用 会新增一个unique_id',msg)
        if(_continue){
          this.sendMsg(msg);
        }else{
          return msg;
        }
      },
      resetChatInput() {
        this.chatInputContent = ''
        // 关闭引用的消息
        this.answerMsg = false
      },
      getCallUid(){
        return this.chatInputContent?.aboutUserIds || []
      },
      sendMsg(msg, callback) {
        if(this.conversation.source){
          msg.chat_source = this.conversation.source
        }
        
        // console.log('sendMsg-sendMsg-sendMsg', msg);
        const uniImCo = uniCloud.importObject('uni-im-co', {
          customUI: true
        });
        // 接收消息的appId，默认为当前应用的appId。如果你是2个不同appId的应用相互发，请修改此值为相对的appId
        msg.appId = this.systemInfo.appId
        // 拿到当前消息的索引值
        let index = this.conversation.msgList.findIndex(i => i.unique_id == msg.unique_id)
        // 生成新对象，否则不触发更新
        msg = Object.assign({}, msg)
        
        // 检查内容不是包含 个推 两个字，有则 改成 个 + 零宽字符 + 推
        let tmpBody = JSON.stringify(msg.body)
        if(tmpBody.includes('个推')){
          msg.body = JSON.parse(tmpBody.replace(/个推/g,'个\u200b推'))
        }
        
        uniImCo.sendMsg(msg)
          .then(async e => {
            // console.log('uniImCo.sendMsg',{e,msg});
            msg.state = e.errCode === 0 ? 100 : -100;
            msg.create_time = e.data.create_time;
            msg._id = e.data._id;
            await this.updateMsg(msg)
          })
          .catch(async e => {
            uni.showModal({
              content: e.message,
              showCancel: false,
              confirmText: '关闭',
            });
            console.error('uniImCo.sendMsg error:', e.errCode, e.message);
            // 必须要有create_time的值，否则indexDB通过创建时间索引找不到数据
            msg.create_time = Date.now();
            msg.state = -200;
            await this.updateMsg(msg)
          })
          .finally(e => {
            if (callback) {
              callback(e);
            }
          });
      },
      // 更新消息
      async updateMsg(msg){
        if(!msg.conversation_id){
          throw 'msg.conversation_id不能为空'
        }
        if(!msg.unique_id){
          throw 'msg.unique_id不能为空'
        }
        let conversation = await uniIm.conversation.get(msg.conversation_id)
        let index = conversation.msgList.findIndex(_msg => _msg.unique_id == msg.unique_id)
        if(index === -1){
          throw 'updateMsg msg 不存在'
        }

        /* TODO: splice 更新方式会把原本的 msg 对象从数组中踢出，导致已经渲染的消息组件无法响应后续的变更（比如 read_msg），
          所以这里使用 merge 更新方式，虽然此方式在 vue2 中有问题。*/
        let oldMsg = conversation.msgList[index]
        Object.assign(oldMsg, msg)
        // conversation.msgList.splice(index, 1, msg)

        conversation.msgManager.localMsg.update(msg.unique_id, msg)
        // console.log('change after',conversation.msgList[index]);
      },
      retriesSendMsg(msg) {
        uni.showLoading({
          mask: true
        });
        // console.log('retriesSendMsg', msg);
        msg.isRetries = true
        this.sendMsg(msg, e => {
          uni.hideLoading();
        });
      },
      showLast(duration = 300) {
        let msgListRef = this.$refs['msg-list']
        if (msgListRef) {
          msgListRef.showLast(duration)
        }
      },
      onLongpressMsgAvatar(user_id){
        // 当前输入框已经@了的用户id 要过滤掉
        let callUidList = this.getCallUid()
        if(callUidList.includes(user_id)){
          console.log('此用户id已经@过');
          uni.showToast({
            title: '此用户已经@过',
            icon: 'none'
          });
        }else{
          this.$refs['chat-input'].raiseEditor = true
          this.$nextTick(()=>{
            this.setCallAboutUid(user_id,false)
          })
        }
      },
      setCallAboutUid(user_id,needDeleteLeftART = true) {
        this.aboutMenberIsShow = false
        this.$refs['chat-input'].addCallUser({
          user_id,
          nickname: this.group_member[user_id].users.nickname
        },needDeleteLeftART,this.aboutUserKeyword.length)
      },
      async showControl({
        msgId,
        msgContentDomInfo
      }) {
        const msg = this.conversation.msgList.find(msg => msg._id === msgId)
        let isSelf = msg.from_uid == uniCloud.getCurrentUserInfo().uid
        this.$refs['msg-popup-control'].show({isSelf,msg,msgContentDomInfo})
        
        /*
        let controlData = {
          msg,
          isInTop: false
        };

        let metrics = uniIm.utils.getScreenMetrics()
        if (isSelf) {
          controlData.left = 'unset'
          controlData.right = metrics.pageWidth - msgContentDomInfo.right
        } else {
          controlData.left = msgContentDomInfo.left + msgContentDomInfo.width / 2
          controlData.right = 'unset'
        }
        
        controlData.isInTop = msgContentDomInfo.top > 60
        
        if (controlData.isInTop) {
          // #ifdef H5
          let n = -20
          // #endif
          // #ifndef H5
          let n = -65
          // #endif
          controlData.top = msgContentDomInfo.top + n
        } else {
          // #ifdef APP
          let n = 8
          // #endif
          // #ifdef H5
          let n = 55
          // #endif
          // #ifdef MP
          let n = 10
          // #endif
          controlData.top = msgContentDomInfo.bottom + n
        }
        
        console.log('msgContentDomInfo',msgContentDomInfo)
        controlData.msgWidth = msgContentDomInfo.width
        this.$refs['msg-popup-control'].show(controlData)
        */
      },
      shareMsg(msgList,merge = false) {
        this.$refs['share-msg'].open(msgList,merge)
        this.chooseMoreMsg = false
      },
      toolBarNext(){
        uni.showToast({
          title: '暂不支持',
          icon: 'none',
          duration: 2000
        });
        this.chooseMoreMsg = false
      },
      tapUnreadCount() {
        //点击未读消息文字按钮事件
        uni.navigateBack();
      },
      updateNavTitle(){
        this.navTitle = this.conversation.title
        if (this.conversation.group_id) {
          this.navTitle += '(' + Object.keys(this.conversation.group_member).length + ")";
        }
        if(this.navTitle && !this.isWidescreen){
          uni.setNavigationBarTitle({
          	title: this.navTitle
          });
        }
      }
    },
    onNavigationBarButtonTap(e) {
      if (e.index === 0) {
        if (this.conversation.group_id) {
          uni.navigateTo({
            url: "/uni_modules/uni-im/pages/group/info?conversation_id=" + this.conversation.id
          })
        } else {
          // console.log(this.conversation,6565);
          uni.navigateTo({
            url: `/uni_modules/uni-im/pages/chat/info?user_id=${this.conversation.friend_uid}&conversation_id=${this.conversation.id}`
          })
          // uni.showToast({
          // 	title: '仅群里可见，详细信息',
          // 	icon: 'none'
          // });
        }
      }
      // uni.navigateBack();
    }
  };
</script>

<style lang="scss">
@import "@/uni_modules/uni-im/common/baseStyle.scss";
page {
  height: 100%;
}
.uni-im-chat {
  position: relative;
  height: 100%;
  flex: 1;
  background-color: #efefef;
  
  .msg-list {
    /* height: 1px; 覆盖掉 组件内的height：100%，使得flex-grow: 1作用在容器内被撑开*/
    height: 1px !important;
    flex-grow: 1;
  }
  
  .chat-foot,.disable-chat-foot{
    flex-direction: column;
    border-top: 1rpx solid #BBBBBB;
    background-color: #F7F7F7;
  }
  
  .disable-chat-foot{
    padding: 20px;
    text-align: center;
    justify-content: center;
    color: #777777;
  }
  
  .answer-msg {
    padding: 2px 10px;
    background-color: #eee;
    border-radius: 3px;
    margin-bottom: 10px;
    flex-direction: row;
    align-items: center;
    ::v-deep .uni-icons {
      margin-left: 5px;
    }
    /* #ifdef H5 */
    .close-icon{
      cursor: pointer;
    }
    @media screen and (min-device-width:960px){
      margin: 5px;
      margin-bottom: -18px;
      top: 0;
    }
    /* #endif */
    .answer-msg-text {
      width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 12px;
      color: #333;
    }
  }
  
  /* #ifdef H5 */
  .vue-codemirror {
    position: fixed;
    top: 100px;
    left: 50%;
    width: 500px;
  }
  
  /* #endif */
  
  /* #ifdef H5 */
  .chat-foot {
    border: none;
  }
  /* #endif */
  
  /* #ifdef H5 */
  .unread_count {
    position: absolute;
    top: -30px;
    left: 70rpx;
    z-index: 10;
    background-color: #dfe2e9;
    padding: 0 14rpx;
    height: 14px;
    line-height: 14px;
    border-radius: 9px;
    color: #0c1013;
    font-size: 12px;
    margin-top: 3px;
  }
  
  /* #endif */
  
  .member-list-box {
    position: absolute;
    width: 750rpx;
    height: 80vh;
    bottom: 0;
    z-index: 10;
    background-color: #ffffff;
    overflow: hidden;
    border-radius: 15px 15px 0 0;
    box-shadow: 0 0 100px rgba(0, 0, 0, 0.2);
    /* #ifdef H5 */
    @media screen and (min-device-width:960px){
      border-radius: 15px;
      max-height: 300px;
      height: auto;
      width: 260px;
      left: auto;
      right: calc(50vw - 300px);
      bottom: 300px;
    }
    /* #endif */
    .head{
      flex-direction: row;
      position: relative;
      .close {
        position: absolute;
        left: 5px;
        background-color: #eee;
        height: 18px;
        width: 18px;
        margin: 12px;
        transform: rotate(270deg);
        border-radius: 50%;
        justify-content: center;
        align-items: center;
      }
      .title {
        flex: 1;
        text-align: center;
        margin-top: 10px;
        font-size: 14px;
        color: #000;
      }
    }
    .search {
       ::v-deep .uni-searchbar__box {
        margin: 0;
        height: 30px;
        .uni-searchbar__box-icon-search {
          padding: 0 5px;
        }
        .uni-searchbar__text-placeholder {
          // font-size: 12px;
        }
      }
    }
    .member-list {
      height: 100%;
      overflow-y: auto;
      padding: 10px;
      .member-list-item {
        overflow: hidden;
        height: 40px;
        width: 100%;
        font-size: 14px;
        line-height: 40px;
        padding-left: 15px;
        border-radius: 10px;
        margin-bottom: 10px;
        text-align: left;
        /* #ifdef H5 */
        @media screen and (min-device-width:960px){
          margin:0;
          margin-bottom: 5px;
          cursor: pointer;
        }
        /* #endif */
      }
      .member-list-item-active {
        background-color: #efefef;
      }
      .null-about-menber-tip {
        color: #666;
        font-size: 12px;
        align-items: center;
        justify-content: center;
        height: 100px;
      }
    }
  }
  .member-list-mark {
    position: fixed;
    top: 0;
    left: 0;
    width: 750rpx;
    flex: 1;
    width: 100vw;
    height: 100vh;
    z-index: 9;
    background-color: rgba(0, 0, 0, 0.1);
  }
  
  .toolbar{
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #ededed;
    border-top: solid 1px #ededed;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    z-index: 9;
  }
  .toolbar .item {
    align-items: center;
  }
  /* #ifdef H5 */
  .toolbar ::v-deep .uni-icons {
    cursor: pointer;
  }
  /* #endif */
  .toolbar .icons-box {
    background-color: #fff;
    justify-content: center;
    width: 60px;
    height: 60px;
    border-radius: 100px;
    margin-bottom: 10px;
  }
}
</style>