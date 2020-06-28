import React from 'react'

import { createStackNavigator } from '@react-navigation/stack'

import Settings from '_scenes/Settings'
import Interval from '_components/Interval'
import AccessPoint from '_components/AccessPoint'
import Wifi from '_components/Wifi'

const Stack = createStackNavigator()

const Navigation = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Settings" component={Settings} />
            <Stack.Screen name="Access Point" component={AccessPoint} />
            <Stack.Screen name="Interval" component={Interval} />
            <Stack.Screen name="Wifi" component={Wifi} />
        </Stack.Navigator>
    )
}

export default Navigation
