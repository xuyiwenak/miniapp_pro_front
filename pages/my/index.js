import request from '~/api/request';
import { uploadImage } from '~/api/upload';
import useToastBehavior from '~/behaviors/useToast';
import { MBTI_META } from '~/utils/mbtiConfig';
import { updateOnboarding } from '~/api/onboarding';

const STAR_EMOJI_MAP = {
  白羊座: '♈', 金牛座: '♉', 双子座: '♊', 巨蟹座: '♋',
  狮子座: '♌', 处女座: '♍', 天秤座: '♎', 天蝎座: '♏',
  射手座: '♐', 摩羯座: '♑', 水瓶座: '♒', 双鱼座: '♓',
};

const TAB_MODES = ['published', 'draft', 'healing'];

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    personalInfo: {},
    tabs: ['已上传', '草稿箱', '已分析'],
    activeTab: 0,
    workList: [],
    worksLoading: false,
    showMbtiGuide: false,
    mbtiGuideMode: 'select',
    draftMbti: '',
    mbtiOptions: ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'],
  },

  async onShow() {
    const Token = wx.getStorageSync('access_token');
    if (!Token) {
      this.setData({ isLoad: false, personalInfo: {} });
      return;
    }
    try {
      const personalInfo = await this.getPersonalInfo();
      this.setData({ isLoad: true, personalInfo });
      this.fetchWorks(TAB_MODES[this.data.activeTab]);
    } catch {
      this.setData({ isLoad: false, personalInfo: {} });
    }
    // 检查是否需要展示 MBTI 引导（昵称引导完成后跳转触发）
    if (wx.getStorageSync('show_mbti_guide_on_my')) {
      wx.removeStorageSync('show_mbti_guide_on_my');
      this.setData({ showMbtiGuide: true, mbtiGuideMode: 'select', draftMbti: '' });
    }
  },

  async getPersonalInfo() {
    const info = await request('/api/genPersonalInfo').then((res) => res.data.data);
    if (info && info.star) info.starEmoji = STAR_EMOJI_MAP[info.star] || '';
    if (info && info.mbti) info.mbtiEmoji = (MBTI_META[info.mbti] && MBTI_META[info.mbti].emoji) || '';
    return info;
  },

  async fetchWorks(mode) {
    if (mode === 'healing') return;
    this.setData({ worksLoading: true, workList: [] });
    try {
      const res = await request('/work/list', 'GET', { status: mode });
      const body = res.data || res;
      const list = Array.isArray(body) ? body : body?.data || [];
      const workList = list.map((item) => ({
        ...item,
        coverUrl: item.coverUrl || item.images?.[0]?.url || '',
      }));
      this.setData({ workList, worksLoading: false });
    } catch {
      this.setData({ worksLoading: false });
    }
  },

  onTabTap(e) {
    const index = e.currentTarget.dataset.index;
    if (index === this.data.activeTab) return;
    if (index === 2) {
      wx.navigateTo({ url: '/pages/ai-list/index' });
      return;
    }
    this.setData({ activeTab: index });
    this.fetchWorks(TAB_MODES[index]);
  },

  onWorkTap(e) {
    const workId = e.currentTarget.dataset.workId;
    if (!workId) return;
    const source = this.data.activeTab === 1 ? 'my' : '';
    let url = `/pages/workDetail/index?workId=${encodeURIComponent(workId)}`;
    if (source) url += `&source=${source}`;
    wx.navigateTo({ url });
  },

  onSettingTap() {
    wx.navigateTo({ url: '/pages/setting/index' });
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  onNavigateTo() {
    wx.navigateTo({ url: '/pages/my/info-edit/index' });
  },

  onMbtiGuideSelect(e) {
    this.setData({ draftMbti: e.currentTarget.dataset.mbti });
  },
  onSwitchMbtiTest() {
    this.setData({ mbtiGuideMode: 'test' });
  },
  onSwitchMbtiSelect() {
    this.setData({ mbtiGuideMode: 'select' });
  },
  async onSaveMbtiFromGuide() {
    const mbti = this.data.draftMbti;
    if (!mbti) {
      wx.showToast({ title: '请先选择你的 MBTI', icon: 'none' });
      return;
    }
    try {
      await updateOnboarding({ mbti, onboardingStep: 3 });
      wx.setStorageSync('ob_step', 3);
      wx.showToast({ title: '已保存到档案', icon: 'success' });
    } catch {}
    this.setData({ showMbtiGuide: false });
    // 刷新页面信息以展示新 MBTI
    this.getPersonalInfo().then((personalInfo) => this.setData({ personalInfo })).catch(() => {});
  },
  onSkipMbtiGuide() {
    this.setData({ showMbtiGuide: false });
  },
  onGoMbtiTestFromGuide() {
    this.setData({ showMbtiGuide: false });
    wx.navigateTo({ url: '/pages/mbti/index' });
  },

  onMbtiTap() {
    wx.showModal({
      title: 'MBTI 人格测试',
      content: '开始 MBTI 人格测试？共 60 题，约需 5 分钟。',
      confirmText: '开始',
      cancelText: '取消',
      success(res) {
        if (res.confirm) wx.navigateTo({ url: '/pages/mbti/index' });
      },
    });
  },

  onAvatarTap() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        try {
          const uploadRes = await uploadImage(tempPath);
          const url = uploadRes && (uploadRes.url != null ? uploadRes.url : uploadRes);
          const personalInfo = this.data.personalInfo || {};
          const payload = {
            name: personalInfo.name,
            gender: personalInfo.gender,
            birth: personalInfo.birth,
            address: personalInfo.address,
            brief: personalInfo.brief,
            photos: personalInfo.photos,
            image: url,
            star: personalInfo.star,
          };
          const saveRes = await request('/api/savePersonalInfo', 'POST', { data: payload });
          const info = saveRes?.data?.data || saveRes?.data || saveRes;
          if (info) {
            this.setData({ personalInfo: info });
            wx.showToast({ title: '头像已更新', icon: 'success' });
          } else {
            wx.showToast({ title: '保存成功', icon: 'success' });
          }
        } catch {
          wx.showToast({ title: '上传或保存失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      },
    });
  },
});
