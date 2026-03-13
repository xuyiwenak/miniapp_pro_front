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
    const title = mode === 'draft' ? '草稿箱' : '已上传';
    wx.setNavigationBarTitle({ title });
    this.setData({
      mode,
      emptyText: mode === 'draft' ? '还没有保存到草稿箱的作品' : '你还没有上传任何作品',
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
    const { mode } = this.data;
    const source = mode === 'draft' ? 'my' : '';
    let url = `/pages/workDetail/index?workId=${encodeURIComponent(workId)}`;
    if (source) {
      url += `&source=${source}`;
    }
    wx.navigateTo({ url });
  },

  onPublishTap(e) {
    const workId = e.currentTarget.dataset.workId;
    if (!workId) return;
    wx.showModal({
      title: '上传作品',
      content: '确定要将这条草稿上传吗？',
      confirmText: '确认上传',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request('/work/publishDraft', 'POST', { data: { workId } });
          const newList = (this.data.list || []).filter((item) => item.workId !== workId);
          this.setData({ list: newList });
          wx.showToast({ title: '已上传', icon: 'success' });
        } catch (err) {
          const message = (err && err.message) || err?.data?.message || '上传失败，请稍后重试';
          wx.showToast({ title: message, icon: 'none' });
        }
      },
    });
  },

  onDeleteTap(e) {
    const workId = e.currentTarget.dataset.workId;
    if (!workId) return;
    const { mode } = this.data;
    const title = mode === 'draft' ? '删除草稿' : '删除作品';
    const content =
      mode === 'draft'
        ? '确定要删除这条草稿吗？删除后无法恢复。'
        : '确定要删除这条已上传作品吗？删除后将无法恢复。';
    wx.showModal({
      title,
      content,
      confirmText: '确认删除',
      confirmColor: '#FF4D4F',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await request('/work/delete', 'POST', { data: { workId } });
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

