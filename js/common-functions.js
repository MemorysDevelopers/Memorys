/**
 * 指定した数のうちのランダム値を取得する
 * @param {ランダム対象の数値個数} rundomCount 
 * @returns ランダム数値
 */
function GetRundomNumber(rundomCount) {
  return Math.floor(Math.random() * rundomCount);
}

/**
 * 値が無い場合を判定する
 * @param {判定対象オブジェクト} object
 * @returns 判定結果
 */
function IsEmpty(object) {
  return (object === undefined || object === '');
}

/**
 * デバイス情報を取得する
 * @returns デバイス情報
 */
function GetDeviceInfo(object) {
  let deviceInfo = {};
  deviceInfo['UserAgent'] = navigator.userAgent;

  // デバイス種別を判定する
  deviceInfo['DeviceType'] = (navigator.userAgent.indexOf('Mobi') === -1) ? 'PC' : 'SP';
  
  // OSを判定する
  let osType = '';
  if (deviceInfo.DeviceType == 'SP') {
    if (navigator.userAgent.indexOf('Android') != -1) {
      osType = 'Android';
    
    } else {
  
      osType = 'iOS';
    }
  }
  deviceInfo['OsType'] = osType;

  return deviceInfo;
}