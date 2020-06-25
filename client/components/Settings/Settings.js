import React, {useState, useEffect, useCallback} from 'react';

import {
  StyleSheet,
  View,
  SafeAreaView,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Icon,
  Text,
  ListItem,
  CheckBox,
  Overlay,
  Input,
  Button,
  Slider,
  Divider,
} from 'react-native-elements';

import {connect} from 'react-redux';

import WifiManager from 'react-native-wifi-reborn';
import AsyncStorage from '@react-native-community/async-storage';

import {setWifiName} from '../../redux/actions/wifiReducer';
import {setWifiIP} from '../../redux/actions/wifiReducer';

import {connectToWifi} from '../../utils/wifi/wifi';

import {encryptPassword} from '../../utils/encrypt/password';
import {setFrequency} from '../../utils/frequency/frequency';
import {getFrequency} from '../../utils/frequency/frequency';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: 10,
    marginBottom: 10,
  },
  settings: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
  },
  listItem: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    padding: 2.5,
    margin: 3,
    marginTop: 5,
    marginBottom: 5,
  },
  green: {
    backgroundColor: 'green',
  },
  black: {
    backgroundColor: 'black',
  },
  frequencyInput: {
    width: '50%',
  },
  divider: {
    height: 1,
    marginTop: 28,
    marginBottom: 28,
    backgroundColor: 'black',
  },
});

const Settings = props => {
  const {setWifiIP, setWifiName, settings, wifi} = props;

  const [wifiList, setWifiList] = useState([{}]);
  const [wifiSettingsOverlay, setWifiSettingsOverlay] = useState(false);
  const [wifiPasswordOverlay, setWifiPasswordOverlay] = useState(false);
  const [wifiConnect, setWifiConnect] = useState(null);
  const [wifiPassword, setWifiPassword] = useState('');
  const [autoConnectWifi, setAutoConnectWifi] = useState(
    settings.autoWifi || false,
  );
  const [credentials, setCredentials] = useState(settings.credentials);
  const [updateFrequency, setUpdateFrequency] = useState(0);
  const [updatingFrequency, setUpdatingFrequency] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    setUpdateFrequency((await getFrequency()) / 60000);

    setRefreshing(false);
  }, [refreshing]);

  useEffect(() => {
    const getData = async () => {
      try {
        if (settings.permissions) {
          const getWifiList = await WifiManager.loadWifiList();
          setWifiList(JSON.parse(getWifiList));

          setUpdateFrequency((await getFrequency()) / 60000);
        }
      } catch (e) {
        console.warn(e);
      }
    };
    getData();
  }, []);

  const handleConnectWifi = async d => {
    const data = d || wifiConnect;
    const obj = {
      SSID: data.SSID,
      password: wifiPassword,
      isWep: data.credentials ? true : false,
    };
    const connected = await connectToWifi(obj);
    if (connected) {
      setWifiName(obj.SSID);
      setWifiIP(await WifiManager.getIP());
    }
  };

  const handleAutoWifi = async () => {
    await AsyncStorage.setItem('@wifi_auto', JSON.stringify(!autoConnectWifi));
    setAutoConnectWifi(!autoConnectWifi);
  };

  const handleWifiSettings = async () => {
    try {
      const encryptedPassword = encryptPassword(credentials.password);
      const data = JSON.stringify({
        ...credentials,
        password: encryptedPassword,
      });
      console.log(data);
      await AsyncStorage.setItem('@wifi_settings', data);
    } catch (e) {
      console.warn(e);
    }
  };

  const toggleWifiSettingsOverlay = () =>
    setWifiSettingsOverlay(!wifiSettingsOverlay);

  const toggleWifiPasswordOverlay = async (l = null) => {
    if (l) setWifiConnect(l);
    setWifiPasswordOverlay(!wifiPasswordOverlay);
  };

  const handleFrequencyUpdate = async () => {
    setUpdatingFrequency(true);
    setUpdateFrequency(await setFrequency(updateFrequency * 60000));
    setUpdatingFrequency(false);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <Text h1 style={{textAlign: 'center'}}>
          Settings
        </Text>
        <Divider style={styles.divider} />
        <Text h3 style={{textAlign: 'center'}}>
          Sensors
        </Text>
        <Slider
          value={updateFrequency}
          onValueChange={value => setUpdateFrequency(value)}
          step={0.5}
          minimumValue={1}
          maximumValue={1440}
        />
        <Text>Update frequency (minutes)</Text>
        <Input
          style={styles.frequencyInput}
          keyboardType={'numeric'}
          onChangeText={val =>
            val > 0 && val < 1440 ? setUpdateFrequency(parseInt(val)) : 1
          }>
          {updateFrequency}
        </Input>
        <Button
          containerStyle={{
            width: '50%',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
          title="Update"
          onPress={() => {
            handleFrequencyUpdate();
          }}
          loading={updatingFrequency ? true : false}
        />
        <Divider style={styles.divider} />
        {settings && settings.permissions ? (
          <>
            <Text h3 style={{textAlign: 'center'}}>
              Wifi
            </Text>
            <View style={styles.settings}>
              <CheckBox
                title="Connect automatically"
                checkedIcon="dot-circle-o"
                uncheckedIcon="circle-o"
                checked={autoConnectWifi}
                onPress={handleAutoWifi}
              />
              <Icon
                style={{marginTop: 'auto', marginBottom: 'auto'}}
                type="material-community"
                name="settings"
                onPress={toggleWifiSettingsOverlay}
              />
            </View>
            <Overlay
              isVisible={wifiSettingsOverlay}
              onBackdropPress={toggleWifiSettingsOverlay}>
              <View style={{width: 200}}>
                <CheckBox
                  title="Secure"
                  checkedIcon="dot-circle-o"
                  uncheckedIcon="circle-o"
                  checked={credentials.isWep}
                  onPress={() =>
                    setCredentials({...credentials, isWep: !credentials.isWep})
                  }
                />
                <Input
                  onChangeText={text =>
                    setCredentials({...credentials, SSID: text})
                  }
                  placeholder="SSID"
                />
                {credentials.isWep ? (
                  <Input
                    onChangeText={text =>
                      setCredentials({...credentials, password: text})
                    }
                    placeholder="Password"
                    secureTextEntry={true}
                  />
                ) : (
                  <></>
                )}

                <Button
                  title="Save"
                  onPress={() => {
                    handleWifiSettings();
                    toggleWifiSettingsOverlay();
                  }}
                />
              </View>
            </Overlay>
            {wifiList.map((l, i) => (
              <>
                <ListItem
                  key={i}
                  title={l.SSID}
                  subtitle={l.BSSID}
                  bottomDivider
                  style={[
                    styles.listItem,
                    wifi.wifiName === l.SSID ? styles.green : styles.black,
                  ]}
                  onPress={() =>
                    wifi.wifiName !== l.SSID
                      ? l.capabilities
                        ? toggleWifiPasswordOverlay(l)
                        : handleConnectWifi(l)
                      : null
                  }
                />
              </>
            ))}
            <Overlay
              isVisible={wifiPasswordOverlay}
              onBackdropPress={toggleWifiPasswordOverlay}>
              <View style={{width: 200}}>
                <Input
                  onChangeText={text => setWifiPassword(text)}
                  placeholder="Password"
                  secureTextEntry={true}
                />
                <Button
                  title="Connect"
                  onPress={() => {
                    handleConnectWifi();
                    toggleWifiPasswordOverlay();
                  }}
                />
              </View>
            </Overlay>
          </>
        ) : (
          <>
            <Text>Missing permissions</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  // Redux Store --> Component
  return {
    settings: state.settingsReducer,
    wifi: state.wifiReducer,
  };
}; // Map Dispatch To Props (Dispatch Actions To Reducers. Reducers Then Modify The Data And Assign It To Your Props)
const mapDispatchToProps = dispatch => {
  // Action
  return {
    setWifiName: data => dispatch(setWifiName(data)),
    setWifiIP: data => dispatch(setWifiIP(data)),
  };
}; // Exports

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Settings);
