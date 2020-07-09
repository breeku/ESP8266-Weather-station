import React from 'react'

import { Dimensions } from 'react-native'

import { ProgressChart } from 'react-native-chart-kit'

const MemoryChart = ({ memory, chartConfig }) => {
    return (
        <ProgressChart
            data={{
                labels: ['Used'], // optional
                data: [(memory.start - memory.free) / memory.start],
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
