 const PROD_BASE_URL = 'https://autorecordarchery.xyz';
 // const DEV_BASE_URL = 'https://autorecordarchery.xyz';
 const DEV_BASE_URL = 'http://192.168.3.24:41003'; // 真机模拟环境

function getEnvVersion() {
  try {
    const accountInfo = wx.getAccountInfoSync();
    return accountInfo?.miniProgram?.envVersion || 'release';
  } catch (e) {
    return 'release';
  }
}

export default {
  isMock: false,
  get baseUrl() {
    return getEnvVersion() === 'develop' ? DEV_BASE_URL : PROD_BASE_URL;
  },
};
