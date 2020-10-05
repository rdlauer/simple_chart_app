import { initializeBlock, useBase, useRecords, useGlobalConfig, TablePickerSynced, ViewPickerSynced, FieldPickerSynced, Box, FormField } from '@airtable/blocks/ui';
import React from 'react';

// This block uses chart.js and the react-chartjs-2 packages.
// Install them by running this in the terminal:
// npm install chart.js react-chartjs-2
import { Bar } from 'react-chartjs-2';

const GlobalConfigKeys = {
  TABLE_ID: 'tableId',
  VIEW_ID: 'viewId',
  X_FIELD_ID: 'xFieldId',
  Y_FIELD_ID: 'yFieldId',
};

function SimpleChartBlock() {
  const base = useBase();
  const globalConfig = useGlobalConfig();

  const tableId = globalConfig.get(GlobalConfigKeys.TABLE_ID);
  const table = base.getTableByIdIfExists(tableId);

  const viewId = globalConfig.get(GlobalConfigKeys.VIEW_ID);
  const view = table ? table.getViewByIdIfExists(viewId) : null;

  const xFieldId = globalConfig.get(GlobalConfigKeys.X_FIELD_ID);
  const xField = table ? table.getFieldByIdIfExists(xFieldId) : null;

  const yFieldId = globalConfig.get(GlobalConfigKeys.Y_FIELD_ID);
  const yField = table ? table.getFieldByIdIfExists(yFieldId) : null;

  const records = useRecords(view);

  const data = records && xField && yField ? getChartData({ records, xField, yField }) : null;

  return (
    <Box position="absolute" top={0} left={0} right={0} bottom={0} display="flex" flexDirection="column">
      <Settings table={table} />
      {data && (
        <Box position="relative" flex="auto" padding={3}>
          <Bar
            data={data}
            options={{
              maintainAspectRatio: false,
              scales: {
                xAxes: [
                  {
                    stacked: true,
                  },
                ],
                yAxes: [
                  {
                    stacked: true,
                    ticks: {
                      beginAtZero: true,
                    },
                  },
                ],
              },
              legend: {
                display: true,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

function getChartData({ records, xField, yField }) {
  const recordsByXValueString = new Map();
  const recordsByYValueString = new Map();
  const chartDatasets = [];
  for (const record of records) {
    // populate a key-value store with x-axis data and their associated records
    const xValue = record.getCellValue(xField);
    const xValueString = xValue === null ? null : record.getCellValueAsString(xField);

    if (!recordsByXValueString.has(xValueString)) {
      recordsByXValueString.set(xValueString, [record]);
    } else {
      recordsByXValueString.get(xValueString).push(record);
    }

    // populate a key-value store with y-axis data and their associated records
    const yValue = record.getCellValue(yField);
    const yValueString = yValue === null ? null : record.getCellValueAsString(yField);

    if (!recordsByYValueString.has(yValueString)) {
      recordsByYValueString.set(yValueString, [record]);
    } else {
      recordsByYValueString.get(yValueString).push(record);
    }
  }

  const xLabels = [...recordsByXValueString.keys()];

  const bgColors = ['#2d7ff9', '#18bfff', '#ff08c2', '#f82b60', '#ff6f2c', '#fcb400', '#20c933', '#8b46ff', '#666666'];
  let bgColorIndex = 0;

  for (const [yValueString, records] of recordsByYValueString.entries()) {
    // this array will store the count of each x-axis item per y-axis
    let chartData = [];

    for (const [xValueString, records] of recordsByXValueString.entries()) {
      let count = 0;
      for (const record of records) {
        if (record.getCellValue(yField) === yValueString) {
          count++;
        }
      }
      chartData.push(count);
    }

    chartDatasets.push({ label: yValueString, backgroundColor: bgColors[bgColorIndex], data: chartData });
    bgColorIndex++;
  }
  const data = {
    labels: xLabels,
    datasets: chartDatasets,
  };
  return data;
}

function Settings({ table }) {
  return (
    <Box display="flex" padding={3} borderBottom="thick">
      <FormField label="Table" width="25%" paddingRight={1} marginBottom={0}>
        <TablePickerSynced globalConfigKey={GlobalConfigKeys.TABLE_ID} />
      </FormField>
      {table && (
        <FormField label="View" width="25%" paddingX={1} marginBottom={0}>
          <ViewPickerSynced table={table} globalConfigKey={GlobalConfigKeys.VIEW_ID} />
        </FormField>
      )}
      {table && (
        <FormField label="X-axis field" width="25%" paddingLeft={1} marginBottom={0}>
          <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.X_FIELD_ID} />
        </FormField>
      )}
      {table && (
        <FormField label="Group by" width="25%" paddingLeft={1} marginBottom={0}>
          <FieldPickerSynced table={table} globalConfigKey={GlobalConfigKeys.Y_FIELD_ID} />
        </FormField>
      )}
    </Box>
  );
}

initializeBlock(() => <SimpleChartBlock />);
