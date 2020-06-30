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
import { Text } from 'react-native-elements'

import { useFocusEffect } from '@react-navigation/native'

import { connect } from 'react-redux'

import { LineChart } from 'react-native-chart-kit'

import CalendarPicker from 'react-native-calendar-picker'

import moment from 'moment'

import { getSensorData } from '_services/sensors'
import { getSensorTimes } from '_services/sensors'

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
    const [times, setTimes] = useState(null)
    const recentTimestamp =
        data &&
        data.sensors &&
        data.sensors.length > 0 &&
        data.sensors[data.sensors.length - 1].timestamp

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        if (wifi.name && wifi.name.includes('ESP')) {
            const sensors = await getSensors()
            setData(sensors)
        }

        setRefreshing(false)
    }, [wifi, refreshing])

    useFocusEffect(
        useCallback(() => {
            console.log('sensors')
            let active = true

            const getData = async () => {
                const sensors = await getSensors()
                const times = await getSensorTimes()
                if (active) {
                    setTimes(times)
                    setData(sensors)
                }
            }
            if (!data && wifi.name && wifi.name.includes('ESP')) getData()

            return () => {
                active = false
            }
        }, [wifi]),
    )

    const dateFilter = date => {
        const current = moment.utc(date)
        const start = moment.utc(times.timeStart)
        const last = moment.utc(times.timeLast)

        console.log(current)
        console.log(start)
        console.log(last)
        if (current.isBetween(start, last, 'day', '[]')) {
            console.log('yes')
            return false
        } else {
            console.log('no')
            return true
        }
    }

    const getSensors = async () => {
        let offset = 0
        let response = await getSensorData(offset)
        let result = response
        /*
        if (response.next) offset = response.next
        if (btnIndex === 2) {
            while (response.next) {
                response = await getSensorData(offset)
                if (response.next) offset += response.next
                result.sensors = [...response.sensors]
            }
        }
        */
        return result
    }

    const timeFilter = (d, label) => {
        /*
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
        */
        return d.timestamp > recentTimestamp - 300
    }

    const dateFormat = d => {
        /*
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
        */
        return d
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
                    {times ? (
                        <CalendarPicker
                            disabledDates={date => dateFilter(date)}
                        />
                    ) : (
                        <></>
                    )}

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
                                            r: '6',
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
                                            r: '6',
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
