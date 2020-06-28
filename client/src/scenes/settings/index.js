import React from 'react'

import { View } from 'react-native'

import { ListItem } from 'react-native-elements'

const Settings = ({ navigation }) => {
    return (
        <View>
            <ListItem
                title="Access point"
                leftIcon={{
                    name: 'access-point',
                    type: 'material-community',
                }}
                bottomDivider
                chevron
                onPress={() => navigation.navigate('Access Point')}
            />
            <ListItem
                title="Interval"
                leftIcon={{ name: 'timer', type: 'material-community' }}
                bottomDivider
                chevron
                onPress={() => navigation.navigate('Interval')}
            />
            <ListItem
                title="Wifi"
                leftIcon={{ name: 'wifi', type: 'material-community' }}
                bottomDivider
                chevron
                onPress={() => navigation.navigate('Wifi')}
            />
        </View>
    )
}

export default Settings
