// pages/release/index.js
import request from '~/api/request';
import { uploadImage } from '~/api/upload';
import config from '~/config';

function toPreviewUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = (config && config.baseUrl) || '';
  return base ? `${base.replace(/\/+$/, '')}${url.startsWith('/') ? url : '/' + url}` : url;
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    originFiles: [],
    gridConfig: {
      column: 1,
      width: 160,
      height: 160,
    },
    config: {
      count: 1,
    },
    tags: ['绘画', '版权素材', '原创', '风格灵动'],
    selectedTags: ['绘画'],
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
    const { files, currentFiles } = e.detail || {};
    // TDesign 有时只传 files 不传 currentFiles，用”无 storedUrl 的项”视为本次新选待上传
    let newlyAdded =
      (currentFiles && currentFiles.length) > 0
        ? currentFiles
        : (files || []).filter((f) => !f.storedUrl);
    if (!newlyAdded.length) {
      this.setData({ originFiles: (files || []).filter((f) => f.storedUrl) });
      return;
    }
    // 每次只允许上传一张
    if (newlyAdded.length > 1) {
      wx.showModal({
        title: '提示',
        content: '每次只能上传一张图片',
        showCancel: false,
        confirmText: '知道了',
      });
      newlyAdded = newlyAdded.slice(0, 1);
    }
    wx.showLoading({ title: '上传中...' });
    try {
      const uploaded = await Promise.all(
        newlyAdded.map(async (item) => {
          const localPath = item.url || item.tempFilePath;
          const { url, cdnUrl } = await uploadImage(localPath);
          const previewUrl = toPreviewUrl(cdnUrl || url);
          return {
            url: previewUrl,
            storedUrl: url,
            name: item.name || 'image',
            type: 'image',
          };
        }),
      );
      // 保留已存储的文件，再合并本次上传，总数截断为 1
      const others = (files || []).filter((f) => f.storedUrl);
      this.setData({ originFiles: others.concat(uploaded).slice(0, 1) });
    } catch (err) {
      const msg = (err && err.code === 401) ? '请先登录' : '图片上传失败';
      wx.showToast({ title: msg, icon: 'none' });
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
  getUploadedImageUrls() {
    return (this.data.originFiles || [])
      .filter((f) => f.storedUrl)
      .map((f) => ({
        url: f.storedUrl,
        name: f.name || 'image',
        type: f.type || 'image',
      }));
  },
  async saveDraft() {
    try {
      const images = this.getUploadedImageUrls();
      if (!this.data.desc && !images.length) {
        wx.showToast({ title: '请添加描述或图片', icon: 'none' });
        return;
      }
      const payload = {
        desc: this.data.desc || '',
        tags: this.data.selectedTags || [],
        images,
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
    const token = wx.getStorageSync('access_token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    try {
      const images = this.getUploadedImageUrls();
      if (!this.data.desc && !images.length) {
        wx.showToast({ title: '请添加描述或图片后再发布', icon: 'none' });
        return;
      }
      const payload = {
        desc: this.data.desc || '',
        tags: this.data.selectedTags || [],
        images,
        status: 'published',
      };
      wx.showLoading({ title: '发布中...' });
      const res = await request('/work/publish', 'POST', { data: payload });
      wx.hideLoading();
      if (res && (res.success || res.data)) {
        wx.showToast({ title: '发布成功', icon: 'success', duration: 1500 });
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/work-list/index' });
        }, 1500);
      } else {
        wx.showToast({ title: '发布失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      const code = err && (err.code ?? err.data?.code);
      const msg = code === 401 ? '请先登录' : ((err && err.message) || (err && err.data && err.data.message) || '发布失败');
      wx.showToast({ title: msg, icon: 'none' });
    }
  },
});
