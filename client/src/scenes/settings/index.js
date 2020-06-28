import React from 'react'

import {createStackNavigator} from '@react-navigation/stack'

import Navigation from '_navigations/settings'
import Interval from '_components/interval'
import AccessPoint from '_components/accessPoint'
import Wifi from '_components/wifi'

const Stack = createStackNavigator()

const Settings = () => {
    return (
        <Stack.Navigator headerMode="screen">
            <Stack.Screen name="Settings" component={Navigation} />
            <Stack.Screen name="Access Point" component={AccessPoint} />
            <Stack.Screen name="Interval" component={Interval} />
            <Stack.Screen name="Wifi" component={Wifi} />
        </Stack.Navigator>
    )
}

export default Settings
