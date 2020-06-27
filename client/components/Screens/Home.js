import React, {useEffect, useState, useCallback} from 'react'

import {
    StyleSheet,
    View,
    Dimensions,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native'
import {Text} from 'react-native-elements'

import {ProgressChart} from 'react-native-chart-kit'

import {connect} from 'react-redux'

import {getSystemInfo} from '../../utils/system/system'

const styles = StyleSheet.create({
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
})

const Home = (props) => {
    const {wifi} = props
    const [memory, setMemory] = useState(null)
    const [filesystem, setFileSystem] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        if (wifi.name && wifi.name.includes('ESP')) {
            try {
                const data = await getSystemInfo()
                setMemory(data.memory)
                setFileSystem(data.filesystem)
            } catch (e) {
                console.warn(e)
            }
        }

        setRefreshing(false)
    }, [refreshing])

    useEffect(() => {
        const getData = async () => {
            try {
                const data = await getSystemInfo()
                setMemory(data.memory)
                setFileSystem(data.filesystem)
            } catch (e) {
                console.warn(e)
            }
        }

        if (wifi.name && wifi.name.includes('ESP')) getData()
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
                <View style={styles.root}>
                    <Text h1>Home</Text>
                    {wifi.name && wifi.name.includes('ESP') ? (
                        <>
                            <Text style={{color: 'green'}}>ESP Detected!</Text>
                            {memory && filesystem ? (
                                <>
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
                        <Text style={{color: 'red'}}>
                            Go to settings and connect to ESP
                        </Text>
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
    }
} // Map Dispatch To Props (Dispatch Actions To Reducers. Reducers Then Modify The Data And Assign It To Your Props)
const mapDispatchToProps = (dispatch) => {
    // Action
    return {}
} // Exports

export default connect(mapStateToProps, mapDispatchToProps)(Home)
