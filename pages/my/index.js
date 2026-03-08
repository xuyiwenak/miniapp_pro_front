import request from '~/api/request';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    service: [],
    personalInfo: {},
    gridList: [
      {
        name: '全部发布',
        icon: 'root-list',
        type: 'all',
        url: '',
      },
      {
        name: '审核中',
        icon: 'search',
        type: 'progress',
        url: '',
      },
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
    ],

    settingList: [
      { name: '联系客服', icon: 'service', type: 'service' },
      { name: '设置', icon: 'setting', type: 'setting', url: '/pages/setting/index' },
    ],
  },

  onLoad() {
    this.getServiceList();
  },

  async onShow() {
    const Token = wx.getStorageSync('access_token');
    const personalInfo = await this.getPersonalInfo();

    if (Token) {
      this.setData({
        isLoad: true,
        personalInfo,
      });
    }
  },

  getServiceList() {
    request('/api/getServiceList').then((res) => {
      const { service } = res.data.data;
      this.setData({ service });
    });
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
    const { name, url } = e.currentTarget.dataset.data;
    if (url) return;
    this.onShowToast('#t-toast', name);
  },
});
