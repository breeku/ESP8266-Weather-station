import { RNToasty } from 'react-native-toasty'
import { updateTime } from '_services/time'

export const getSensorData = async () => {
    try {
        const response = await fetch('http://192.168.4.1/sensors/?offset=0')
        const json = await response.json()
        if (json.status && json.status.includes('Time needs to be updated')) {
            throw 'updating'
        }
        if (json.next) {
            //
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
