import {RNToasty} from 'react-native-toasty'
import {updateTime} from '../time/time'

export const getSensorData = async () => {
    try {
        const response = await fetch('http://192.168.4.1/sensors/')
        const json = await response.json()
        if (json.status && json.status.includes('Time needs to be updated')) {
            throw 'updating'
        }
        return json.sensors
    } catch (e) {
        if (e === 'updating') {
            const response = await updateTime()
            RNToasty.Info({title: 'Updating time...'})
            if (response) return await getSensorData()
        } else {
            RNToasty.Error({title: 'Connection failed'})
            console.warn('getSensorData', e)
        }
    }
}
