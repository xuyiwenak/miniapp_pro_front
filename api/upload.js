import config from '~/config';

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
          url: `${config.baseUrl}/api/upload`,
          filePath,
          name: 'file',
          header,
          success(res) {
            try {
              const data = JSON.parse(res.data || '{}');
              const body = (data && data.data) || data;
              const url = (body && body.url) || (data && data.url);
              if (url) {
                resolve({
                  url,
                  cdnUrl: (body && body.cdnUrl) || url,
                });
              } else {
                const code = (data && data.code) || 401;
                if (code === 401) {
                  reject({ code: 401, message: '请先登录' });
                } else {
                  reject(data || new Error('upload response missing url'));
                }
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

