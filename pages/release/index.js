// pages/release/index.js
import request from '~/api/request';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    originFiles: [
      {
        url: '/static/image1.png',
        name: 'uploaded1.png',
        type: 'image',
      },
      {
        url: '/static/image2.png',
        name: 'uploaded2.png',
        type: 'image',
      },
    ],
    gridConfig: {
      column: 4,
      width: 160,
      height: 160,
    },
    config: {
      count: 1,
    },
    tags: ['AI绘画', '版权素材', '原创', '风格灵动'],
    selectedTags: ['AI绘画'],
    desc: '',
  },
  onTagChange(e) {
    const tag = e.currentTarget.dataset.tag;
    const checked = e.detail?.checked ?? false;
    let selectedTags = this.data.selectedTags || [];
    if (checked) {
      if (!selectedTags.includes(tag)) selectedTags = selectedTags.concat(tag);
    } else {
      selectedTags = selectedTags.filter((t) => t !== tag);
    }
    this.setData({ selectedTags });
  },
  handleSuccess(e) {
    const { files } = e.detail;
    this.setData({
      originFiles: files,
    });
  },
  handleRemove(e) {
    const { index } = e.detail;
    const { originFiles } = this.data;
    originFiles.splice(index, 1);
    this.setData({
      originFiles,
    });
  },
  gotoMap() {
    wx.showToast({
      title: '获取当前位置...',
      icon: 'none',
      image: '',
      duration: 1500,
      mask: false,
      success: () => {},
      fail: () => {},
      complete: () => {},
    });
  },
  onDescChange(e) {
    this.setData({
      desc: e.detail.value,
    });
  },
  async saveDraft() {
    try {
      const payload = {
        desc: this.data.desc || '',
        tags: this.data.selectedTags || [],
        images: this.data.originFiles || [],
        status: 'draft',
      };
      await request('/work/publish', 'POST', { data: payload });
      wx.reLaunch({
        url: `/pages/home/index?oper=save`,
      });
    } catch (err) {
      wx.showToast({
        title: '保存草稿失败',
        icon: 'none',
      });
    }
  },
  async release() {
    try {
      const payload = {
        desc: this.data.desc || '',
        tags: this.data.selectedTags || [],
        images: this.data.originFiles || [],
        status: 'published',
      };
      wx.showToast({
        title: '发布中',
        icon: 'none',
        desc: this.data.desc || '',
      });
      const res = await request('/work/publish', 'POST', { data: payload });
      if (res.success) {
        wx.showToast({
          title: '发布成功',
          icon: 'none',
          desc: res.data.workId,
        });
      } else {
        wx.showToast({
          title: '发布失败',
          icon: 'none',
        });
      }
    } catch (err) {
      wx.showToast({
        title: '发布失败',
        icon: 'none',
      });
    }
  },
});
