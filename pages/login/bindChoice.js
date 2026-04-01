import request from '~/api/request';

Page({
  data: {
    mode: 'choice', // choice | bind
    account: '',
    password: '',
    loading: false,
  },

  onShow() {
    const tempToken = wx.getStorageSync('temp_token');
    if (!tempToken) {
      // 没有临时 token，回登录页
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  toBindMode() {
    this.setData({ mode: 'bind' });
  },

  backToChoice() {
    this.setData({ mode: 'choice' });
  },

  onAccountChange(e) {
    this.setData({ account: e.detail.value });
  },

  onPasswordChange(e) {
    this.setData({ password: e.detail.value });
  },

  async createNewAccount() {
    if (this.data.loading) return;
    const tempToken = wx.getStorageSync('temp_token');
    if (!tempToken) {
      wx.showToast({ title: '临时凭证已过期，请重新微信登录', icon: 'none' });
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await request('/login/wxAutoRegister', 'POST', { data: { tempToken } });
      if (res?.success && res?.data?.token) {
        await wx.setStorageSync('access_token', res.data.token);
        wx.removeStorageSync('temp_token');
        wx.switchTab({ url: '/pages/upload/index' });
        return;
      }
      wx.showToast({ title: res?.message || '创建账号失败', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: err?.message || '创建账号失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async bindExistingAccount() {
    if (this.data.loading) return;
    const tempToken = wx.getStorageSync('temp_token');
    const { account, password } = this.data;
    if (!tempToken) {
      wx.showToast({ title: '临时凭证已过期，请重新微信登录', icon: 'none' });
      wx.redirectTo({ url: '/pages/login/login' });
      return;
    }
    if (!account || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const res = await request('/login/bindWechat', 'POST', { data: { tempToken, account, password } });
      if (res?.success && res?.data?.token) {
        await wx.setStorageSync('access_token', res.data.token);
        wx.removeStorageSync('temp_token');
        wx.switchTab({ url: '/pages/upload/index' });
        return;
      }
      wx.showToast({ title: res?.message || '绑定失败', icon: 'none' });
    } catch (err) {
      wx.showToast({ title: err?.message || '绑定失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
});

