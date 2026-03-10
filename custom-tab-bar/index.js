Component({
  data: {
    value: '',
  },
  lifetimes: {
    ready() {
      const pages = getCurrentPages();
      const curPage = pages[pages.length - 1];
      if (curPage) {
        const nameRe = /pages\/(\w+)\/index/.exec(curPage.route);
        if (nameRe && nameRe[1]) {
          this.setData({
            value: nameRe[1],
          });
        }
      }
    },
  },
  methods: {
    handleChange(e) {
      const { value } = e.currentTarget.dataset;
      wx.switchTab({ url: `/pages/${value}/index` });
    },
    goRelease() {
      wx.navigateTo({ url: '/pages/release/index' });
    },
  },
});
