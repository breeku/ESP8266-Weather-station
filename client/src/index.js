/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import 'react-native-gesture-handler'
import React, {useEffect} from 'react'

import {PermissionsAndroid, AppState} from 'react-native'

import {connect} from 'react-redux'

import {NavigationContainer} from '@react-navigation/native'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'

import {Icon} from 'react-native-elements'

import WifiManager from 'react-native-wifi-reborn'
import AsyncStorage from '@react-native-community/async-storage'

import {setSettings} from '_redux/actions/settingsActions'
import {setWifi} from '_redux/actions/wifiReducer'

import Home from '_scenes/home'
import Sensors from '_scenes/sensors'
import Settings from '_scenes/settings'

import {connectToWifi, getWifiName} from '_utils/wifi/'

const Tab = createBottomTabNavigator()

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
    const {setWifi, setSettings} = props

    const _handleAppStateChange = async nextAppState => {
        if (nextAppState === 'active') {
            console.log('enabling wifi')
            WifiManager.setEnabled(true)

            const wifiName = await getWifiName()

            if (wifiName.includes('ESP')) {
                console.log('forcing wifi usage')
                await WifiManager.forceWifiUsage(true)
            }

            setWifi({name: wifiName, ip: await WifiManager.getIP()})
        } else {
            console.log('disabling wifi')
            WifiManager.setEnabled(false)
            console.log('removing wifi force')
            await WifiManager.forceWifiUsage(false)
            console.log('resetting wifi state')
            setWifi({name: null, ip: null})
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

                    setWifi({name: wifiName, ip: await WifiManager.getIP()})
                    setSettings({
                        autoWifi: wifiAuto,
                        permissions: permission,
                        credentials: wifiSettings
                            ? wifiSettings
                            : {SSID: null, password: null, isWep: null},
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

    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({route}) => ({
                    tabBarIcon: ({focused, color, size}) => {
                        let iconName

                        if (route.name === 'Home') {
                            iconName = 'home'
                        } else if (route.name === 'Sensors') {
                            iconName = 'motion-sensor'
                        } else if (route.name === 'Settings') {
                            iconName = 'settings'
                        }

                        // You can return any component that you like here!
                        return (
                            <Icon
                                type="material-community"
                                name={iconName}
                                size={size}
                                color={color}
                            />
                        )
                    },
                })}
                tabBarOptions={{
                    activeTintColor: 'tomato',
                    inactiveTintColor: 'gray',
                }}>
                <Tab.Screen name="Home" component={Home} />
                <Tab.Screen name="Sensors" component={Sensors} />
                <Tab.Screen name="Settings" component={Settings} />
            </Tab.Navigator>
        </NavigationContainer>
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
        // Set settings
        setSettings: data => dispatch(setSettings(data)),
        setWifi: data => dispatch(setWifi(data)),
    }
} // Exports

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(App)
