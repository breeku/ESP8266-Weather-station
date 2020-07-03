import React, { useState, useCallback } from 'react'

import {
    StyleSheet,
    View,
    Dimensions,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native'
import { Text, Button } from 'react-native-elements'

import { useFocusEffect } from '@react-navigation/native'

import { ProgressChart } from 'react-native-chart-kit'

import { connect } from 'react-redux'

import moment from 'moment'

import { getSystemInfo } from '_services/system'
import { updateTime } from '_services/time'

const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    time: {
        paddingTop: 40,
        paddingBottom: 40,
    },
})

const Home = props => {
    const { wifi } = props
    const [memory, setMemory] = useState(null)
    const [filesystem, setFileSystem] = useState(null)
    const [time, setTime] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        if (wifi.name && wifi.name.includes('ESP')) {
            try {
                const data = await getSystemInfo()
                setMemory(data.memory)
                setFileSystem(data.filesystem)
                setTime(moment.utc(data.time * 1000).format())
            } catch (e) {
                console.warn(e)
            }
        }

        setRefreshing(false)
    }, [wifi, refreshing])

    useFocusEffect(
        useCallback(() => {
            let active = true

            const getData = async () => {
                try {
                    const data = await getSystemInfo()
                    if (active) {
                        setMemory(data.memory)
                        setFileSystem(data.filesystem)
                        setTime(moment.utc(data.time * 1000).format())
                    }
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

    return (
        <SafeAreaView style={styles.root}>
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }>
                <View style={styles.root}>
                    <Text h1>Home</Text>
                    {wifi.name && wifi.name.includes('ESP') ? (
                        <>
                            <Text style={{ color: 'green' }}>
                                ESP Detected!
                            </Text>
                            {memory && filesystem && time ? (
                                <>
                                    <View style={styles.time}>
                                        <Text style={{ textAlign: 'center' }}>
                                            {`System time:\n
${time}\n
`}
                                        </Text>
                                        <Button
                                            title="Update"
                                            onPress={updateTime}
                                        />
                                    </View>
                                    <Text>Memory</Text>
                                    <ProgressChart
                                        data={{
                                            labels: ['Used', 'Free'], // optional
                                            data: [
                                                (memory.start - memory.free) /
                                                    memory.start,
                                                memory.free / memory.start,
                                            ],
                                        }}
                                        width={Dimensions.get('window').width}
                                        height={220}
                                        strokeWidth={16}
                                        radius={32}
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
                                                stroke: '#ffa726',
                                            },
                                        }}
                                        hideLegend={false}
                                    />

                                    <Text>File System</Text>
                                    <ProgressChart
                                        data={{
                                            labels: ['Used', 'Free'], // optional
                                            data: [
                                                filesystem.used /
                                                    filesystem.total,
                                                (filesystem.total -
                                                    filesystem.used) /
                                                    filesystem.total,
                                            ],
                                        }}
                                        width={Dimensions.get('window').width}
                                        height={220}
                                        strokeWidth={16}
                                        radius={32}
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
                                                stroke: '#ffa726',
                                            },
                                        }}
                                        hideLegend={false}
                                    />
                                </>
                            ) : (
                                <ActivityIndicator
                                    size="large"
                                    color="#0000ff"
                                />
                            )}
                        </>
                    ) : (
                        <Text style={{ color: 'red' }}>
                            Go to settings and connect to ESP
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
    return {}
} // Exports

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Home)
