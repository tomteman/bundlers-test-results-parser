# Bundlers Test Results Parser

CLI tool for parsing bundlers test results JSON and generating CSV files.

## Prerequisites

- Node.js
- npm

## Installation

1. Clone the repository:

```sh
git clone https://github.com/tomteman/bundlers-test-results-parser.git
cd bundlers-test-results-parser
```

2. Install dependencies
```sh
npm install
```

## Usage

To run the script, use the following command:

```sh
node parseTestResults.js --bundlerVersion <version>
```

- `--bundlerVersion` or `-bv`: Bundler version of the test results (06 or 07). Defaults to 07 if not provided.

Example:

```sh
node parseTestResults.js
```

```sh
node parseTestResults.js --bv 06
```

This will fetch the test results JSON from the appropriate URL and generate CSV files for each bundler with test results.

## License

This project is licensed under the MIT License.

