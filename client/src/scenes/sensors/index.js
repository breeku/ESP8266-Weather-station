import React, { useState, useCallback, useRef } from 'react'

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
    const [selectedDate, setSelectedDate] = useState(
        moment.utc().format('D-M-YYYY'),
    )

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        if (wifi.name && wifi.name.includes('ESP') && selectedDate) {
            const sensors = await getSensorData(selectedDate)
            if (sensors) {
                const times = await getSensorTimes()
                setData(sensors)
                setTimes(times)
            }
        }

        setRefreshing(false)
    }, [wifi, refreshing])
    useFocusEffect(
        useCallback(() => {
            let active = true

            const getData = async () => {
                const sensors = await getSensorData(selectedDate)
                if (sensors) {
                    const times = await getSensorTimes()
                    if (active) {
                        setData(sensors)
                        setTimes(times)
                    }
                }
            }
            if (!data && wifi.name && wifi.name.includes('ESP') && selectedDate)
                getData()

            return () => {
                active = false
            }
        }, [wifi]),
    )

    const dateFilter = date => {
        const current = moment.utc(date)
        const start = moment.utc(times.timeStart)
        const last = moment.utc(times.timeLast)

        if (current.isBetween(start, last, 'day', '[]')) {
            return false
        } else {
            return true
        }
    }

    const timeFilter = (d, label) => {
        return true
    }

    const dateFormat = d => {
        return moment.utc(d.timestamp * 1000).format('HH:mm')
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
                            onDateChange={date =>
                                setSelectedDate(
                                    moment.utc(date).format('D-M-YYYY'),
                                )
                            }
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
                                <Text>File is {data.fileSize / 1000} kb</Text>
                                <Text h4>Temperature</Text>
                                <ScrollView horizontal={true}>
                                    <LineChart
                                        data={{
                                            labels: data.sensors
                                                .filter(x =>
                                                    timeFilter(x, true),
                                                )
                                                .map(x => dateFormat(x)),
                                            datasets: [
                                                {
                                                    data: data.sensors
                                                        .filter(x =>
                                                            timeFilter(x),
                                                        )
                                                        .map(
                                                            x => x.temperature,
                                                        ),
                                                },
                                            ],
                                        }}
                                        width={data.sensors.length * 50 + 100} // from react-native
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
                                        renderDotContent={({ x, y, index }) => (
                                            <Text
                                                style={{
                                                    position: 'absolute',
                                                    paddingTop: y,
                                                    paddingLeft: x,
                                                }}>
                                                {
                                                    data.sensors[index]
                                                        .temperature
                                                }
                                            </Text>
                                        )}
                                    />
                                </ScrollView>
                                <Text h4>Humidity</Text>
                                <ScrollView horizontal={true}>
                                    <LineChart
                                        data={{
                                            labels: data.sensors
                                                .filter(x =>
                                                    timeFilter(x, true),
                                                )
                                                .map(x => dateFormat(x)),
                                            datasets: [
                                                {
                                                    data: data.sensors
                                                        .filter(x =>
                                                            timeFilter(x),
                                                        )
                                                        .map(x => x.humidity),
                                                },
                                            ],
                                        }}
                                        width={data.sensors.length * 50 + 100} // from react-native
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
                                        renderDotContent={({ x, y, index }) => (
                                            <Text
                                                style={{
                                                    position: 'absolute',
                                                    paddingTop: y,
                                                    paddingLeft: x,
                                                }}>
                                                {data.sensors[index].humidity}
                                            </Text>
                                        )}
                                    />
                                </ScrollView>
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
