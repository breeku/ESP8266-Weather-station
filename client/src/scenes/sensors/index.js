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
import { Text, ButtonGroup } from 'react-native-elements'

import { useFocusEffect } from '@react-navigation/native'

import { connect } from 'react-redux'

import CalendarPicker from 'react-native-calendar-picker'

import moment from 'moment'

import { getSensorData } from '_services/sensors'
import { getSensorTimes } from '_services/sensors'

import { setWifi } from '_redux/actions/wifiReducer'

import TemperatureChart from '_components/TemperatureChart'
import HumidityChart from '_components/HumidityChart'

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

const maxLength = 200

const buttonsList = [
    '00:00 - 01:00',
    '01:00 - 02:00',
    '02:00 - 03:00',
    '03:00 - 04:00',
    '04:00 - 05:00',
    '05:00 - 06:00',
    '06:00 - 07:00',
    '07:00 - 08:00',
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '17:00 - 18:00',
    '18:00 - 19:00',
    '19:00 - 20:00',
    '21:00 - 22:00',
    '22:00 - 23:00',
    '23:00 - 24:00',
]

const Sensors = props => {
    const { wifi } = props
    const [data, setData] = useState(null)
    const [refreshing, setRefreshing] = useState(false)
    const [times, setTimes] = useState(null)
    const [btnIndex, setBtnIndex] = useState(0)
    const [selectedDate, setSelectedDate] = useState(
        moment.utc().format('D-M-YYYY'),
    )
    const [buttons, setButtons] = useState(null)
    const [btnTimes, setBtnTimes] = useState(null)

    const btnView = React.useRef(null)

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        if (wifi.name && wifi.name.includes('ESP') && selectedDate) {
            const sensors = await getSensorData(selectedDate)
            setButtons(filterButtons(sensors.sensors))
            setData(sensors)
            if (sensors && !times) {
                setTimes(await getSensorTimes())
            }
        }

        setRefreshing(false)
    }, [wifi, refreshing])

    useFocusEffect(
        useCallback(() => {
            let active = true

            const getData = async () => {
                if (active) {
                    const sensors = await getSensorData(selectedDate)

                    setButtons(filterButtons(sensors.sensors))

                    setData(sensors)
                    if (sensors) {
                        setTimes(await getSensorTimes())
                    }
                }
            }
            if (
                !data &&
                !times &&
                wifi.name &&
                wifi.name.includes('ESP') &&
                selectedDate
            )
                getData()

            return () => {
                active = false
            }
        }, [wifi]),
    )

    const scrollToBtnIndex = () => {
        if (btnView.current) {
            const btnWidth = 115

            btnView.current.scrollTo({
                x: btnWidth * btnIndex,
                y: 0,
                animated: true,
            })
        }
    }

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

    const timeFilter = (x, i) => {
        const timestamp = moment.utc(x.timestamp * 1000)
        if (timestamp.isBetween(btnTimes.t1, btnTimes.t2)) {
            return true
        } else {
            return false
        }
    }

    const filteredSensors = () => {
        return data.sensors.filter((x, i) => timeFilter(x, i))
    }

    const handleBtnIndex = i => {
        const btnTimes = buttons[i].split('-').map(i => i.trim())
        const t1 = moment.utc(btnTimes[0], 'H:mm')
        const t2 = moment.utc(btnTimes[1], 'H:mm')

        setBtnIndex(i)
        setBtnTimes({ t1, t2 })
    }

    const filterButtons = sensors => {
        let filteredButtons = []
        const fTimestamp = moment.utc(sensors[0].timestamp * 1000)
        const lTimestamp = moment.utc(
            sensors[sensors.length - 1].timestamp * 1000,
        )

        for (let i = 0; i < buttonsList.length; i++) {
            const btnTimes = buttonsList[i].split('-').map(i => i.trim())
            const t1 = moment.utc(btnTimes[0], 'H:mm')

            if (t1.isBetween(fTimestamp, lTimestamp)) {
                filteredButtons.push(buttonsList[i])
            }
        }

        const btnTimes = filteredButtons[btnIndex].split('-').map(i => i.trim())
        const t1 = moment.utc(btnTimes[0], 'H:mm')
        const t2 = moment.utc(btnTimes[1], 'H:mm')

        setBtnTimes({ t1, t2 })

        return filteredButtons
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
                                    Amount of data points{' '}
                                    {filteredSensors().length}
                                </Text>
                                <Text>File is {data.fileSize / 1000} kb</Text>
                                <Text h4>Temperature</Text>
                                <ScrollView
                                    horizontal={true}
                                    ref={btnView}
                                    onContentSizeChange={() =>
                                        scrollToBtnIndex()
                                    }>
                                    <ButtonGroup
                                        onPress={i => handleBtnIndex(i)}
                                        selectedIndex={btnIndex}
                                        buttons={buttons}
                                        containerStyle={{ height: 50 }}
                                        buttonStyle={{ padding: 10 }}
                                    />
                                </ScrollView>
                                <ScrollView horizontal={true}>
                                    <TemperatureChart
                                        sensors={filteredSensors()}
                                    />
                                </ScrollView>
                                <Text h4>Humidity</Text>
                                <ScrollView horizontal={true}>
                                    <HumidityChart
                                        sensors={filteredSensors()}
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
