import { RNToasty } from 'react-native-toasty'
import { updateTime } from '_services/time'

const OFFSET_NEXT = 3 // gets the next key:value from midst of a json file, so without ','

export const getSensorData = async () => {
    try {
        let result = {}
        const response = await fetch('http://192.168.4.1/sensors/?offset=0')
        const json = await response.json()
        if (json.status && json.status.includes('Time needs to be updated')) {
            throw 'updating'
        }
        console.log(json.total)
        if (json.next) {
            const next = await fetch(
                'http://192.168.4.1/sensors/?offset=' +
                    (json.next + OFFSET_NEXT),
            )
            const nextJson = await next.json()
            console.log(nextJson.total)
            result = { ...json, ...nextJson }
        }
        return result.sensors
    } catch (e) {
        if (e === 'updating') {
            const response = await updateTime()
            RNToasty.Info({ title: 'Updating time...' })
            if (response) return await getSensorData()
        } else {
            RNToasty.Error({ title: 'Connection failed' })
            console.warn('getSensorData', e)
        }
    }
}
