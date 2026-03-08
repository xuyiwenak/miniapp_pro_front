import request from '~/api/request';

Page({
  data: {
    workId: '',
    work: null,
    loading: true,
    error: '',
  },

  onLoad(options) {
    const workId = (options && options.workId) || '';
    if (!workId) {
      this.setData({ loading: false, error: '缺少作品 ID' });
      return;
    }
    this.setData({ workId });
    this.loadWork(workId);
  },

  async loadWork(workId) {
    try {
      const res = await request('/home/workDetail', 'GET', { workId });
      const work = res.data || res;
      this.setData({ work, loading: false, error: '' });
    } catch (err) {
      const message = (err && err.message) || '加载失败';
      this.setData({ loading: false, error: message });
    }
  },
});
