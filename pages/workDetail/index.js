import request from '~/api/request';
import config from '~/config';
import { getOnboardingStatus, updateOnboarding } from '~/api/onboarding';

/** pending 时轮询 /healing/status：首包稍快，之后拉长间隔，减轻服务端压力（Coze 常需数分钟） */
const HEALING_POLL_FIRST_MS = 6000;
const HEALING_POLL_MIN_INTERVAL_MS = 12000;
const HEALING_POLL_MAX_INTERVAL_MS = 45000;

function apiBaseToWsUrl(apiBase) {
  if (!apiBase) return '';
  return apiBase.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
}

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
    showMbtiGuide: false,
    mbtiGuideMode: 'select', // 'select' | 'test'
    mbtiOptions: ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'],
    draftMbti: '',
    healingVisible: false,
    healingStatus: 'none', // none | pending | success
    healingIsPublic: false,
    healingScores: null,
    healingSummary: '',
    healingColorAnalysis: '',
    healingDominantEmotion: '',
    healingDominantEmotionLabel: '',
    healingDominantEmotionScore: 0,
    healingCompositionReport: '',
    healingLineAnalysis: null,
    healingSuggestion: '',
    healingKeyColors: [],
    isOwner: false,
  },

  formatDate(dateInput) {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}年${month}月${day}日`;
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
      const enhancedWork = {
        ...body,
        createdAtDisplay: this.formatDate(body.createdAt),
      };
      this.setData({ work: enhancedWork, loading: false, error: '' });
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
        isOwner: !!work?.isOwner || this.data.source === 'my',
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
      healingCompositionReport: work.healingCompositionReport || '',
      healingLineAnalysis: work.healingLineAnalysis || null,
      healingSuggestion: work.healingSuggestion || '',
      healingKeyColors: work.healingKeyColors || [],
      isOwner: !!work.isOwner,
    });

    if (healingStatus === 'pending') {
      this.setData({ healingLoading: true });
      this._startHealingPush();
      this._pollStatus(this.data.workId);
    }
  },

  onUnload() {
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
    this._stopHealingPush();
  },

  /** Coze 回调写库后服务端经 WS 推送，收到后立即拉 /healing/status */
  _startHealingPush() {
    if (this._healingPushActive || !this.data.workId) return;
    const token = wx.getStorageSync('access_token');
    if (!token) return;

    this._healingPushActive = true;
    const wsUrl = `${apiBaseToWsUrl(config.baseUrl)}/chat?token=${encodeURIComponent(token)}`;

    try {
      this._socketTask = wx.connectSocket({ url: wsUrl });
    } catch (e) {
      this._healingPushActive = false;
      return;
    }

    if (!this._socketTask || typeof this._socketTask.onMessage !== 'function') {
      this._healingPushActive = false;
      return;
    }

    this._socketTask.onMessage((res) => {
      let raw = res.data;
      if (typeof raw !== 'string') {
        try {
          raw = JSON.stringify(raw);
        } catch (e) {
          return;
        }
      }
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch (e) {
        return;
      }
      if (msg.type !== 'healing_update' || !msg.data || msg.data.workId !== this.data.workId) {
        return;
      }
      if (msg.data.status === 'failed') {
        if (this._pollTimer) {
          clearTimeout(this._pollTimer);
          this._pollTimer = null;
        }
        this.setData({
          healingLoading: false,
          healingStatus: 'none',
          healingError: '分析失败，请稍后重试',
        });
        wx.showToast({ title: '分析失败', icon: 'none' });
        this._stopHealingPush();
        return;
      }
      if (msg.data.status === 'success') {
        if (this._pollTimer) {
          clearTimeout(this._pollTimer);
          this._pollTimer = null;
        }
        request('/healing/status', 'GET', { workId: this.data.workId })
          .then((r) => {
            if (this._applyHealingSuccessFromStatusRes(r)) {
              this._stopHealingPush();
            }
          })
          .catch(() => {});
      }
    });

    this._socketTask.onClose(() => {
      this._socketTask = null;
      this._healingPushActive = false;
    });

    this._socketTask.onError(() => {
      this._healingPushActive = false;
    });
  },

  _stopHealingPush() {
    if (this._socketTask) {
      try {
        this._socketTask.close({});
      } catch (e) {}
      this._socketTask = null;
    }
    this._healingPushActive = false;
  },

  _applyHealingSuccessFromStatusRes(res) {
    const body = res.data || res;
    const status = body.status || body.data?.status;
    if (status !== 'success') return false;
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
      healingCompositionReport: data.compositionReport || '',
      healingLineAnalysis: data.lineAnalysis || null,
      healingSuggestion: data.suggestion || '',
      healingKeyColors: data.keyColors || [],
    });
    wx.showToast({ title: '分析完成', icon: 'success' });
    return true;
  },

  async onAnalyzeTap() {
    const { workId, healingLoading } = this.data;
    if (!workId || healingLoading) return;

    // 节点三：首次分析前检查 MBTI
    try {
      const info = await getOnboardingStatus();
      if (info.forceReset) wx.setStorageSync('ob_step', 0);
      const obStep = wx.getStorageSync('ob_step') ?? 0;
      if (obStep < 3 && (info.onboardingStep ?? 0) < 3 && !info.mbti) {
        this.setData({ showMbtiGuide: true, mbtiGuideMode: 'select' });
        return;
      }
      if (obStep < 3) wx.setStorageSync('ob_step', 3);
    } catch {}

    this._doAnalyze();
  },
  async _doAnalyze() {
    const { workId, healingLoading } = this.data;
    if (!workId || healingLoading) return;

    this.setData({
      healingLoading: true,
      healingError: '',
      healingStatus: 'pending',
    });

    wx.showToast({ title: '分析中...', icon: 'none' });

    try {
      await request('/healing/analyze', 'POST', { data: { workId } });
      this._stopHealingPush();
      this._startHealingPush();
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

  onMbtiSelect(e) {
    this.setData({ draftMbti: e.currentTarget.dataset.mbti });
  },
  onSwitchMbtiTest() {
    this.setData({ mbtiGuideMode: 'test' });
  },
  onSwitchMbtiSelect() {
    this.setData({ mbtiGuideMode: 'select' });
  },
  async onSaveMbti() {
    const mbti = this.data.draftMbti;
    try {
      await updateOnboarding({ mbti, onboardingStep: 3 });
      wx.setStorageSync('ob_step', 3);
    } catch {}
    this.setData({ showMbtiGuide: false });
    this._doAnalyze();
  },
  onSkipMbti() {
    updateOnboarding({ onboardingStep: 3 }).catch(() => {});
    wx.setStorageSync('ob_step', 3);
    this.setData({ showMbtiGuide: false });
    this._doAnalyze();
  },
  onGoMbtiTest() {
    updateOnboarding({ onboardingStep: 3 }).catch(() => {});
    wx.setStorageSync('ob_step', 3);
    this.setData({ showMbtiGuide: false });
    wx.navigateTo({ url: '/pages/mbti/index' });
  },

  _pollStatus(workId) {
    if (this._pollTimer) clearTimeout(this._pollTimer);
    this._healingPollIntervalMs = HEALING_POLL_MIN_INTERVAL_MS;

    const poll = async () => {
      try {
        const res = await request('/healing/status', 'GET', { workId });
        const body = res.data || res;
        const status = body.status || body.data?.status;

        if (status === 'success') {
          this._applyHealingSuccessFromStatusRes(res);
          this._stopHealingPush();
          return;
        }

        if (status === 'failed') {
          this.setData({
            healingLoading: false,
            healingStatus: 'none',
            healingError: '分析失败，请稍后重试',
          });
          wx.showToast({ title: '分析失败', icon: 'none' });
          this._stopHealingPush();
          return;
        }

        const nextMs = Math.min(
          Math.round(this._healingPollIntervalMs * 1.35),
          HEALING_POLL_MAX_INTERVAL_MS,
        );
        this._healingPollIntervalMs = nextMs;
        this._pollTimer = setTimeout(poll, nextMs);
      } catch {
        const nextMs = Math.min(
          Math.round((this._healingPollIntervalMs || HEALING_POLL_MIN_INTERVAL_MS) * 1.2),
          HEALING_POLL_MAX_INTERVAL_MS,
        );
        this._healingPollIntervalMs = nextMs;
        this._pollTimer = setTimeout(poll, nextMs);
      }
    };

    this._pollTimer = setTimeout(poll, HEALING_POLL_FIRST_MS);
  },

  async onTogglePrivacyTap() {
    const { healingIsPublic, healingStatus, healingAnalyzed } = this.data;
    // 未分析时后端还没有 healing 记录，仅切换本地预设状态
    if (healingStatus === 'none' && !healingAnalyzed) {
      this.setData({ healingIsPublic: !healingIsPublic });
      return;
    }
    await this.onTogglePrivacy({ detail: { value: !healingIsPublic } });
  },

  async onTogglePrivacy(e) {
    const { workId, healingAnalyzed, healingStatus } = this.data;
    if (!workId || (!healingAnalyzed && healingStatus !== 'pending')) return;
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
