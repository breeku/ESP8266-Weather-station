import { RNToasty } from 'react-native-toasty'

export const getSystemInfo = async () => {
    try {
        const response = await fetch('http://192.168.4.1/systeminfo/')
        const json = await response.json()
        return json
    } catch (e) {
        RNToasty.Error({ title: 'Connection failed' })
        console.warn('getSystemInfo', e)
    }
}

export const postAccessPoint = async credentials => {
    try {
        await fetch(
            'http://192.168.4.1/accesspoint/?ssid=' +
                credentials.ssid +
                '&password=' +
                credentials.password,
            {
                method: 'POST',
            },
        )
    } catch (e) {
        RNToasty.Info({ title: 'Resetting access point...' })
        return true
    }
}
