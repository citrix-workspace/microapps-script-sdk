## Script description
Very simple example with one synchronization and action with no authentication.

## Execution examples

###Execute sync
`bin/run sync --name currencies --base-url https://api.coincap.io/ script-examples/public/coincap/coincap.js`

###Execute action
`bin/run action --name  getRate  --parameters symbol:SAR --base-url https://api.coincap.io/ script-examples/public/coincap/coincap.js`

###Execute action without debug
`bin/run action --name  getRate  --parameters symbol:SAR --integration-parameters debug:false --base-url https://api.coincap.io/ script-examples/public/coincap/coincap.js`

###Run script execution
`bin/run exec -fn fetchMarkets --base-url https://api.coincap.io/ script-examples/public/coincap/coincap-execution.js`
`bin/run execution --function-name saveMarkets --data-store-type FILE  --base-url https://api.coincap.io/ script-examples/public/coincap/coincap-execution.js`