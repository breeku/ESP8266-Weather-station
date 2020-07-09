import React, { useState, useEffect } from 'react'

import { Appearance, useColorScheme } from 'react-native-appearance'

import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import { connect } from 'react-redux'

import { Icon } from 'react-native-elements'

import Home from '_scenes/Home'
import Sensors from '_scenes/Sensors'
import Settings from '_navigations/Settings'

import { setTheme } from '_redux/actions/themeActions'

import { lightMode } from '_styles/lightMode'
import { darkMode } from '_styles/darkMode'

const Tab = createBottomTabNavigator()

const Navigator = props => {
    const { setTheme, theme } = props
    const scheme = useColorScheme()

    useEffect(() => {
        setTheme(scheme)
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            setTheme(colorScheme)
        })
        return () => subscription.remove()
    }, [])

    return (
        <NavigationContainer theme={theme === 'dark' ? darkMode : lightMode}>
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
                    activeTintColor: 'rgb(255, 45, 85)',
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
    return { ...state.themeReducer }
} // Map Dispatch To Props (Dispatch Actions To Reducers. Reducers Then Modify The Data And Assign It To Your Props)
const mapDispatchToProps = dispatch => {
    // Action
    return {
        setTheme: data => dispatch(setTheme(data)),
    }
} // Exports

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(Navigator)
