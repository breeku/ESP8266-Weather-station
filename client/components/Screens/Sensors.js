import React, {useEffect, useState, useCallback} from 'react'

import {
    Dimensions,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    View,
    RefreshControl,
    ActivityIndicator,
} from 'react-native'
import {Text, Button, ButtonGroup} from 'react-native-elements'

import {connect} from 'react-redux'

import {LineChart} from 'react-native-chart-kit'

import AsyncStorage from '@react-native-community/async-storage'

import {getSensorData} from '../../utils/sensors/sensors'
import {updateTime, TIMEZONE_OFFSET} from '../../utils/time/time'

import {setWifi} from '../../redux/actions/wifiReducer'

import {getWifiName} from '../../utils/wifi/wifi'

import WifiManager from 'react-native-wifi-reborn'

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
})

const Sensors = (props) => {
    const {settings, wifi} = props
    const [sensors, setSensors] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [btnIndex, setBtnIndex] = useState(0)
    const buttons = ['5min', '10min', 'All']
    const recentTimestamp =
        sensors && sensors.length > 0 && sensors[sensors.length - 1].timestamp

    const onRefresh = useCallback(async () => {
        if (settings.permissions) {
            setRefreshing(true)

            if (wifi.name && wifi.name.includes('ESP'))
                setSensors(await getSensorData())

            setRefreshing(false)
        }
    }, [refreshing])

    const timeFilter = (data, label) => {
        if (btnIndex === 0) {
            return data.timestamp > recentTimestamp - 300
        } else if (btnIndex === 1) {
            return data.timestamp > recentTimestamp - 600
        } else {
            return !label
                ? true
                : data.timestamp % 86400 === 0 ||
                      sensors.findIndex(
                          (x) => x.timestamp === data.timestamp,
                      ) ===
                          sensors.length - 1
        }
    }

    const dateFormat = (data) => {
        const date = new Date(data.timestamp * 1000)
        if (btnIndex === 0) {
            return (
                date.getUTCHours() +
                ':' +
                ('0' + date.getUTCMinutes()).slice(-2)
            )
        } else if (btnIndex === 1) {
            return (
                date.getUTCHours() +
                ':' +
                ('0' + date.getUTCMinutes()).slice(-2)
            )
        } else {
            return date
        }
    }

    useEffect(() => {
        if (settings.permissions) {
            const getData = async () => {
                let sensorsTime =
                    JSON.parse(await AsyncStorage.getItem('@sensors_time')) ||
                    null

                if (!sensorsTime) {
                    console.log('sensors have not been initialized!')
                    sensorsTime = await updateTime()
                    await AsyncStorage.setItem(
                        '@sensors_time',
                        JSON.stringify(sensorsTime),
                    )
                }
                if (sensorsTime) {
                    setSensors(await getSensorData())
                }
            }
            if (wifi.name && wifi.name.includes('ESP')) getData()
        }
    }, [wifi])

    return (
        <SafeAreaView style={styles.root}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }>
                <View style={styles.sensors}>
                    <Text h1>Sensors</Text>
                    <ButtonGroup
                        onPress={(i) => setBtnIndex(i)}
                        selectedIndex={btnIndex}
                        buttons={buttons}
                    />
                    {wifi.name && wifi.name.includes('ESP') ? (
                        !sensors ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : sensors.length === 0 ? (
                            <Text>No data found</Text>
                        ) : (
                            <>
                                <Text>Temperature</Text>
                                <LineChart
                                    data={{
                                        labels: sensors
                                            .filter((x) => timeFilter(x, true))
                                            .map((x) => dateFormat(x)),
                                        datasets: [
                                            {
                                                data: sensors
                                                    .filter((x) =>
                                                        timeFilter(x),
                                                    )
                                                    .map((x) => x.temperature),
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
                                        color: (opacity = 1) =>
                                            `rgba(0, 0, 0, ${opacity})`,
                                        labelColor: (opacity = 1) =>
                                            `rgba(0, 0, 0, ${opacity})`,
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
                                        labels: sensors
                                            .filter((x) => timeFilter(x, true))
                                            .map((x) => dateFormat(x)),
                                        datasets: [
                                            {
                                                data: sensors
                                                    .filter((x) =>
                                                        timeFilter(x),
                                                    )
                                                    .map((x) => x.humidity),
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
                                        color: (opacity = 1) =>
                                            `rgba(0, 0, 0, ${opacity})`,
                                        labelColor: (opacity = 1) =>
                                            `rgba(0, 0, 0, ${opacity})`,
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
                        )
                    ) : (
                        <Text>ESP not detected</Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const mapStateToProps = (state) => {
    // Redux Store --> Component
    return {
        wifi: state.wifiReducer,
        settings: state.settingsReducer,
    }
} // Map Dispatch To Props (Dispatch Actions To Reducers. Reducers Then Modify The Data And Assign It To Your Props)
const mapDispatchToProps = (dispatch) => {
    // Action
    return {
        setWifi: (data) => dispatch(setWifi(data)),
    }
} // Exports

export default connect(mapStateToProps, mapDispatchToProps)(Sensors)
