import Message from 'tdesign-miniprogram/message/index';
import request from '~/api/request';

// 获取应用实例
// const app = getApp()

Page({
  data: {
    refreshing: false,
    swiperList: [],
    cardInfo: [],
  },
  // 生命周期
  async onReady() {
    const [cardRes, swiperRes] = await Promise.all([
      request('/home/cards').then((res) => res.data),
      request('/home/swipers').then((res) => res.data),
    ]);

    const cards = Array.isArray(cardRes) ? cardRes : cardRes?.data || [];
    const swipers = Array.isArray(swiperRes) ? swiperRes : swiperRes?.data || [];

    this.setData({
      cardInfo: cards,
      focusCardInfo: cards.slice(0, 3),
      swiperList: swipers,
    });
  },
  onLoad(option) {
    if (option.oper) {
      let content = '';
      if (option.oper === 'release') {
        content = '发布成功';
      } else if (option.oper === 'save') {
        content = '保存成功';
      }
      this.showOperMsg(content);
    }
  },
  async onPullDownRefresh() {
    this.setData({ refreshing: true });
    try {
      const [cardRes, swiperRes] = await Promise.all([
        request('/home/cards').then((res) => res.data),
        request('/home/swipers').then((res) => res.data),
      ]);
      const cards = Array.isArray(cardRes) ? cardRes : cardRes?.data || [];
      const swipers = Array.isArray(swiperRes) ? swiperRes : swiperRes?.data || [];
      this.setData({ cardInfo: cards, swiperList: swipers });
    } catch (err) {
      wx.showToast({ title: '刷新失败', icon: 'none' });
    }
    setTimeout(() => this.setData({ refreshing: false }), 600);
  },
  showOperMsg(content) {
    Message.success({
      context: this,
      offset: [120, 32],
      duration: 4000,
      content,
    });
  },
  goRelease() {
    wx.navigateTo({
      url: '/pages/release/index',
    });
  },
  onCardTap(e) {
    const workId = e.currentTarget.dataset.workId;
    if (!workId) return;
    wx.navigateTo({
      url: '/pages/workDetail/index?workId=' + encodeURIComponent(workId),
    });
  },
});
