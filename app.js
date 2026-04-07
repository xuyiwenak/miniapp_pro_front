// app.js
import config from './config';
import request from './api/request';

App({
  onLaunch() {
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate(() => {});

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        },
      });
    });

    // 已有 token 则跳过自动登录
    if (wx.getStorageSync('access_token')) return;

    // 静默微信登录：wx.login() 不需要用户操作
    this._autoLoginPromise = wx.login()
      .then(({ code }) => {
        if (!code) throw new Error('no code');
        return request('/login/wxLogin', 'POST', { data: { code } });
      })
      .then((res) => {
        if (res?.data?.token) {
          wx.setStorageSync('access_token', res.data.token);
        }
      })
      .catch(() => {
        // 静默登录失败时不打扰用户，onShow 会兜底跳登录页
      });
  },

  async onShow() {
    // 等待自动登录完成后再判断是否需要跳登录页
    if (this._autoLoginPromise) {
      await this._autoLoginPromise;
      this._autoLoginPromise = null;
    }
    const token = wx.getStorageSync('access_token');
    const pages = getCurrentPages();
    const curPage = pages[pages.length - 1];
    const route = curPage?.route || '';
    const isLoginPage = route === 'pages/login/login' || route.startsWith('pages/login/');
    if (!token && !isLoginPage) {
      wx.navigateTo({
        url: '/pages/login/login',
      });
    }
  },

  globalData: {
    userInfo: null,
  },
});
