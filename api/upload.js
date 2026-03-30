import config from '~/config';

// 上传结果缓存：hash → { url, cdnUrl, expiresAt }
const _cache = {};
// 进行中的上传：hash → Promise，防止同一文件并发重复上传
const _inFlight = {};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 分钟内同一图片不重复上传

/**
 * 对文件内容做简单哈希（djb2）。
 * 先尝试 wx.getFileInfo（永久文件可用），失败后用 readFile 采样（临时文件也可用）。
 * 任何异常都返回 null 降级为正常上传。
 */
function getFileHash(filePath) {
  return new Promise((resolve) => {
    wx.getFileInfo({
      filePath,
      digestAlgorithm: 'md5',
      success: (res) => resolve(res.digest || null),
      fail: () => {
        // 临时文件走 readFile 采样哈希
        wx.getFileSystemManager().readFile({
          filePath,
          success: (res) => {
            try {
              const bytes = new Uint8Array(res.data);
              // djb2：按步长采样，兼顾速度和分布均匀性
              const step = Math.max(1, Math.floor(bytes.length / 2048));
              let h = 5381;
              for (let i = 0; i < bytes.length; i += step) {
                h = (((h << 5) + h) ^ bytes[i]) >>> 0;
              }
              resolve(h.toString(16) + '_' + bytes.length);
            } catch {
              resolve(null);
            }
          },
          fail: () => resolve(null),
        });
      },
    });
  });
}

function doUpload(tempFilePath) {
  return new Promise((resolve, reject) => {
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

export async function uploadImage(tempFilePath) {
  if (!tempFilePath) {
    throw new Error('empty file path');
  }

  const hash = await getFileHash(tempFilePath);

  if (hash) {
    // 1. 命中缓存 → 直接返回，不上传
    const cached = _cache[hash];
    if (cached && cached.expiresAt > Date.now()) {
      return { url: cached.url, cdnUrl: cached.cdnUrl };
    }

    // 2. 相同文件正在上传中 → 等待复用结果
    if (_inFlight[hash]) {
      return _inFlight[hash];
    }
  }

  // 3. 正常上传
  const uploadPromise = doUpload(tempFilePath).then(
    (result) => {
      if (hash) {
        _cache[hash] = { ...result, expiresAt: Date.now() + CACHE_TTL_MS };
        delete _inFlight[hash];
      }
      return result;
    },
    (err) => {
      if (hash) delete _inFlight[hash];
      throw err;
    },
  );

  if (hash) {
    _inFlight[hash] = uploadPromise;
  }

  return uploadPromise;
}
