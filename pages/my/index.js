import request from '~/api/request';
import { uploadImage } from '~/api/upload';
import useToastBehavior from '~/behaviors/useToast';
import { MBTI_META } from '~/pages/mbti/mbtiConfig';

const STAR_EMOJI_MAP = {
  白羊座: '♈', 金牛座: '♉', 双子座: '♊', 巨蟹座: '♋',
  狮子座: '♌', 处女座: '♍', 天秤座: '♎', 天蝎座: '♏',
  射手座: '♐', 摩羯座: '♑', 水瓶座: '♒', 双鱼座: '♓',
};

Page({
  behaviors: [useToastBehavior],

  data: {
    isLoad: false,
    personalInfo: {},
    gridList: [
      {
        name: '已上传',
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
        name: '已分析',
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
    if (info && info.star) {
      info.starEmoji = STAR_EMOJI_MAP[info.star] || '';
    }
    if (info && info.mbti) {
      info.mbtiEmoji = (MBTI_META[info.mbti] && MBTI_META[info.mbti].emoji) || '';
    }
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

  onMbtiTap() {
    wx.showModal({
      title: 'MBTI 人格测试',
      content: '开始 MBTI 人格测试？共 60 题，约需 5 分钟。',
      confirmText: '开始',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/mbti/index' });
        }
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
          const url = await uploadImage(tempPath);
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
        } catch (err) {
          wx.showToast({ title: '上传或保存失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
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
