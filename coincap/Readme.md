## Script description

Very simple example with one synchronization and action with no authentication.

This example shows:

- Tables with relation ships
- Simple synchronization
- Simple action

## Execution examples

### Execute sync

`bin/run sync --name currencies --base-url https://api.coincap.io/v2/ public/coincap/coincap.js`

### Execute action

`bin/run action --name getRate --parameters symbol:SAR --base-url https://api.coincap.io/v2/v2/ coincap/coincap.js`

### Execute action without debug

`bin/run action --name getRate --parameters symbol:SAR --integration-parameters debug:false --base-url https://api.coincap.io/v2/ coincap/coincap.js`