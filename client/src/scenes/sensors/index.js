import React, { useState, useCallback, useMemo, useRef } from 'react'

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

import { useFocusEffect, useTheme } from '@react-navigation/native'

import { connect } from 'react-redux'

import CalendarPicker from 'react-native-calendar-picker'

import moment from 'moment'

import { getSensorData } from '_services/sensors'
import { getSensorTimes } from '_services/sensors'

import { setWifi } from '_redux/actions/wifiActions'

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
    '23:00 - 23:59',
]

const buttonTimeToMoment = (btn, date) =>
    moment.utc(btn, 'H:mm').dayOfYear(moment.utc(date, 'D-M-YYYY').dayOfYear()) // set the day of year same to the of date. breaks next year?

const splitButtonsList = (arr, i) => arr[i].split('-').map(i => i.trim())

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
    const [loadingSensors, setLoadingSensors] = useState(false)

    const btnView = useRef(null)

    const { colors } = useTheme()

    const chartConfig = {
        backgroundColor: colors.background,
        backgroundGradientFrom: colors.background,
        backgroundGradientTo: colors.background,
        decimalPlaces: 1, // optional, defaults to 2dp
        color: (opacity = 1) => `rgba(175,175,175, ${opacity})`,
        labelColor: (opacity = 1) => colors.text,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: colors.text,
        },
    }

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        if (wifi.name && wifi.name.includes('ESP') && selectedDate) {
            const sensors = await getSensorData(selectedDate)
            const filteredButtons = filterButtons(sensors)

            setButtons(filteredButtons)
            setData(sensors)
            if (sensors && !times) {
                const sensorTimes = await getSensorTimes()
                setTimes(sensorTimes)
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
                    const filteredButtons = filterButtons(sensors)

                    setButtons(filteredButtons)
                    setData(sensors)
                    if (sensors) {
                        const sensorTimes = await getSensorTimes()
                        setTimes(sensorTimes)
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

    const filteredSensors =
        data &&
        data.sensors
            .filter(x =>
                moment
                    .utc(x.timestamp * 1000)
                    .isBetween(btnTimes.t1, btnTimes.t2),
            )
            .map(x => {
                return {
                    ...x,
                    timestamp: moment.utc(x.timestamp * 1000).format('HH:mm'),
                }
            })

    const memoizedSensors = useMemo(() => filteredSensors, [data, btnIndex])

    const handleBtnIndex = i => {
        const btnTimes = splitButtonsList(buttons, i)
        const t1 = buttonTimeToMoment(btnTimes[0], selectedDate)
        const t2 = buttonTimeToMoment(btnTimes[1], selectedDate)

        setBtnIndex(i)
        setBtnTimes({ t1, t2 })
    }

    const filterButtons = ({ sensors }) => {
        let filteredButtons = []
        const fTimestamp = moment.utc(sensors[0].timestamp * 1000)
        const lTimestamp = moment.utc(
            sensors[sensors.length - 1].timestamp * 1000,
        )

        for (let i = 0; i < buttonsList.length; i++) {
            const btnTimes = splitButtonsList(buttonsList, i)
            const t1 = buttonTimeToMoment(btnTimes[0], fTimestamp)

            if (t1.isBetween(fTimestamp, lTimestamp)) {
                filteredButtons.push(buttonsList[i])
            }
        }

        const btnTimes = splitButtonsList(filteredButtons, 0)
        const t1 = buttonTimeToMoment(btnTimes[0], fTimestamp)
        const t2 = buttonTimeToMoment(btnTimes[1], fTimestamp)

        setBtnTimes({ t1, t2 })

        return filteredButtons
    }

    const handleDateChange = async date => {
        setLoadingSensors(true)

        const formattedDate = moment.utc(date).format('D-M-YYYY')
        const sensors = await getSensorData(formattedDate)
        const filteredButtons = filterButtons(sensors)

        setBtnIndex(0)
        setButtons(filteredButtons)
        setSelectedDate(formattedDate)
        setData(sensors)

        setLoadingSensors(false)
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
                    <Text h1 style={{ color: colors.text }}>
                        Sensors
                    </Text>
                    {times ? (
                        <CalendarPicker
                            onDateChange={date => handleDateChange(date)}
                            disabledDates={date => dateFilter(date)}
                            textStyle={{ color: colors.text }}
                            selectedDayColor={colors.primary}
                        />
                    ) : (
                        <ActivityIndicator size="large" color="#0000ff" />
                    )}

                    {wifi.name && wifi.name.includes('ESP') ? (
                        !memoizedSensors || loadingSensors ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : memoizedSensors.length === 0 ? (
                            <Text style={{ color: colors.text }}>
                                No data found
                            </Text>
                        ) : (
                            <>
                                <Text style={{ color: colors.text }}>
                                    Amount of data points:{' '}
                                    {memoizedSensors.length}
                                </Text>
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
                                        buttonStyle={{
                                            padding: 10,
                                            backgroundColor: colors.card,
                                        }}
                                    />
                                </ScrollView>
                                <Text h4 style={{ color: colors.text }}>
                                    Temperature
                                </Text>
                                <ScrollView horizontal={true}>
                                    <TemperatureChart
                                        sensors={memoizedSensors}
                                        chartConfig={chartConfig}
                                        colors={colors}
                                    />
                                </ScrollView>
                                <Text h4 style={{ color: colors.text }}>
                                    Humidity
                                </Text>
                                <ScrollView horizontal={true}>
                                    <HumidityChart
                                        sensors={memoizedSensors}
                                        chartConfig={chartConfig}
                                        colors={colors}
                                    />
                                </ScrollView>
                            </>
                        )
                    ) : (
                        <Text style={{ color: colors.text }}>
                            ESP not detected
                        </Text>
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
