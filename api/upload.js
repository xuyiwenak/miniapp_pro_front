import config from '~/config';

const { baseUrl } = config;

export function uploadImage(tempFilePath) {
  return new Promise((resolve, reject) => {
    if (!tempFilePath) {
      reject(new Error('empty file path'));
      return;
    }

    wx.compressImage({
      src: tempFilePath,
      quality: 80,
      success: (compressRes) => {
        const filePath = compressRes.tempFilePath || tempFilePath;
        const tokenString = wx.getStorageSync('access_token');
        const header = {};
        if (tokenString) {
          header.Authorization = `Bearer ${tokenString}`;
        }
        wx.uploadFile({
          url: `${baseUrl}/api/upload`,
          filePath,
          name: 'file',
          header,
          success(res) {
            try {
              const data = JSON.parse(res.data || '{}');
              if (data && data.code === 200 && data.data && data.data.url) {
                resolve(data.data.url);
              } else if (data && data.url) {
                resolve(data.url);
              } else {
                reject(data);
              }
            } catch (e) {
              reject(e);
            }
          },
          fail(err) {
            reject(err);
          },
        });
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

