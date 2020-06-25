import {RNToasty} from 'react-native-toasty';
import WifiManager from 'react-native-wifi-reborn';

export const getSensorData = async () => {
  if ((await WifiManager.getIP()) === '0.0.0.0') {
    RNToasty.Error({title: 'Wifi is not ready'});
    return;
  }
  try {
    const response = await fetch('http://192.168.4.1/sensors/');
    const json = await response.json();
    return json.sensors;
  } catch (e) {
    RNToasty.Error({title: 'Connection failed'});
    console.warn(e);
  }
};
