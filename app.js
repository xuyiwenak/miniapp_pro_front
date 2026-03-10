// app.js
import config from './config';
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
  },
  onShow() {
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
