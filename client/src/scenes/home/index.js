import React, { useState, useCallback } from 'react'

import {
    StyleSheet,
    View,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native'
import { Text, Button } from 'react-native-elements'

import { useFocusEffect, useTheme } from '@react-navigation/native'

import { connect } from 'react-redux'

import moment from 'moment'

import { getSystemInfo } from '_services/system'
import { updateTime } from '_services/time'

import MemoryChart from '_components/MemoryChart'
import SystemChart from '_components/SystemChart'

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
    }

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
                    <Text h1 style={{ color: colors.text }}>
                        Home
                    </Text>
                    {wifi.name && wifi.name.includes('ESP') ? (
                        <>
                            <Text style={{ color: colors.success }}>
                                ESP Detected!
                            </Text>
                            {memory && filesystem && time ? (
                                <>
                                    <View style={styles.time}>
                                        <Text
                                            style={{
                                                textAlign: 'center',
                                                color: colors.text,
                                            }}>
                                            {`System time:\n
${time}\n
`}
                                        </Text>
                                        <Button
                                            title="Update"
                                            onPress={updateTime}
                                        />
                                    </View>
                                    <Text style={{ color: colors.text }}>
                                        Memory
                                    </Text>
                                    <MemoryChart
                                        memory={memory}
                                        chartConfig={chartConfig}
                                    />
                                    <Text style={{ color: colors.text }}>
                                        File System
                                    </Text>
                                    <SystemChart
                                        filesystem={filesystem}
                                        chartConfig={chartConfig}
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
