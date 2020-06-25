import React, {useEffect, useState, useCallback} from 'react';

import {
  Dimensions,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  View,
  RefreshControl,
} from 'react-native';
import {Text, Button, ButtonGroup} from 'react-native-elements';

import {connect} from 'react-redux';

import {LineChart} from 'react-native-chart-kit';

import {getSensorData} from '../../utils/sensors/sensors';

import {setWifiName} from '../../redux/actions/wifiReducer';
import {setWifiIP} from '../../redux/actions/wifiReducer';

import WifiManager from 'react-native-wifi-reborn';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: 10,
    marginBottom: 10,
  },
  sensors: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
});

const Sensors = props => {
  const {setWifiName, setWifiIP, settings, wifi} = props;
  const [sensors, setSensors] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [btnIndex, setBtnIndex] = useState(0);
  const buttons = ['5min', '10min', 'All'];
  const recentTimestamp =
    sensors && sensors.length > 0 && sensors[sensors.length - 1].timestamp;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    setSensors(await getSensorData());

    const wifiName = await WifiManager.getCurrentWifiSSID();
    if (wifiName !== wifi.wifiName) {
      setWifiName(wifiName);
      setWifiIP(await WifiManager.getIP());
    }

    setRefreshing(false);
  }, [refreshing]);

  const timeFilter = data => {
    if (btnIndex === 0) {
      return data.timestamp > recentTimestamp - 300000;
    } else if (btnIndex === 1) {
      return data.timestamp > recentTimestamp - 600000;
    } else if (btnIndex === 2) {
      return data.timestamp > 0;
    }
  };

  useEffect(() => {
    if (settings.permissions) {
      const getData = async () => {
        setSensors(await getSensorData());
      };
      if (wifi.wifiName.includes('ESP')) getData();
    }
  }, [wifi]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.sensors}>
          <Text h1>Sensors</Text>
          <ButtonGroup
            onPress={i => setBtnIndex(i)}
            selectedIndex={btnIndex}
            buttons={buttons}
          />
          {wifi.wifiName.includes('ESP') ? (
            sensors ? (
              <>
                <Text>Temperature</Text>
                <LineChart
                  data={{
                    datasets: [
                      {
                        data: sensors
                          .filter(x => timeFilter(x))
                          .map(x => x.temperature),
                      },
                    ],
                  }}
                  fromZero={true}
                  width={Dimensions.get('window').width} // from react-native
                  height={270}
                  yAxisSuffix="C"
                  yAxisInterval={1} // optional, defaults to 1
                  chartConfig={{
                    backgroundColor: '#fcfcfc',
                    backgroundGradientFrom: '#fcfcfc',
                    backgroundGradientTo: '#ebebeb',
                    decimalPlaces: 1, // optional, defaults to 2dp
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: btnIndex === 2 ? '0' : '6',
                      strokeWidth: '2',
                      stroke: '#fff',
                    },
                  }}
                  style={{
                    marginVertical: 16,
                    borderRadius: 16,
                  }}
                />
                <Text>Humidity</Text>
                <LineChart
                  data={{
                    datasets: [
                      {
                        data: sensors
                          .filter(x => timeFilter(x))
                          .map(x => x.humidity),
                      },
                    ],
                  }}
                  fromZero={true}
                  width={Dimensions.get('window').width} // from react-native
                  height={270}
                  yAxisSuffix="%"
                  yAxisInterval={1} // optional, defaults to 1
                  chartConfig={{
                    backgroundColor: '#fcfcfc',
                    backgroundGradientFrom: '#fcfcfc',
                    backgroundGradientTo: '#ebebeb',
                    decimalPlaces: 1, // optional, defaults to 2dp
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: btnIndex === 2 ? '0' : '6',
                      strokeWidth: '2',
                      stroke: '#fff',
                    },
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              </>
            ) : (
              <Text>Loading</Text>
            )
          ) : (
            <Text>ESP not detected</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  // Redux Store --> Component
  return {
    wifi: state.wifiReducer,
    settings: state.settingsReducer,
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
)(Sensors);
