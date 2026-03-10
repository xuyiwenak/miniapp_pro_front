import request from '~/api/request';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    personalInfo: {},
    gridList: [
      {
        name: '已发布',
        icon: 'upload',
        type: 'published',
        url: '',
      },
      {
        name: '草稿箱',
        icon: 'file-copy',
        type: 'draft',
        url: '',
      },
      {
        name: 'AI已分析',
        icon: 'chart-radar',
        type: 'healing',
        url: '/pages/ai-list/index',
      },
      {
        name: '问题反馈',
        icon: 'service',
        type: 'service',
        url: '/pages/feedback/index',
      },
    ],

    settingList: [
      { name: '退出登录', icon: 'poweroff', type: 'logout', url: '' },
    ],
  },

  async onShow() {
    const Token = wx.getStorageSync('access_token');
    if (!Token) {
      this.setData({
        isLoad: false,
        personalInfo: {},
      });
      return;
    }
    try {
      const personalInfo = await this.getPersonalInfo();
      this.setData({
        isLoad: true,
        personalInfo,
      });
    } catch {
      // 如果请求失败（例如 token 失效），视为未登录状态
      this.setData({
        isLoad: false,
        personalInfo: {},
      });
    }
  },

  async getPersonalInfo() {
    const info = await request('/api/genPersonalInfo').then((res) => res.data.data);
    return info;
  },

  onLogin(e) {
    wx.navigateTo({
      url: '/pages/login/login',
    });
  },

  onNavigateTo() {
    wx.navigateTo({ url: `/pages/my/info-edit/index` });
  },

  onAvatarTap() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: tempPath,
          encoding: 'base64',
          success: (readRes) => {
            const base64 = readRes.data;
            const ext = (tempPath.toLowerCase().endsWith('.png') ? 'png' : 'jpeg');
            const dataUrl = `data:image/${ext};base64,${base64}`;
            wx.showLoading({ title: '上传中...' });
            request('/api/uploadAvatar', 'POST', { data: { image: dataUrl } })
              .then((uploadRes) => {
                const url = uploadRes.data?.url || uploadRes.url;
                if (!url) {
                  wx.hideLoading();
                  wx.showToast({ title: '上传失败', icon: 'none' });
                  return;
                }
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
                return request('/api/savePersonalInfo', 'POST', { data: payload });
              })
              .then((saveRes) => {
                wx.hideLoading();
                const info = saveRes?.data?.data || saveRes?.data || saveRes;
                if (info) {
                  this.setData({ personalInfo: info });
                  wx.showToast({ title: '头像已更新', icon: 'success' });
                } else {
                  wx.showToast({ title: '保存成功', icon: 'success' });
                }
              })
              .catch(() => {
                wx.hideLoading();
                wx.showToast({ title: '上传或保存失败', icon: 'none' });
              });
          },
          fail: () => {
            wx.showToast({ title: '读取图片失败', icon: 'none' });
          },
        });
      },
    });
  },

  onEleClick(e) {
    const { name, url, type } = e.currentTarget.dataset.data;
    if (type === 'published') {
      wx.navigateTo({ url: '/pages/work-list/index?mode=published' });
      return;
    }
    if (type === 'draft') {
      wx.navigateTo({ url: '/pages/work-list/index?mode=draft' });
      return;
    }
    if (type === 'healing') {
      wx.navigateTo({ url: '/pages/ai-list/index' });
      return;
    }
    if (type === 'service') {
      wx.navigateTo({ url: '/pages/feedback/index' });
      return;
    }
    if (type === 'logout') {
      // 调用后端注销当前 token
      const token = wx.getStorageSync('access_token');
      if (token) {
        request('/login/logout', 'POST').catch(() => {
          // 忽略后端错误，继续执行前端退出流程
        });
      }
      wx.removeStorageSync('access_token');
      this.setData({
        isLoad: false,
        personalInfo: {},
      });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    if (url) {
      wx.navigateTo({ url });
      return;
    }
    this.onShowToast('#t-toast', name);
  },
});
