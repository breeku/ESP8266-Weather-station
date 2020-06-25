import React from 'react';

import {StyleSheet, View} from 'react-native';
import {Text} from 'react-native-elements';

import {connect} from 'react-redux';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const Home = props => {
  const {wifi} = props;
  return (
    <View style={styles.root}>
      <Text h1>Home Screen</Text>
      {wifi ? (
        wifi.wifiName && wifi.wifiName.includes('ESP') ? (
          <Text style={{color: 'green'}}>ESP Detected!</Text>
        ) : (
          <Text style={{color: 'red'}}>Go to settings and connect to ESP</Text>
        )
      ) : (
        <></>
      )}
      <Text>Connected to {wifi.wifiName ? wifi.wifiName : '...'}</Text>
    </View>
  );
};

const mapStateToProps = state => {
  // Redux Store --> Component
  return {
    wifi: state.wifiReducer,
  };
}; // Map Dispatch To Props (Dispatch Actions To Reducers. Reducers Then Modify The Data And Assign It To Your Props)
const mapDispatchToProps = dispatch => {
  // Action
  return {};
}; // Exports

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Home);
