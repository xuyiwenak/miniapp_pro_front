import request from '~/api/request';

Page({
  data: {
    isCheck: false,
    isSubmit: false,
    isPasswordLogin: false,
    passwordInfo: {
      account: '',
      password: '',
    },
    radioValue: '',
  },

  /* 自定义功能函数 */
  changeSubmit() {
    if (this.data.isPasswordLogin) {
      if (this.data.passwordInfo.account !== '' && this.data.passwordInfo.password !== '' && this.data.isCheck) {
        this.setData({ isSubmit: true });
      } else {
        this.setData({ isSubmit: false });
      }
    } else {
      // 微信登录模式下仅需勾选协议即可提交
      this.setData({ isSubmit: this.data.isCheck });
    }
  },

  // 用户协议选择变更
  onCheckChange(e) {
    const { value } = e.detail;
    this.setData({
      radioValue: value,
      isCheck: value === 'agree',
    });
    this.changeSubmit();
  },

  onAccountChange(e) {
    this.setData({ passwordInfo: { ...this.data.passwordInfo, account: e.detail.value } });
    this.changeSubmit();
  },

  onPasswordChange(e) {
    this.setData({ passwordInfo: { ...this.data.passwordInfo, password: e.detail.value } });
    this.changeSubmit();
  },

  // 切换登录方式
  changeLogin() {
    this.setData({ isPasswordLogin: !this.data.isPasswordLogin, isSubmit: false });
  },

  async wxLogin() {
    try {
      const loginRes = await wx.login();
      const code = loginRes.code;
      if (!code) {
        wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
        return;
      }
      const res = await request('/login/wxLogin', 'POST', { data: { code } });
      if (res?.success && res?.data?.isNewUser) {
        await wx.setStorageSync('temp_token', res.data.tempToken);
        wx.navigateTo({
          url: '/pages/login/bindChoice',
        });
        return;
      }
      if (res?.success && res?.data?.token) {
        await wx.setStorageSync('access_token', res.data.token);
        wx.removeStorageSync('temp_token');
        wx.switchTab({
          url: '/pages/upload/index',
        });
        return;
      }
      wx.showToast({ title: '微信登录失败', icon: 'none' });
    } catch (err) {
      const msg = err?.message || err?.errmsg || '';
      if (msg && msg.includes('WeChat config not set')) {
        wx.showToast({ title: '请先配置微信 appId/appSecret', icon: 'none' });
        return;
      }
      wx.showToast({ title: '微信登录异常', icon: 'none' });
    }
  },

  async register() {
    if (!this.data.isPasswordLogin) {
      // 只在密码登录模式下允许注册
      this.setData({ isPasswordLogin: true });
      return;
    }
    const { account, password } = this.data.passwordInfo;
    if (!account || !password || !this.data.isCheck) {
      wx.showToast({ title: '请填写账号、密码并勾选协议', icon: 'none' });
      return;
    }
    try {
      const res = await request('/login/postPasswordRegister', 'POST', {
        data: { account, password },
      });
      if (res.success) {
        await wx.setStorageSync('access_token', res.data.token);
        wx.switchTab({
          url: '/pages/upload/index',
        });
      }
    } catch (err) {
      wx.showToast({ title: '注册失败', icon: 'none' });
    }
  },

  async login() {
    if (this.data.isPasswordLogin) {
      const res = await request('/login/postPasswordLogin', 'post', { data: this.data.passwordInfo });
      if (res.success) {
        await wx.setStorageSync('access_token', res.data.token);
        wx.switchTab({
          url: `/pages/upload/index`,
        });
      }
    }
  },
});
