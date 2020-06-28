import React, { useState } from 'react'

import { StyleSheet, View } from 'react-native'

import { Text, Input, Button } from 'react-native-elements'

import { RNToasty } from 'react-native-toasty'

import WifiManager from 'react-native-wifi-reborn'

import { postAccessPoint } from '_services/system'

const styles = StyleSheet.create({
    accessPointInput: {
        width: '50%',
    },
})

const AccessPoint = () => {
    const [accessPoint, setAccessPoint] = useState({})
    const [updatingAccessPoint, setUpdatingAccessPoint] = useState(false)

    const handleAccessPointUpdate = async () => {
        setUpdatingAccessPoint(true)
        if (accessPoint.ssid && accessPoint.password) {
            if (accessPoint.password.length <= 8) {
                RNToasty.Error({
                    title: 'Password must be atleast 8 characters!',
                })
            } else if (accessPoint.ssid === '') {
                RNToasty.Error({
                    title: 'SSID cannot be empty!',
                })
            } else if (!accessPoint.ssid.includes('ESP')) {
                RNToasty.Error({
                    title: 'SSID must include ESP!',
                })
            } else {
                const reset = await postAccessPoint(accessPoint)
                if (reset) {
                    try {
                        await WifiManager.connectToProtectedSSID(
                            accessPoint.ssid,
                            accessPoint.password,
                            true,
                        )
                    } catch (e) {
                        console.warn(e)
                    }
                }
            }
        }

        setUpdatingAccessPoint(false)
    }

    return (
        <View>
            <Text h3 style={{ textAlign: 'center' }}>
                Access Point
            </Text>
            <Input
                placeholder="SSID"
                style={styles.accessPointInput}
                onChangeText={text =>
                    setAccessPoint({
                        ...accessPoint,
                        ssid: text,
                    })
                }
            />
            <Input
                placeholder="password"
                style={styles.accessPointInput}
                onChangeText={text =>
                    setAccessPoint({
                        ...accessPoint,
                        password: text,
                    })
                }
                secureTextEntry={true}
            />
            <Button
                containerStyle={{
                    width: '50%',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                }}
                title="Update"
                onPress={() => {
                    handleAccessPointUpdate()
                }}
                loading={updatingAccessPoint ? true : false}
            />
        </View>
    )
}

export default AccessPoint
