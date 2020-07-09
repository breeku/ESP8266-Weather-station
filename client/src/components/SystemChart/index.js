import React from 'react'

import { Dimensions } from 'react-native'

import { ProgressChart } from 'react-native-chart-kit'

const MemoryChart = ({ filesystem, chartConfig }) => {
    return (
        <ProgressChart
            data={{
                labels: ['Used'], // optional
                data: [filesystem.used / filesystem.total],
            }}
            width={Dimensions.get('window').width}
            height={220}
            strokeWidth={16}
            radius={64}
            chartConfig={chartConfig}
            hideLegend={false}
        />
    )
}

export default MemoryChart
