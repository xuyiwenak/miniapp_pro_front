import Message from 'tdesign-miniprogram/message/index';
import request from '~/api/request';
import { PULL_REFRESH_RESET_DELAY_MS } from '~/config/constants';

Page({
  data: {
    refreshing: false,
    cardInfo: [],
  },
  async onReady() {
    const cardRes = await request('/home/cards').then((res) => res.data);
    const cards = Array.isArray(cardRes) ? cardRes : cardRes?.data || [];
    this.setData({ cardInfo: cards });
  },
  async onLoad(option) {
    if (option.oper) {
      let content = '';
      if (option.oper === 'release') content = '上传成功';
      else if (option.oper === 'save') content = '保存成功';
      this.showOperMsg(content);
    }
  },
  async onShow() {},
  async onPullDownRefresh() {
    this.setData({ refreshing: true });
    try {
      const cardRes = await request('/home/cards').then((res) => res.data);
      const cards = Array.isArray(cardRes) ? cardRes : cardRes?.data || [];
      this.setData({ cardInfo: cards });
    } catch {
      wx.showToast({ title: '刷新失败', icon: 'none' });
    }
    setTimeout(() => this.setData({ refreshing: false }), PULL_REFRESH_RESET_DELAY_MS);
  },
  showOperMsg(content) {
    Message.success({
      context: this,
      offset: [120, 32],
      duration: 4000,
      content,
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
