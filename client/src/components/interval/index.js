import React, { useState, useCallback } from 'react'

import {
    StyleSheet,
    SafeAreaView,
    ScrollView,
    RefreshControl,
} from 'react-native'
import { Text, Input, Button, Slider } from 'react-native-elements'

import { useFocusEffect, useTheme } from '@react-navigation/native'

import { connect } from 'react-redux'

import { postInterval } from '_services/interval'
import { getInterval } from '_services/interval'

const Interval = props => {
    const { wifi } = props
    const [interval, setInterval] = useState(0)
    const [updatingInterval, setUpdatingInterval] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const { colors } = useTheme()

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        if (wifi.name && wifi.name.includes('ESP'))
            setInterval((await getInterval()) / 60000)

        setRefreshing(false)
    }, [wifi, refreshing])

    useFocusEffect(
        useCallback(() => {
            let active = true

            const getData = async () => {
                try {
                    if (active) setInterval((await getInterval()) / 60000)
                } catch (e) {
                    console.warn(e)
                }
            }
            if (wifi.name && wifi.name.includes('ESP')) getData()

            return () => {
                active = false
            }
        }, [wifi]),
    )

    const handleIntervalUpdate = async () => {
        setUpdatingInterval(true)
        setInterval(await postInterval(interval * 60000))
        setUpdatingInterval(false)
    }

    return (
        <SafeAreaView style={{ marginTop: 20 }}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }>
                <Slider
                    value={interval}
                    onValueChange={value => setInterval(value)}
                    step={0.5}
                    minimumValue={1}
                    maximumValue={1440}
                />
                <Input
                    style={{ width: '50%' }}
                    label="Update interval (minutes)"
                    inputStyle={{ color: colors.text }}
                    keyboardType={'numeric'}
                    onChangeText={val =>
                        val > 0 && val < 1440 ? setInterval(parseInt(val)) : 1
                    }>
                    {interval}
                </Input>
                <Text style={{ textAlign: 'center', color: colors.text }}>
                    {`One datapoint is ~60b`}
                </Text>
                <Button
                    containerStyle={{
                        width: '50%',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                    }}
                    title="Update"
                    onPress={() => {
                        handleIntervalUpdate()
                    }}
                    loading={updatingInterval ? true : false}
                />
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
    return {}
} // Exports

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Interval)
