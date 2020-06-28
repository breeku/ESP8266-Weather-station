import React from 'react'

import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { Icon } from 'react-native-elements'

import Home from '_scenes/home'
import Sensors from '_scenes/sensors'
import Settings from '_navigations/settings'

const Tab = createBottomTabNavigator()

const Navigator = () => {
    return (
        <>
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        tabBarIcon: ({ focused, color, size }) => {
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
        </>
    )
}

export default Navigator
