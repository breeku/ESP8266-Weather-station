import React from 'react'

import { View } from 'react-native'

import { Button } from 'react-native-elements'

import { connect } from 'react-redux'

import { useTheme } from '@react-navigation/native'

import { ListItem } from 'react-native-elements'

import { setTheme } from '_redux/actions/themeActions'

const Settings = props => {
    const { colors } = useTheme()
    const { navigation, setTheme, theme } = props
    return (
        <View>
            <ListItem
                title="Access point"
                leftIcon={{
                    name: 'access-point',
                    type: 'material-community',
                    color: colors.primary,
                }}
                bottomDivider
                chevron
                onPress={() => navigation.navigate('Access Point')}
                titleStyle={{ color: colors.text }}
                containerStyle={{ backgroundColor: colors.card }}
            />
            <ListItem
                title="Interval"
                leftIcon={{
                    name: 'timer',
                    type: 'material-community',
                    color: colors.primary,
                }}
                bottomDivider
                chevron
                onPress={() => navigation.navigate('Interval')}
                titleStyle={{ color: colors.text }}
                containerStyle={{ backgroundColor: colors.card }}
            />
            <ListItem
                title="Wifi"
                leftIcon={{
                    name: 'wifi',
                    type: 'material-community',
                    color: colors.primary,
                }}
                bottomDivider
                chevron
                onPress={() => navigation.navigate('Wifi')}
                titleStyle={{ color: colors.text }}
                containerStyle={{ backgroundColor: colors.card }}
            />
            <Button
                onPress={() =>
                    theme !== 'dark' ? setTheme('dark') : setTheme('light')
                }
                title="Toggle theme"
                containerStyle={{
                    width: '50%',
                    marginTop: 20,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}
            />
        </View>
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
)(Settings)
