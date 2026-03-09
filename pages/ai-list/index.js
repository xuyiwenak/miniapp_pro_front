import request from '~/api/request';

Page({
  data: {
    loading: true,
    error: '',
    list: [],
  },

  onLoad() {
    this.fetchList();
  },

  onShow() {
    // 返回时刷新，确保状态同步
    this.fetchList();
  },

  async fetchList() {
    this.setData({
      loading: true,
      error: '',
    });
    try {
      const res = await request('/healing/list', 'GET');
      const list = (res.data || res || []).map((item) => {
        const body = item;
        const dominantEmotion = body.dominantEmotion || 'calm';
        const emojiMap = {
          calm: '🌿',
          stress: '🌪️',
          joy: '✨',
          sadness: '🌧️',
        };
        return {
          ...body,
          dominantEmotionEmoji: emojiMap[dominantEmotion] || '🌿',
        };
      });
      this.setData({
        loading: false,
        list,
      });
    } catch (err) {
      const message = (err && err.message) || '加载失败，请稍后重试';
      this.setData({
        loading: false,
        error: message,
      });
    }
  },

  onBack() {
    wx.navigateBack();
  },

  onItemTap(e) {
    const workId = e.currentTarget.dataset.workId;
    if (!workId) return;
    wx.navigateTo({
      url: `/pages/workDetail/index?workId=${encodeURIComponent(workId)}`,
    });
  },
});

