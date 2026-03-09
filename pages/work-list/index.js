import request from '~/api/request';

Page({
  data: {
    loading: true,
    error: '',
    list: [],
    mode: 'published', // 'published' | 'draft'
    emptyText: '暂无作品',
  },

  onLoad(options) {
    const mode = options?.mode === 'draft' ? 'draft' : 'published';
    const title = mode === 'draft' ? '草稿箱' : '已发布';
    wx.setNavigationBarTitle({ title });
    this.setData({
      mode,
      emptyText: mode === 'draft' ? '还没有保存到草稿箱的作品' : '你还没有发布任何作品',
    });
    this.fetchList(mode);
  },

  onShow() {
    // 返回列表时刷新一次，确保状态最新
    const { mode } = this.data;
    this.fetchList(mode);
  },

  async fetchList(mode) {
    this.setData({
      loading: true,
      error: '',
    });
    try {
      const res = await request('/work/list', 'GET', { status: mode });
      const body = res.data || res;
      const list = Array.isArray(body) ? body : body?.data || [];
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

  onItemTap(e) {
    const workId = e.currentTarget.dataset.workId;
    if (!workId) return;
    wx.navigateTo({
      url: `/pages/workDetail/index?workId=${encodeURIComponent(workId)}`,
    });
  },
});

