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

  onDeleteTap(e) {
    const workId = e.currentTarget.dataset.workId;
    if (!workId) return;
    wx.showModal({
      title: '删除分析',
      content: '确定要删除这条 AI 分析记录吗？删除后可以重新发起分析。',
      confirmText: '确认删除',
      confirmColor: '#FF4D4F',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request('/healing/delete', 'POST', { data: { workId } });
          const newList = (this.data.list || []).filter((item) => item.workId !== workId);
          this.setData({ list: newList });
          wx.showToast({ title: '已删除', icon: 'none' });
        } catch (err) {
          const message = (err && err.message) || err?.data?.message || '删除失败，请稍后重试';
          wx.showToast({ title: message, icon: 'none' });
        }
      },
    });
  },
});

