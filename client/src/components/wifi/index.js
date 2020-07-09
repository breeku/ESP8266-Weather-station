import React, { useState, useEffect, useCallback } from 'react'

import {
    StyleSheet,
    View,
    SafeAreaView,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native'
import {
    Icon,
    Text,
    ListItem,
    CheckBox,
    Overlay,
    Input,
    Button,
} from 'react-native-elements'

import { useFocusEffect, useTheme } from '@react-navigation/native'

import { connect } from 'react-redux'

import WifiManager from 'react-native-wifi-reborn'

import AsyncStorage from '@react-native-community/async-storage'

import { RNToasty } from 'react-native-toasty'

import { setWifi } from '_redux/actions/wifiActions'

import { connectToWifi } from '_services/wifi'

import { encryptPassword } from '_utils/encrypt'

const styles = StyleSheet.create({
    root: {
        flex: 1,
        marginTop: 10,
        marginBottom: 10,
    },
    settings: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginTop: 20,
        marginBottom: 20,
    },
    listItem: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
        padding: 2.5,
        margin: 3,
        marginTop: 5,
        marginBottom: 5,
    },
})

const Wifi = props => {
    const { setWifi, settings, wifi } = props

    const [wifiList, setWifiList] = useState(null)
    const [wifiSettingsOverlay, setWifiSettingsOverlay] = useState(false)
    const [wifiPasswordOverlay, setWifiPasswordOverlay] = useState(false)
    const [wifiConnect, setWifiConnect] = useState(null)
    const [wifiPassword, setWifiPassword] = useState('')
    const [autoConnectWifi, setAutoConnectWifi] = useState(
        settings.autoWifi || false,
    )
    const [credentials, setCredentials] = useState(settings.credentials)
    const [refreshing, setRefreshing] = useState(false)

    const { colors } = useTheme()

    const onRefresh = useCallback(async () => {
        setRefreshing(true)

        const getWifiList = await WifiManager.reScanAndLoadWifiList()
        setWifiList(JSON.parse(getWifiList))

        setRefreshing(false)
    }, [wifi, refreshing])

    useFocusEffect(
        useCallback(() => {
            let active = true

            const getData = async () => {
                try {
                    const getWifiList = JSON.parse(
                        await WifiManager.loadWifiList(),
                    )
                    if (active) setWifiList(getWifiList)
                } catch (e) {
                    console.warn(e)
                }
            }
            getData()

            return () => {
                active = false
            }
        }, []),
    )

    useEffect(() => {}, [])

    const handleConnectWifi = async d => {
        const data = d || wifiConnect
        const obj = {
            SSID: data.SSID,
            password: wifiPassword,
            isWep: data.credentials ? true : false,
        }
        const connected = await connectToWifi(obj)
        if (connected) {
            setWifi({ name: obj.SSID, ip: await WifiManager.getIP() })
            if (wifiName.includes('ESP')) {
                console.log('forcing wifi usage')
                await WifiManager.forceWifiUsage(true)
            }
        }
    }

    const handleAutoWifi = async () => {
        if (credentials.SSID) {
            await AsyncStorage.setItem(
                '@wifi_auto',
                JSON.stringify(!autoConnectWifi),
            )
            setAutoConnectWifi(!autoConnectWifi)
        } else {
            RNToasty.Error({ title: 'Settings are empty' })
        }
    }

    const handleWifiSettings = async () => {
        try {
            const encryptedPassword = encryptPassword(credentials.password)
            const data = JSON.stringify({
                ...credentials,
                password: encryptedPassword,
            })
            console.log(data)
            await AsyncStorage.setItem('@wifi_settings', data)
        } catch (e) {
            console.warn(e)
        }
    }

    const toggleWifiSettingsOverlay = () =>
        setWifiSettingsOverlay(!wifiSettingsOverlay)

    const toggleWifiPasswordOverlay = async (l = null) => {
        if (l) setWifiConnect(l)
        setWifiPasswordOverlay(!wifiPasswordOverlay)
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
                <View style={styles.settings}>
                    <CheckBox
                        title="Connect automatically"
                        checkedIcon="dot-circle-o"
                        uncheckedIcon="circle-o"
                        checked={autoConnectWifi}
                        onPress={handleAutoWifi}
                        containerStyle={{
                            backgroundColor: colors.card,
                        }}
                        titleProps={{ style: { color: colors.text } }}
                    />
                    <Icon
                        style={{
                            marginTop: 'auto',
                            marginBottom: 'auto',
                        }}
                        color={colors.primary}
                        type="material-community"
                        name="settings"
                        onPress={toggleWifiSettingsOverlay}
                    />
                </View>
                <Overlay
                    isVisible={wifiSettingsOverlay}
                    onBackdropPress={toggleWifiSettingsOverlay}>
                    <View style={{ width: 200 }}>
                        <CheckBox
                            title="Secure"
                            checkedIcon="dot-circle-o"
                            uncheckedIcon="circle-o"
                            checked={credentials.isWep}
                            onPress={() =>
                                setCredentials({
                                    ...credentials,
                                    isWep: !credentials.isWep,
                                })
                            }
                        />
                        <Input
                            onChangeText={text =>
                                setCredentials({
                                    ...credentials,
                                    SSID: text,
                                })
                            }
                            placeholder="SSID"
                        />
                        {credentials.isWep ? (
                            <Input
                                onChangeText={text =>
                                    setCredentials({
                                        ...credentials,
                                        password: text,
                                    })
                                }
                                placeholder="Password"
                                secureTextEntry={true}
                            />
                        ) : (
                            <></>
                        )}

                        <Button
                            title="Save"
                            onPress={() => {
                                handleWifiSettings()
                                toggleWifiSettingsOverlay()
                            }}
                        />
                    </View>
                </Overlay>
                {wifiList === null ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <>
                        {wifiList.length === 0 ? (
                            <Text
                                style={{
                                    textAlign: 'center',
                                    color: colors.text,
                                }}>
                                No WiFI networks found!
                            </Text>
                        ) : (
                            <>
                                {wifiList.map((l, i) => (
                                    <>
                                        <ListItem
                                            key={i}
                                            title={l.SSID}
                                            subtitle={l.BSSID}
                                            bottomDivider
                                            style={{
                                                ...styles.listItem,
                                                backgroundColor:
                                                    wifi.name === l.SSID
                                                        ? colors.success
                                                        : colors.card,
                                            }}
                                            titleStyle={{ color: colors.text }}
                                            containerStyle={{
                                                backgroundColor: colors.card,
                                            }}
                                            onPress={() =>
                                                wifi.name !== l.SSID
                                                    ? l.capabilities
                                                        ? toggleWifiPasswordOverlay(
                                                              l,
                                                          )
                                                        : handleConnectWifi(l)
                                                    : null
                                            }
                                        />
                                    </>
                                ))}
                            </>
                        )}
                    </>
                )}

                <Overlay
                    isVisible={wifiPasswordOverlay}
                    onBackdropPress={toggleWifiPasswordOverlay}>
                    <View style={{ width: 200 }}>
                        <Input
                            onChangeText={text => setWifiPassword(text)}
                            placeholder="Password"
                            secureTextEntry={true}
                        />
                        <Button
                            title="Connect"
                            onPress={() => {
                                handleConnectWifi()
                                toggleWifiPasswordOverlay()
                            }}
                        />
                    </View>
                </Overlay>
            </ScrollView>
        </SafeAreaView>
    )
}

const mapStateToProps = state => {
    // Redux Store --> Component
    return {
        settings: state.settingsReducer,
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
)(Wifi)
