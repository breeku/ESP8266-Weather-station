import React from 'react'

import { Text } from 'react-native-elements'

import { LineChart } from 'react-native-chart-kit'

const HumidityChart = ({ sensors, chartConfig }) => {
    return (
        <LineChart
            data={{
                labels: sensors.map(x => x.timestamp),
                datasets: [
                    {
                        data: sensors.map(x => x.humidity),
                    },
                ],
            }}
            width={sensors.length * 50 + 100} // from react-native
            height={270}
            yAxisSuffix="C"
            yAxisInterval={1} // optional, defaults to 1
            chartConfig={chartConfig}
            style={{
                marginVertical: 16,
                borderRadius: 16,
            }}
            renderDotContent={({ x, y, index }) => (
                <Text
                    key={index}
                    style={{
                        position: 'absolute',
                        paddingTop: y,
                        paddingLeft: x,
                    }}>
                    {sensors[index].humidity}
                </Text>
            )}
        />
    )
}

export default HumidityChart
