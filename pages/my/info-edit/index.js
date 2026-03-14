import request from '~/api/request';
import { uploadImage } from '~/api/upload';
import { areaList } from './areaData.js';

/** 根据生日 YYYY-MM-DD 计算星座（阳历），仅前端展示用 */
function getStarFromBirth(birth) {
  if (!birth || typeof birth !== 'string') return '';
  const parts = birth.trim().split(/[-/]/);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return '';
  if (month === 12 && day >= 22) return '摩羯座';
  if (month === 1 && day <= 19) return '摩羯座';
  if (month === 1 && day >= 20) return '水瓶座';
  if (month === 2 && day <= 18) return '水瓶座';
  if (month === 2 && day >= 19) return '双鱼座';
  if (month === 3 && day <= 20) return '双鱼座';
  if (month === 3 && day >= 21) return '白羊座';
  if (month === 4 && day <= 19) return '白羊座';
  if (month === 4 && day >= 20) return '金牛座';
  if (month === 5 && day <= 20) return '金牛座';
  if (month === 5 && day >= 21) return '双子座';
  if (month === 6 && day <= 21) return '双子座';
  if (month === 6 && day >= 22) return '巨蟹座';
  if (month === 7 && day <= 22) return '巨蟹座';
  if (month === 7 && day >= 23) return '狮子座';
  if (month === 8 && day <= 22) return '狮子座';
  if (month === 8 && day >= 23) return '处女座';
  if (month === 9 && day <= 22) return '处女座';
  if (month === 9 && day >= 23) return '天秤座';
  if (month === 10 && day <= 23) return '天秤座';
  if (month === 10 && day >= 24) return '天蝎座';
  if (month === 11 && day <= 22) return '天蝎座';
  if (month === 11 && day >= 23) return '射手座';
  if (month === 12 && day <= 21) return '射手座';
  return '';
}

function normalizeStar(star) {
  if (!star || typeof star !== 'string') return '';
  return star.trim().replace('天枰座', '天秤座');
}

Page({
  data: {
    personInfo: {
      name: '',
      gender: 0,
      birth: '',
      address: [],
      introduction: '',
      photos: [],
      image: '',
      star: '',
    },
    genderOptions: [
      {
        label: '男',
        value: 0,
      },
      {
        label: '女',
        value: 1,
      },
      {
        label: '保密',
        value: 2,
      },
    ],
    birthVisible: false,
    birthStart: '1970-01-01',
    birthEnd: '2025-03-01',
    birthTime: 0,
    birthFilter: (type, options) => (type === 'year' ? options.sort((a, b) => b.value - a.value) : options),
    addressText: '',
    addressVisible: false,
    provinces: [],
    cities: [],

    gridConfig: {
      column: 3,
      width: 160,
      height: 160,
    },
  },

  onLoad() {
    this.initAreaData();
    this.getPersonalInfo();
  },

  getPersonalInfo() {
    request('/api/genPersonalInfo')
      .then((res) => {
        const raw = res.data?.data || res.data || {};
        const birth = raw.birth || '';
        const computedStar = getStarFromBirth(birth);
        const rawStar = normalizeStar(raw.star || '');
        const star = rawStar || computedStar;
        const personInfo = {
          name: raw.name || '',
          gender: raw.gender ?? 0,
          birth,
          address: Array.isArray(raw.address) ? raw.address : [],
          introduction: raw.brief || '',
          photos: Array.isArray(raw.photos) ? raw.photos : [],
          image: raw.image || '',
          star,
        };
        this.setData(
          { personInfo },
          () => {
            const { personInfo: p } = this.data;
            if (p.address && p.address[0] != null && p.address[1] != null) {
              this.setData({
                addressText: `${areaList.provinces[p.address[0]] || ''} ${areaList.cities[p.address[1]] || ''}`.trim(),
              });
            }
          },
        );
      })
      .catch(() => {
        this.setData({
          personInfo: {
            name: '',
            gender: 0,
            birth: '',
            address: [],
            introduction: '',
            photos: [],
            image: '',
            star: '',
          },
        });
      });
  },

  getAreaOptions(data, filter) {
    const res = Object.keys(data).map((key) => ({ value: key, label: data[key] }));
    return typeof filter === 'function' ? res.filter(filter) : res;
  },

  getCities(provinceValue) {
    return this.getAreaOptions(
      areaList.cities,
      (city) => `${city.value}`.slice(0, 2) === `${provinceValue}`.slice(0, 2),
    );
  },

  initAreaData() {
    const provinces = this.getAreaOptions(areaList.provinces);
    const cities = this.getCities(provinces[0].value);
    this.setData({ provinces, cities });
  },

  onAreaPick(e) {
    const { column, index } = e.detail;
    const { provinces } = this.data;

    // 更改省份则更新城市列表
    if (column === 0) {
      const cities = this.getCities(provinces[index].value);
      this.setData({ cities });
    }
  },

  showPicker(e) {
    const { mode } = e.currentTarget.dataset;
    this.setData({
      [`${mode}Visible`]: true,
    });
    if (mode === 'address') {
      const cities = this.getCities(this.data.personInfo.address[0]);
      this.setData({ cities });
    }
  },

  hidePicker(e) {
    const { mode } = e.currentTarget.dataset;
    this.setData({
      [`${mode}Visible`]: false,
    });
  },

  onPickerChange(e) {
    const { value, label } = e.detail;
    const { mode } = e.currentTarget.dataset;

    this.setData({
      [`personInfo.${mode}`]: value,
    });
    if (mode === 'birth') {
      const star = getStarFromBirth(value);
      this.setData({ 'personInfo.star': star });
    }
    if (mode === 'address') {
      this.setData({
        addressText: label.join(' '),
      });
    }
  },

  personInfoFieldChange(field, e) {
    const { value } = e.detail;
    this.setData({
      [`personInfo.${field}`]: value,
    });
  },

  onNameChange(e) {
    this.personInfoFieldChange('name', e);
  },

  onGenderChange(e) {
    this.personInfoFieldChange('gender', e);
  },

  onIntroductionChange(e) {
    this.personInfoFieldChange('introduction', e);
  },

  onPhotosRemove(e) {
    const { index } = e.detail;
    const { photos } = this.data.personInfo;

    photos.splice(index, 1);
    this.setData({
      'personInfo.photos': photos,
    });
  },

  async onPhotosSuccess(e) {
    const { files, currentFiles } = e.detail;
    const newlyAdded = currentFiles || [];
    if (!newlyAdded.length) {
      this.setData({
        'personInfo.photos': files,
      });
      return;
    }
    wx.showLoading({ title: '上传中...' });
    try {
      const uploaded = await Promise.all(
        newlyAdded.map(async (item) => {
          const tempPath = item.url || item.tempFilePath;
          const res = await uploadImage(tempPath);
          const url = res && (res.url != null ? res.url : res);
          return {
            url,
            name: item.name || 'image',
            type: 'image',
          };
        }),
      );
      const isTempPath = (u) => !u || u.startsWith('wxfile://') || u.startsWith('http://tmp/');
      const others = (files || []).filter((f) => f.url && !isTempPath(f.url));
      const photos = others.concat(uploaded);
      this.setData({
        'personInfo.photos': photos,
      });
    } catch (err) {
      wx.showToast({ title: '图片上传失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onPhotosDrop(e) {
    const { files } = e.detail;
    this.setData({
      'personInfo.photos': files,
    });
  },

  async onSaveInfo() {
    const { personInfo } = this.data;
    const payload = {
      name: personInfo.name || '',
      gender: personInfo.gender ?? 0,
      birth: personInfo.birth || '',
      address: personInfo.address || [],
      brief: personInfo.introduction || '',
      photos: personInfo.photos || [],
      image: personInfo.image || undefined,
      star: personInfo.star || undefined,
    };
    try {
      await request('/api/savePersonalInfo', 'POST', { data: payload });
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 500);
    } catch (err) {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },
});
