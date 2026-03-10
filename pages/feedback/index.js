import request from '~/api/request';
import useToastBehavior from '~/behaviors/useToast';

Page({
  behaviors: [useToastBehavior],

  data: {
    title: '',
    content: '',
    submitting: false,
    feedbackList: [],
    statusTextMap: {
      pending: '待处理',
      processing: '处理中',
      resolved: '已回复',
    },
  },

  onLoad() {
    this.fetchFeedbackList();
  },

  onTitleChange(e) {
    const { value } = e.detail;
    this.setData({ title: value.slice(0, 30) });
  },

  onContentChange(e) {
    const { value } = e.detail;
    this.setData({ content: value.slice(0, 300) });
  },

  validateForm() {
    const { title, content } = this.data;
    if (!title.trim()) {
      this.onShowToast('#t-toast', '请填写问题标题');
      return false;
    }
    if (!content.trim()) {
      this.onShowToast('#t-toast', '请填写问题描述');
      return false;
    }
    if (title.length > 30) {
      this.onShowToast('#t-toast', '标题最多30个字');
      return false;
    }
    if (content.length > 300) {
      this.onShowToast('#t-toast', '问题描述最多300个字');
      return false;
    }
    return true;
  },

  async onSubmit() {
    if (this.data.submitting) return;
    if (!this.validateForm()) return;

    const { title, content } = this.data;
    this.setData({ submitting: true });

    try {
      await request('/api/feedback', 'POST', {
        data: { title, content },
      });
      this.onShowToast('#t-toast', '提交成功');
      this.setData({
        title: '',
        content: '',
      });
      this.fetchFeedbackList();
    } catch (e) {
      this.onShowToast('#t-toast', '提交失败，请稍后重试');
    } finally {
      this.setData({ submitting: false });
    }
  },

  async fetchFeedbackList() {
    try {
      const res = await request('/api/feedback', 'GET');
      const list = res?.data?.data?.list || res?.data?.list || res?.data || [];
      this.setData({
        feedbackList: list.map((item) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          status: item.status || 'pending',
          reply: item.reply || '',
          createdAt: item.created_at || item.createdAt || '',
        })),
      });
    } catch (e) {
      // 保持静默失败，避免打扰用户
    }
  },
});

