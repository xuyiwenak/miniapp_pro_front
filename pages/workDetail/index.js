import request from '~/api/request';

Page({
  data: {
    workId: '',
    work: null,
    loading: true,
    error: '',
    // AI 疗愈分析
    healingLoading: false,
    healingError: '',
    healingReport: null,
    healingExists: false,
    healingVisible: false,
    healingStatus: 'none', // none | pending | success
    isOwner: false,
  },

  onLoad(options) {
    const workId = (options && options.workId) || '';
    if (!workId) {
      this.setData({ loading: false, error: '缺少作品 ID' });
      return;
    }
    this.setData({ workId });
    this.loadWork(workId);
    this.loadHealingReport(workId);
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

  async loadHealingReport(workId) {
    try {
      this.setData({ healingLoading: true, healingError: '' });
      const res = await request('/healing/report', 'GET', { workId });
      const body = res.data || res;
      if (!body || !body.exists) {
        this.setData({
          healingLoading: false,
          healingExists: false,
          healingVisible: false,
          healingStatus: 'none',
          healingReport: null,
        });
        return;
      }

      if (!body.visible) {
        this.setData({
          healingLoading: false,
          healingExists: true,
          healingVisible: false,
          healingStatus: 'success',
          healingReport: null,
        });
        return;
      }

      this.setData({
        healingLoading: false,
        healingExists: true,
        healingVisible: true,
        healingStatus: body.status || 'success',
        healingReport: body,
        isOwner: !!body.isOwner,
      });
    } catch (err) {
      this.setData({
        healingLoading: false,
        healingError: '加载疗愈分析失败',
      });
    }
  },

  async onAnalyzeTap() {
    const { workId, healingLoading } = this.data;
    if (!workId || healingLoading) return;

    this.setData({
      healingLoading: true,
      healingError: '',
      healingStatus: 'pending',
    });

    wx.showToast({
      title: 'AI 分析中...',
      icon: 'none',
    });

    try {
      const res = await request('/healing/analyze', 'POST', { data: { workId } });
      const body = res.data || res;
      if (!body || !body.data) {
        // 兼容 body 直接是数据的情况
        this.setData({
          healingLoading: false,
        });
        this.loadHealingReport(workId);
        return;
      }
      this.setData({
        healingLoading: false,
        healingStatus: body.data.status || 'success',
      });
      this.loadHealingReport(workId);
    } catch (err) {
      const message = (err && err.message) || err?.data?.message || '分析失败';
      wx.showToast({
        title: message,
        icon: 'none',
      });
      this.setData({
        healingLoading: false,
        healingStatus: 'none',
        healingError: message,
      });
    }
  },

  async onTogglePrivacy(e) {
    const { workId, healingReport } = this.data;
    if (!workId || !healingReport) return;
    const nextValue = !!e.detail?.value;
    const prevValue = !!healingReport.isPublic;

    if (nextValue === prevValue) return;

    this.setData({
      healingReport: {
        ...healingReport,
        isPublic: nextValue,
      },
    });

    try {
      const res = await request('/healing/privacy', 'POST', {
        data: { workId, isPublic: nextValue },
      });
      const body = res.data || res;
      const isPublic = body?.data?.isPublic ?? nextValue;
      this.setData({
        healingReport: {
          ...this.data.healingReport,
          isPublic,
        },
      });
      wx.showToast({
        title: '已更新可见范围',
        icon: 'none',
      });
    } catch (err) {
      wx.showToast({
        title: '更新失败，请稍后重试',
        icon: 'none',
      });
      this.setData({
        healingReport: {
          ...this.data.healingReport,
          isPublic: prevValue,
        },
      });
    }
  },
});
