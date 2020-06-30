import { RNToasty } from 'react-native-toasty'
import { updateTime } from '_services/time'

export const getSensorData = async (offset = 0) => {
    try {
        const response = await fetch(
            'http://192.168.4.1/sensors/?offset=' + offset,
        )
        const json = await response.json()
        if (json.status && json.status.includes('Time needs to be updated')) {
            throw 'updating'
        }
        return json
    } catch (e) {
        if (e === 'updating') {
            const response = await updateTime()
            RNToasty.Info({ title: 'Updating time...' })
            if (response) {
                RNToasty.Success({ title: 'Time updated!' })
                return await getSensorData()
            }
        } else {
            RNToasty.Error({ title: 'Connection failed' })
            console.warn('getSensorData', e)
        }
    }
}

export const getSensorTimes = async () => {
    try {
        const response = await fetch('http://192.168.4.1/sensors/time')
        const json = await response.json()
        return {
            timeStart: json.timeStart * 1000,
            timeLast: json.timeLast * 1000,
        }
    } catch (e) {
        RNToasty.Error({ title: 'Connection failed' })
        console.warn('getSensorData', e)
    }
}
