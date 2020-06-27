import React from 'react'

import {createStackNavigator} from '@react-navigation/stack'

import Navigation from './settings/Navigation'
import Interval from './settings/Interval'
import AccessPoint from './settings/AccessPoint'
import Wifi from './settings/Wifi'

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
