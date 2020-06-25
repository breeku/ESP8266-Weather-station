import {RNToasty} from 'react-native-toasty';
import WifiManager from 'react-native-wifi-reborn';

export const getFrequency = async () => {
  if ((await WifiManager.getIP()) === '0.0.0.0') {
    RNToasty.Error({title: 'Wifi is not ready'});
    return;
  }
  try {
    const response = await fetch('http://192.168.4.1/frequency/');
    const json = await response.json();
    return json.interval;
  } catch (e) {
    RNToasty.Error({title: 'Connection failed'});
    console.warn(e);
  }
};

export const setFrequency = async frequency => {
  if ((await WifiManager.getIP()) === '0.0.0.0') {
    RNToasty.Error({title: 'Wifi is not ready'});
    return;
  }
  try {
    await fetch('http://192.168.4.1/frequency/?val=' + frequency, {
      method: 'POST',
    });
    RNToasty.Success({title: 'Update success!'});
  } catch (e) {
    RNToasty.Error({title: 'Update failed'});
    console.warn(e);
  }
};
