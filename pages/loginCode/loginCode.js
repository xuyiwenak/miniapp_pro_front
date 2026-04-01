import request from '~/api/request';
import { SMS_COUNTDOWN_SECONDS, SMS_COUNTDOWN_TICK_MS } from '~/config/constants';

Page({
  data: {
    phoneNumber: '',
    sendCodeCount: SMS_COUNTDOWN_SECONDS,
    verifyCode: '',
  },

  timer: null,

  onLoad(options) {
    const { phoneNumber } = options;
    if (phoneNumber) {
      this.setData({ phoneNumber });
    }
    this.countDown();
  },

  onVerifycodeChange(e) {
    this.setData({
      verifyCode: e.detail.value,
    });
  },

  countDown() {
    this.setData({ sendCodeCount: SMS_COUNTDOWN_SECONDS });
    this.timer = setInterval(() => {
      if (this.data.sendCodeCount <= 0) {
        this.setData({ isSend: false, sendCodeCount: 0 });
        clearInterval(this.timer);
      } else {
        this.setData({ sendCodeCount: this.data.sendCodeCount - 1 });
      }
    }, SMS_COUNTDOWN_TICK_MS);
  },

  sendCode() {
    if (this.data.sendCodeCount === 0) {
      this.countDown();
    }
  },

  async login() {
    const res = await request('/login/postCodeVerify', 'get', { code: this.data.verifyCode });
    if (res.success) {
      await wx.setStorageSync('access_token', res.data.token);
      wx.switchTab({
        url: `/pages/my/index`,
      });
    }
  },
});
