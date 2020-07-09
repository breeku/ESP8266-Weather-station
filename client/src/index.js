/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import 'react-native-gesture-handler'
import React, { useEffect } from 'react'

import { PermissionsAndroid, AppState } from 'react-native'

import { connect } from 'react-redux'

import WifiManager from 'react-native-wifi-reborn'
import AsyncStorage from '@react-native-community/async-storage'

import { setSettings } from '_redux/actions/settingsActions'
import { setWifi } from '_redux/actions/wifiActions'

import { connectToWifi, getWifiName } from '_services/wifi/'

import Navigator from '_navigations/'

const requestFineLocation = async () => {
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Location permission is required for WiFi connections',
                message:
                    'This app needs location permission as this is required  ' +
                    'to scan for wifi networks.',
                buttonNegative: 'DENY',
                buttonPositive: 'ALLOW',
            },
        )
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log('granted')
            return true
        } else {
            console.log('denied')
            return false
        }
    } catch (e) {
        console.warn(e)
        return false
    }
}

const App: () => React$Node = props => {
    const { setWifi, setSettings } = props

    const _handleAppStateChange = async nextAppState => {
        if (nextAppState === 'active') {
            console.log('enabling wifi')
            WifiManager.setEnabled(true)

            const wifiName = await getWifiName()

            if (wifiName.includes('ESP')) {
                console.log('forcing wifi usage')
                await WifiManager.forceWifiUsage(true)
            }

            setWifi({ name: wifiName, ip: await WifiManager.getIP() })
        } else {
            console.log('disabling wifi')
            WifiManager.setEnabled(false)
            console.log('removing wifi force')
            await WifiManager.forceWifiUsage(false)
            console.log('resetting wifi state')
            setWifi({ name: null, ip: null })
        }
    }

    useEffect(() => {
        const getData = async () => {
            try {
                let permission = await requestFineLocation()

                if (permission) {
                    if (!(await WifiManager.isEnabled()))
                        WifiManager.setEnabled(true)
                    const wifiName = await getWifiName()
                    if (wifiName.includes('ESP')) {
                        console.log('forcing wifi usage')
                        await WifiManager.forceWifiUsage(true)
                    }
                    const wifiAuto =
                        JSON.parse(await AsyncStorage.getItem('@wifi_auto')) ||
                        false
                    const wifiSettings =
                        JSON.parse(
                            await AsyncStorage.getItem('@wifi_settings'),
                        ) || null

                    setWifi({ name: wifiName, ip: await WifiManager.getIP() })
                    setSettings({
                        autoWifi: wifiAuto,
                        permissions: permission,
                        credentials: wifiSettings
                            ? wifiSettings
                            : { SSID: null, password: null, isWep: null },
                    })

                    if (
                        wifiSettings &&
                        wifiAuto &&
                        wifiName !== wifiSettings.SSID
                    ) {
                        const connected = await connectToWifi(wifiSettings)
                        if (connected) {
                            await WifiManager.forceWifiUsage(true)
                            setWifi({
                                name: wifiName,
                                ip: await WifiManager.getIP(),
                            })
                        }
                    }
                }
            } catch (e) {
                console.warn(e)
            }
        }
        getData()
        AppState.addEventListener('change', _handleAppStateChange)

        return () => {
            AppState.removeEventListener('change', _handleAppStateChange)
        }
    }, [])

    return <Navigator />
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
        // Set settings
        setSettings: data => dispatch(setSettings(data)),
        setWifi: data => dispatch(setWifi(data)),
    }
} // Exports

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(App)
