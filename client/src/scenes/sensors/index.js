import React, { useState, useCallback } from 'react'

import {
    Dimensions,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    View,
    RefreshControl,
    ActivityIndicator,
} from 'react-native'
import { Text, ButtonGroup } from 'react-native-elements'

import { useFocusEffect } from '@react-navigation/native'

import { connect } from 'react-redux'

import { LineChart } from 'react-native-chart-kit'

import AsyncStorage from '@react-native-community/async-storage'

import { getSensorData } from '_services/sensors'
import { updateTime } from '_services/time'

import { setWifi } from '_redux/actions/wifiReducer'

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

const Sensors = props => {
    const { wifi } = props
    const [data, setData] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [btnIndex, setBtnIndex] = useState(0)
    const buttons = ['5min', '10min', 'All']
    const recentTimestamp =
        data &&
        data.sensors &&
        data.sensors.length > 0 &&
        data.sensors[data.sensors.length - 1].timestamp

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        if (wifi.name && wifi.name.includes('ESP')) {
            const response = await getSensorData()
            setData(response)
        }

        setRefreshing(false)
    }, [wifi, refreshing])

    useFocusEffect(
        useCallback(() => {
            console.log('sensors')
            let active = true

            const getData = async () => {
                if (active) {
                    const response = await getSensorData()
                    setData(response)
                }
            }
            if (!data && wifi.name && wifi.name.includes('ESP')) getData()

            return () => {
                active = false
            }
        }, [wifi]),
    )

    const timeFilter = (d, label) => {
        if (btnIndex === 0) {
            return d.timestamp > recentTimestamp - 300
        } else if (btnIndex === 1) {
            return d.timestamp > recentTimestamp - 600
        } else {
            return !label
                ? true
                : d.timestamp % 86400 === 0 ||
                      data.sensors.findIndex(
                          x => x.timestamp === d.timestamp,
                      ) ===
                          data.sensors.length - 1
        }
    }

    const dateFormat = d => {
        const date = new Date(d.timestamp * 1000)
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
                        onPress={i => setBtnIndex(i)}
                        selectedIndex={btnIndex}
                        buttons={buttons}
                    />
                    {wifi.name && wifi.name.includes('ESP') ? (
                        !data ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : data.sensors.length === 0 ? (
                            <Text>No data found</Text>
                        ) : (
                            <>
                                <Text>
                                    Amount of data points {data.sensors.length}
                                </Text>
                                <Text>File is {data.size / 1000} kb</Text>
                                <Text h4>Temperature</Text>
                                <LineChart
                                    data={{
                                        labels: data.sensors
                                            .filter(x => timeFilter(x, true))
                                            .map(x => dateFormat(x)),
                                        datasets: [
                                            {
                                                data: data.sensors
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
                                <Text h4>Humidity</Text>
                                <LineChart
                                    data={{
                                        labels: data.sensors
                                            .filter(x => timeFilter(x, true))
                                            .map(x => dateFormat(x)),
                                        datasets: [
                                            {
                                                data: data.sensors
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

const mapStateToProps = state => {
    // Redux Store --> Component
    return {
        wifi: state.wifiReducer,
    }
} // Map Dispatch To Props (Dispatch Actions To Reducers. Reducers Then Modify The Data And Assign It To Your Props)
const mapDispatchToProps = dispatch => {
    // Action
    return {
        setWifi: data => dispatch(setWifi(data)),
    }
} // Exports

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Sensors)
