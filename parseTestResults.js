#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const yargs = require('yargs');

const argv = yargs
  .option('version', {
    alias: 'v',
    description: 'Version of the test results (06 or 07)',
    type: 'string',
    choices: ['06', '07'],
    default: '07'
  })
  .help()
  .alias('help', 'h')
  .argv;

const version = argv.version;
const url = `https://bundler-test-results.erc4337.io/v${version}/history/history.json`;

// Parse datetime function
function parseDateTime(dateTimeString) {
  if (dateTimeString.length !== 15) {
    throw Error("invalid date input string");
  }

  const year = Number(dateTimeString.slice(0, 4));
  const month = Number(dateTimeString.slice(4, 6)) - 1;
  const day = Number(dateTimeString.slice(6, 8));
  const hour = Number(dateTimeString.slice(9, 11));
  const minute = Number(dateTimeString.slice(11, 13));
  const second = Number(dateTimeString.slice(13));

  const dateTime = new Date(year, month, day, hour, minute, second);

  if (isNaN(dateTime.getTime())) {
    throw Error("invalid date input string");
  }

  return dateTime;
}

// Format date to readable string
function formatDateTime(dateTime) {
  return dateTime.toISOString();
}

// Fetch and parse JSON data
fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    processTestResults(data);
  })
  .catch(error => {
    console.error(`Failed to fetch data: ${error}`);
  });

function processTestResults(testResults) {
  const bundlerTestMap = {};

  // First pass: Organize data by bundler and test name
  for (const datetime in testResults) {
    const bundlers = testResults[datetime];

    for (const bundlerName in bundlers) {
      const bundler = bundlers[bundlerName];

      if (!bundlerTestMap[bundlerName]) {
        bundlerTestMap[bundlerName] = {};
      }

      for (const testCaseName in bundler.testcase) {
        const testCase = bundler.testcase[testCaseName];
        const testName = testCase.name;
        const success = !testCase.error && !testCase.failure;

        if (!bundlerTestMap[bundlerName][testName]) {
          bundlerTestMap[bundlerName][testName] = {};
        }

        bundlerTestMap[bundlerName][testName][datetime] = success;
      }
    }
  }

  // Second pass: Write CSV files
  for (const bundlerName in bundlerTestMap) {
    const testCases = bundlerTestMap[bundlerName];
    const datetimes = new Set();

    for (const testName in testCases) {
      for (const datetime in testCases[testName]) {
        datetimes.add(datetime);
      }
    }

    // Sort datetimes
    const sortedDatetimes = Array.from(datetimes).sort((a, b) => {
      return parseDateTime(a) - parseDateTime(b);
    });

    const header = [
      { id: 'ohNo', title: 'OH NO!' },
      { id: 'testName', title: 'Test Name' }
    ];
    sortedDatetimes.forEach(datetime => header.push({ id: datetime, title: formatDateTime(parseDateTime(datetime)) }));

    const records = [];
    for (const testName in testCases) {
      const record = { testName };
      let allTrue = true;
      let allFalse = true;

      for (const datetime of sortedDatetimes) {
        const currentValue = testCases[testName][datetime] || false;
        if (currentValue) {
          allFalse = false;
        } else {
          allTrue = false;
        }
        record[datetime] = currentValue;
      }

      if (!allTrue && !allFalse) {
        record['ohNo'] = true;
      } else {
        record['ohNo'] = '';
      }

      records.push(record);
    }

    const writer = csvWriter({
      path: `${bundlerName}.csv`,
      header: header
    });

    writer.writeRecords(records)
      .then(() => {
        console.log(`Successfully wrote to ${bundlerName}.csv`);
      });
  }
}
