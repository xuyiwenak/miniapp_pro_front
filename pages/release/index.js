// pages/release/index.js
import request from '~/api/request';
import { uploadImage } from '~/api/upload';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    originFiles: [],
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
  async handleSuccess(e) {
    const { files, currentFiles } = e.detail;
    // currentFiles 包含本次新增的文件（带临时路径）
    const newlyAdded = currentFiles || [];
    if (!newlyAdded.length) {
      this.setData({ originFiles: files });
      return;
    }
    wx.showLoading({ title: '上传中...' });
    try {
      const uploaded = await Promise.all(
        newlyAdded.map(async (item) => {
          const tempPath = item.url || item.tempFilePath;
          const url = await uploadImage(tempPath);
          return {
            url,
            name: item.name || 'image',
            type: 'image',
          };
        }),
      );
      const others = (files || []).filter((f) => !f.url || !f.url.startsWith('wxfile://'));
      const originFiles = others.concat(uploaded);
      this.setData({ originFiles });
    } catch (err) {
      wx.showToast({ title: '图片上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
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
        title: '上传中',
        icon: 'none',
        desc: this.data.desc || '',
      });
      const res = await request('/work/publish', 'POST', { data: payload });
      if (res.success) {
        wx.showToast({
          title: '上传成功',
          icon: 'none',
          desc: res.data.workId,
        });
      } else {
        wx.showToast({
          title: '上传失败',
          icon: 'none',
        });
      }
    } catch (err) {
      wx.showToast({
        title: '上传失败',
        icon: 'none',
      });
    }
  },
});
