import request from '~/api/request';
import { getOnboardingStatus, updateOnboarding } from '~/api/onboarding';
import { UPLOAD_DAILY_LIMIT } from '~/config/constants';

function getStarFromBirth(birth) {
  if (!birth || typeof birth !== 'string') return '';
  const parts = birth.trim().split(/[-/]/);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (!month || !day) return '';
  if (month === 12 && day >= 22) return '摩羯座 ♑';
  if (month === 1 && day <= 19) return '摩羯座 ♑';
  if (month === 1) return '水瓶座 ♒';
  if (month === 2 && day <= 18) return '水瓶座 ♒';
  if (month === 2) return '双鱼座 ♓';
  if (month === 3 && day <= 20) return '双鱼座 ♓';
  if (month === 3) return '白羊座 ♈';
  if (month === 4 && day <= 19) return '白羊座 ♈';
  if (month === 4) return '金牛座 ♉';
  if (month === 5 && day <= 20) return '金牛座 ♉';
  if (month === 5) return '双子座 ♊';
  if (month === 6 && day <= 21) return '双子座 ♊';
  if (month === 6) return '巨蟹座 ♋';
  if (month === 7 && day <= 22) return '巨蟹座 ♋';
  if (month === 7) return '狮子座 ♌';
  if (month === 8 && day <= 22) return '狮子座 ♌';
  if (month === 8) return '处女座 ♍';
  if (month === 9 && day <= 22) return '处女座 ♍';
  if (month === 9) return '天秤座 ♎';
  if (month === 10 && day <= 23) return '天秤座 ♎';
  if (month === 10) return '天蝎座 ♏';
  if (month === 11 && day <= 22) return '天蝎座 ♏';
  if (month === 11) return '射手座 ♐';
  if (month === 12) return '射手座 ♐';
  return '';
}

Page({
  data: {
    dailyLimit: UPLOAD_DAILY_LIMIT,
    userName: '',
    privacyAgreed: false,
    showPrivacyDetail: false,
    // 昵称引导
    showNicknameGuide: false,
    draftNickname: '',
    draftBirth: '',
    draftStar: '',
    birthPickerVisible: false,
  },

  async onShow() {
    const token = wx.getStorageSync('access_token');
    if (!token) return;

    // 读取隐私同意状态
    const agreed = !!wx.getStorageSync('privacy_agreed');
    this.setData({ privacyAgreed: agreed });

    // 拉取用户名
    try {
      const res = await request('/api/genPersonalInfo');
      const info = res?.data?.data || res?.data || {};
      this.setData({ userName: info.name || '' });
    } catch {}

    // 检查昵称引导（节点一）
    this._checkNicknameGuide();
  },

  async _checkNicknameGuide() {
    if (this.data.showNicknameGuide) return;
    try {
      const info = await getOnboardingStatus();
      if (info.forceReset) wx.setStorageSync('ob_step', 0);
      if (wx.getStorageSync('ob_step') >= 1) return;
      if ((info.onboardingStep ?? 0) < 1 && !info.name) {
        this.setData({ showNicknameGuide: true });
      } else {
        wx.setStorageSync('ob_step', info.onboardingStep ?? 0);
      }
    } catch {}
  },

  // ── 昵称引导 ────────────────────────────────────────────────────
  onNicknameInput(e) {
    this.setData({ draftNickname: e.detail.value });
  },
  onShowBirthPicker() {
    this.setData({ birthPickerVisible: true });
  },
  onHideBirthPicker() {
    this.setData({ birthPickerVisible: false });
  },
  onBirthPickerChange(e) {
    const birth = e.detail.value;
    this.setData({ draftBirth: birth, draftStar: getStarFromBirth(birth), birthPickerVisible: false });
  },
  async onSaveNickname() {
    const name = this.data.draftNickname.trim();
    if (!name) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    const { draftBirth } = this.data;
    const star = getStarFromBirth(draftBirth);
    try {
      await updateOnboarding({ name, birth: draftBirth || undefined, star: star || undefined, onboardingStep: 1 });
      wx.setStorageSync('ob_step', 1);
      wx.setStorageSync('show_mbti_guide_on_my', true);
      this.setData({ showNicknameGuide: false, userName: name });
      wx.switchTab({ url: '/pages/my/index' });
    } catch {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },
  async onSkipNickname() {
    await updateOnboarding({ onboardingStep: 1 }).catch(() => {});
    wx.setStorageSync('ob_step', 1);
    this.setData({ showNicknameGuide: false });
  },

  // ── 隐私声明 ─────────────────────────────────────────────────────
  onTogglePrivacy() {
    const next = !this.data.privacyAgreed;
    this.setData({ privacyAgreed: next });
    wx.setStorageSync('privacy_agreed', next ? '1' : '');
  },
  onShowPrivacyDetail() {
    this.setData({ showPrivacyDetail: true });
  },
  onHidePrivacyDetail() {
    this.setData({ showPrivacyDetail: false });
  },

  // ── 上传入口 ─────────────────────────────────────────────────────
  onUploadTap() {
    if (!this.data.privacyAgreed) {
      wx.showToast({ title: '请先同意隐私保护声明', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/release/index' });
  },
});
