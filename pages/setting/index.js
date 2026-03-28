import request from '~/api/request';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],
  data: {
    menuData: [
      [
        { title: '通用设置', url: '', icon: 'app', type: '' },
        { title: '通知设置', url: '', icon: 'notification', type: '' },
      ],
      [
        { title: '账号安全', url: '', icon: 'secured', type: '' },
        { title: '隐私', url: '', icon: 'info-circle', type: '' },
      ],
      [
        { title: '问题反馈', url: '/pages/feedback/index', icon: 'service', type: 'service' },
        { title: '退出登录', url: '', icon: 'poweroff', type: 'logout' },
      ],
    ],
  },

  onEleClick(e) {
    const { title, url, type } = e.currentTarget.dataset.data;

    if (type === 'logout') {
      wx.showModal({
        title: '退出登录',
        content: '确定要退出当前账号吗？',
        confirmText: '退出',
        confirmColor: '#FF4D4F',
        cancelText: '取消',
        success: (res) => {
          if (!res.confirm) return;
          const token = wx.getStorageSync('access_token');
          if (token) {
            request('/login/logout', 'POST').catch(() => {});
          }
          wx.removeStorageSync('access_token');
          wx.navigateTo({ url: '/pages/login/login' });
        },
      });
      return;
    }

    if (type === 'service' || url) {
      wx.navigateTo({ url: url || '/pages/feedback/index' });
      return;
    }

    this.onShowToast('#t-toast', title);
  },
});
