import {RNToasty} from 'react-native-toasty'
import WifiManager from 'react-native-wifi-reborn'
import {decryptPassword} from '../encrypt/password'

async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise((resolve) => setTimeout(resolve, ms))
}

export const connectToWifi = async (credentials) => {
    try {
        credentials.password = decryptPassword(credentials.password)
        RNToasty.Info({title: 'Attempting to connect...', duration: 1})
        await WifiManager.connectToProtectedSSID(
            credentials.SSID,
            credentials.password,
            credentials.isWep,
        )
        RNToasty.Success({title: 'Connection success!'})
        return true
    } catch (e) {
        console.warn('connectToWifi', e)
        RNToasty.Error({title: 'Connection failed'})
        return false
    }
}

export const getWifiName = async () => {
    try {
        const triesMax = 10
        let tries = 0
        let wifiName = await WifiManager.getCurrentWifiSSID()
        while (wifiName.includes('unknown ssid')) {
            if (tries >= triesMax) {
                RNToasty.Error({title: 'Couldnt find ssid'})
                break
            }
            // wifi is not yet ready
            await delay(1000)
            RNToasty.Info({
                title: 'WiFi was not ready, retrying ' + tries + '/' + triesMax,
            })
            tries++
            wifiName = await WifiManager.getCurrentWifiSSID()
        }
        if (tries > 0) RNToasty.Success({title: 'Found SSID!'})
        return wifiName
    } catch (e) {
        console.warn(e)
    }
}
