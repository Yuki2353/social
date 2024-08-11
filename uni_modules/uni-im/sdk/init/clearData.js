import $state from '../state/index.js';
export default () => {
  $state.conversation.dataList = [];
  $state.conversation.hasMore = true;

  $state.notification.dataList = [];
  $state.notification.hasMore = true;

  $state.friend.dataList = [];
  $state.friend.hasMore = true;

  $state.group.dataList = [];
  $state.group.hasMore = true;

  $state.currentConversationId = false;
}
