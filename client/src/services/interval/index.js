import { RNToasty } from 'react-native-toasty'

export const getInterval = async () => {
    try {
        const response = await fetch('http://192.168.4.1/frequency/')
        const json = await response.json()
        return json.interval
    } catch (e) {
        RNToasty.Error({ title: 'Connection failed' })
        console.warn('getFrequency', e)
    }
}

export const postInterval = async frequency => {
    try {
        await fetch('http://192.168.4.1/frequency/?val=' + frequency, {
            method: 'POST',
        })
        RNToasty.Success({ title: 'Update success!' })
    } catch (e) {
        RNToasty.Error({ title: 'Update failed' })
        console.warn('postInterval', e)
    }
}
