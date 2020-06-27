import {RNToasty} from 'react-native-toasty'

export const TIMEZONE_OFFSET = 1.08e7 // GMT+3

export const updateTime = async () => {
    try {
        const msTime = (Date.now() + TIMEZONE_OFFSET) / 1000
        await fetch('http://192.168.4.1/time/?val=' + msTime, {
            method: 'POST',
        })
        RNToasty.Success({title: 'Update success!'})
        return true
    } catch (e) {
        RNToasty.Error({title: 'Update failed'})
        console.warn('updateTime', e)
        return false
    }
}
