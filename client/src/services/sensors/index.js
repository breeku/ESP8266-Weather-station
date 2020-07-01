import { RNToasty } from 'react-native-toasty'
import { updateTime } from '_services/time'

export const getSensorData = async date => {
    let result = {}
    let number = 0
    try {
        const response = await fetch(
            'http://192.168.4.1/sensors/?date=' + date + '&number=' + number,
        )
        let json = await response.json()
        result = json
        if (json.status && json.status.includes('Time needs to be updated')) {
            throw 'updating'
        } else if (json.status && json.status.includes('File not found')) {
            throw '404'
        }
        while (json.next !== number) {
            number++
            const response = await fetch(
                'http://192.168.4.1/sensors/?date=' +
                    date +
                    '&number=' +
                    number,
            )
            json = await response.json()
            result.sensors = [...result.sensors, ...json.sensors]
        }
        return result
    } catch (e) {
        if (e === 'updating') {
            const response = await updateTime()
            RNToasty.Info({ title: 'Updating time...' })
            if (response) {
                RNToasty.Success({ title: 'Time updated!' })
                return await getSensorData(date)
            }
        } else if (e === '404') {
            RNToasty.Error({ title: 'File not found!' })
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
