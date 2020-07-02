import React from 'react'

import { Text } from 'react-native-elements'

import { LineChart } from 'react-native-chart-kit'

import moment from 'moment'

const TemperatureChart = ({ sensors }) => {
    const dateFormat = d => {
        return moment.utc(d.timestamp * 1000).format('HH:mm')
    }
    return (
        <LineChart
            data={{
                labels: sensors.map(x => dateFormat(x)),
                datasets: [
                    {
                        data: sensors.map(x => x.temperature),
                    },
                ],
            }}
            width={sensors.length * 50 + 100} // from react-native
            height={270}
            yAxisSuffix="C"
            yAxisInterval={1} // optional, defaults to 1
            chartConfig={{
                backgroundColor: '#fcfcfc',
                backgroundGradientFrom: '#fcfcfc',
                backgroundGradientTo: '#ebebeb',
                decimalPlaces: 1, // optional, defaults to 2dp
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                    borderRadius: 16,
                },
                propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#fff',
                },
            }}
            style={{
                marginVertical: 16,
                borderRadius: 16,
            }}
            renderDotContent={({ x, y, index }) => (
                <Text
                    style={{
                        position: 'absolute',
                        paddingTop: y,
                        paddingLeft: x,
                    }}>
                    {sensors[index].temperature}
                </Text>
            )}
        />
    )
}

export default TemperatureChart
