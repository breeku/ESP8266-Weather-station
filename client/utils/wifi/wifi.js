import {RNToasty} from 'react-native-toasty';
import WifiManager from 'react-native-wifi-reborn';
import {decryptPassword} from '../encrypt/password';

export const connectToWifi = async credentials => {
  try {
    credentials.password = decryptPassword(credentials.password);
    RNToasty.Info({title: 'Attempting to connect...', duration: 1});
    await WifiManager.connectToProtectedSSID(
      credentials.SSID,
      credentials.password,
      credentials.isWep,
    );
    RNToasty.Success({title: 'Connection success!'});
    return true;
  } catch (e) {
    console.warn(e);
    RNToasty.Error({title: 'Connection failed'});
    return false;
  }
};
