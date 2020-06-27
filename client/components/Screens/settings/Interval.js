import React, {useState, useEffect, useCallback} from 'react'

import {
    StyleSheet,
    SafeAreaView,
    ScrollView,
    RefreshControl,
} from 'react-native'
import {Text, Input, Button, Slider} from 'react-native-elements'

import {connect} from 'react-redux'

import {postInterval} from '../../../utils/interval/interval'
import {getInterval} from '../../../utils/interval/interval'

const styles = StyleSheet.create({
    intervalInput: {
        width: '50%',
    },
})

const Interval = (props) => {
    const {wifi} = props
    const [interval, setInterval] = useState(0)
    const [updatingInterval, setUpdatingInterval] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        if (wifi.name && wifi.name.includes('ESP'))
            setInterval((await getInterval()) / 60000)

        setRefreshing(false)
    }, [refreshing])

    useEffect(() => {
        const getData = async () => {
            try {
                setInterval((await getInterval()) / 60000)
            } catch (e) {
                console.warn(e)
            }
        }
        if (wifi.name && wifi.name.includes('ESP')) getData()
    }, [])

    const handleIntervalUpdate = async () => {
        setUpdatingInterval(true)
        setInterval(await postInterval(interval * 60000))
        setUpdatingInterval(false)
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
                <Text h3 style={{textAlign: 'center'}}>
                    Interval
                </Text>
                <Slider
                    value={interval}
                    onValueChange={(value) => setInterval(value)}
                    step={0.5}
                    minimumValue={1}
                    maximumValue={1440}
                />
                <Text>Update interval (minutes)</Text>
                <Input
                    style={styles.intervalInput}
                    keyboardType={'numeric'}
                    onChangeText={(val) =>
                        val > 0 && val < 1440 ? setInterval(parseInt(val)) : 1
                    }>
                    {interval}
                </Input>
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

const mapStateToProps = (state) => {
    // Redux Store --> Component
    return {
        wifi: state.wifiReducer,
    }
} // Map Dispatch To Props (Dispatch Actions To Reducers. Reducers Then Modify The Data And Assign It To Your Props)
const mapDispatchToProps = (dispatch) => {
    // Action
    return {}
} // Exports

export default connect(mapStateToProps, mapDispatchToProps)(Interval)
