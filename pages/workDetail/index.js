import request from '~/api/request';

Page({
  data: {
    workId: '',
    source: '',
    work: null,
    loading: true,
    error: '',
    healingLoading: false,
    healingError: '',
    healingAnalyzed: false,
    healingVisible: false,
    healingStatus: 'none', // none | pending | success
    healingIsPublic: true,
    healingScores: null,
    healingSummary: '',
    healingColorAnalysis: '',
    healingDominantEmotion: '',
    healingDominantEmotionLabel: '',
    healingDominantEmotionScore: 0,
    isOwner: false,
  },

  onLoad(options) {
    const workId = (options && options.workId) || '';
    const source = (options && options.source) || '';
    if (!workId) {
      this.setData({ loading: false, error: '缺少作品 ID' });
      return;
    }
    this.setData({ workId, source });
    this.loadWork(workId, source);
  },

  async loadWork(workId, source) {
    try {
      const api = source === 'my' ? '/work/detail' : '/home/workDetail';
      const res = await request(api, 'GET', { workId });
      const body = res.data || res;
      this.setData({ work: body, loading: false, error: '' });
      this.applyHealingFromWork(body);
    } catch (err) {
      const message = (err && err.message) || '加载失败';
      this.setData({ loading: false, error: message });
    }
  },

  applyHealingFromWork(work) {
    if (!work || !work.healingAnalyzed) {
      this.setData({
        healingAnalyzed: false,
        healingVisible: false,
        healingStatus: 'none',
        healingScores: null,
        isOwner: !!work?.isOwner,
      });
      return;
    }

    if (!work.healingVisible) {
      this.setData({
        healingAnalyzed: true,
        healingVisible: false,
        healingStatus: 'success',
        healingIsPublic: !!work.healingIsPublic,
        healingScores: null,
        isOwner: !!work.isOwner,
      });
      return;
    }

    const healingStatus = work.healingStatus || 'success';
    this.setData({
      healingAnalyzed: true,
      healingVisible: true,
      healingStatus,
      healingIsPublic: !!work.healingIsPublic,
      healingScores: work.healingScores || null,
      healingSummary: work.healingSummary || '',
      healingColorAnalysis: work.healingColorAnalysis || '',
      healingDominantEmotion: work.healingDominantEmotion || '',
      healingDominantEmotionLabel: work.healingDominantEmotionLabel || '',
      healingDominantEmotionScore: work.healingDominantEmotionScore || 0,
      isOwner: !!work.isOwner,
    });

    if (healingStatus === 'pending') {
      this.setData({ healingLoading: true });
      this._pollStatus(this.data.workId);
    }
  },

  onUnload() {
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
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

    wx.showToast({ title: 'AI 分析中...', icon: 'none' });

    try {
      await request('/healing/analyze', 'POST', { data: { workId } });
      this._pollStatus(workId);
    } catch (err) {
      const message = (err && err.message) || err?.data?.message || '提交分析失败';
      wx.showToast({ title: message, icon: 'none' });
      this.setData({
        healingLoading: false,
        healingStatus: 'none',
        healingError: message,
      });
    }
  },

  _pollStatus(workId) {
    if (this._pollTimer) clearTimeout(this._pollTimer);

    const poll = async () => {
      try {
        const res = await request('/healing/status', 'GET', { workId });
        const body = res.data || res;
        const status = body.status || body.data?.status;

        if (status === 'success') {
          const data = body.data || body;
          this.setData({
            healingLoading: false,
            healingAnalyzed: true,
            healingVisible: true,
            healingStatus: 'success',
            healingScores: data.scores || null,
            healingSummary: data.summary || '',
            healingColorAnalysis: data.colorAnalysis || '',
            healingDominantEmotion: data.dominantEmotion || '',
            healingDominantEmotionLabel: data.dominantEmotionLabel || '',
            healingDominantEmotionScore: data.dominantEmotionScore || 0,
            healingIsPublic: data.isPublic !== false,
          });
          wx.showToast({ title: '分析完成', icon: 'success' });
          return;
        }

        if (status === 'failed') {
          this.setData({
            healingLoading: false,
            healingStatus: 'none',
            healingError: '分析失败，请稍后重试',
          });
          wx.showToast({ title: '分析失败', icon: 'none' });
          return;
        }

        this._pollTimer = setTimeout(poll, 5000);
      } catch {
        this._pollTimer = setTimeout(poll, 5000);
      }
    };

    this._pollTimer = setTimeout(poll, 3000);
  },

  async onTogglePrivacy(e) {
    const { workId } = this.data;
    if (!workId || !this.data.healingAnalyzed) return;
    const nextValue = !!e.detail?.value;
    const prevValue = !!this.data.healingIsPublic;

    if (nextValue === prevValue) return;

    this.setData({ healingIsPublic: nextValue });

    try {
      const res = await request('/healing/privacy', 'POST', {
        data: { workId, isPublic: nextValue },
      });
      const body = res.data || res;
      const isPublic = body?.data?.isPublic ?? body?.isPublic ?? nextValue;
      this.setData({ healingIsPublic: isPublic });
      wx.showToast({ title: '已更新可见范围', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: '更新失败，请稍后重试', icon: 'none' });
      this.setData({ healingIsPublic: prevValue });
    }
  },
});
