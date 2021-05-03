### Execute scripts examples for quickstart

`bin/run exec -fn fetchMarkets --base-url https://api.coincap.io/v2 script-examples/coincap/coincap-execution.js`

`bin/run execution --function-name saveMarkets --store-type FILE --base-url https://api.coincap.io/v2 script-examples/coincap/coincap-execution.js`

### Execution scripts with different options

This script is a simple start-up script to try. Command to run it: bin/run exec -fn simpleFunctionWithNoParameters
--base-url https://empty exec-functions.js NOTE:  By adding --debug parameter it is possible to debug by using Chrome or
Debug Adapter Protocol Command to run it:
`bin/run exec --debug -fn simpleFunctionWithNoParameters --base-url https://empty exec-functions.js`

```javascript
function simpleFunctionWithNoParameters() {
    console.log("My first function for console runner");
    return "Done!";
}
```

This script has a 'store' field in the input object. It can be used for storing data during the execution either in
memory, or in a file. In this example, we are using the default type of storage: CONSOLE, which results in data being
stored in memory, and printed out to the console output. Command to run it:
`bin/run exec -fn simpleFunctionToPlayWithStore --base-url https://empty exec-functions.js`

```javascript
function simpleFunctionToPlayWithStore({store}) {
    console.log("My first function to play with store");
    store.save("key1", "value1");
    store.save("key2", "value2");
    console.log("I can fetch my value by key from store " + store.get("key1"));
    store.delete("key2");
    console.log("I've already deleted the value so it is " + store.get("key2"));
    return "Done!";
}
```

This script has a store field in the input object. This input object also contains 'parameters' field, which consists of
key:value pairs. The values of the parameters can be accessed by their keys during script execution. Store filed is for
storing data during the execution either in memory or in a File. In this example we are using the default way of storing
it: CONSOLE Command to run it:
`bin/run exec -fn simpleFunctionToPlayWithStoreAndParameters --parameters=key1:value1,key2:value2 --base-url https://empty exec-functions.js`

```javascript
function simpleFunctionToPlayWithStoreAndParameters({store, parameters}) {
    console.log("My first function to play with store");
    let value1 = parameters.key1;
    let value2 = parameters.key2;
    store.save("key1", value1);
    store.save("key2", value2);
    console.log("I can fetch my value by key from store " + store.get("key1"));
    console.log("I can fetch my value by key from store " + store.get("key2"));
    return "Done!";
}
```

This script has store field in the input object. It can be used for storing data during the execution either in memory
or in a File In this example we are using FILE type of the data store and we are adding non-default path and the name of
our data store. Command to run
it: `bin/run exec -fn simpleFunctionToPlayWithStoreToFile --store-type FILE --file-store-directory=<<SEE THE COMMENT BELOW>>  --store-file-name testStore.txt --base-url https://empty
exec-functions.js`
Path on Windows to desktop: C:/Users/username/Desktop, Path on Mac to desktop:
/Users/username/Desktop.

```javascript
 function simpleFunctionToPlayWithStoreToFile({store}) {
    console.log("My first function to play with file store");
    store.save("key1", "value1");
    store.save("key2", "value2");
    console.log("I can fetch my value by key from store " + store.get("key1"));
    console.log("I can fetch my value by key from store " + store.get("key2"));
    return "Done!";
}
```

This script has client field in the input object, with its help we can do calls to API and process data from the
response. In this example we are just returning the result of the request to coincap API without any precessing. Command
to run it:
`bin/run exec -fn simpleFunctionForCallingSomeApi --base-url https://api.coincap.io/v2 exec-functions.js`

```javascript
  function simpleFunctionForCallingSomeApi({client}) {
    console.log("Downloading markets...");
    return client.fetch("/markets");
}
```

This script has client field in the input object, with its help we can do calls to API and process data from the
response. In this example we are not just returning the data from the response but adding it to the FILE store so that
we can open newly created store file and check the data inside. Command to run it:
`bin/run exec -fn simpleFunctionForApiCallAndStoreIt --store-type FILE --base-url https://api.coincap.io/v2 exec-functions.js`

```javascript
  async function simpleFunctionForApiCallAndStoreIt({client, store}) {
    console.log("Downloading markets...");
    let
        markets = await client.fetch("/markets")
    store.save("myKeyForMarkets", markets);
    return markets;
}
```

This script has client field in the input object, with its help we can do calls to API and process data from the
response. In this example we are not just returning the data from the response but at the first part we are filtering
it, and the second part is adding it to the FILE store so that we can open newly created store file and check the data
inside. Command to run it:
`bin/run exec -fn simpleFunctionWithClientResponseManipulations --store-type FILE --base-url https://api.coincap.io/v2 exec-functions.js`

```javascript
  async function simpleFunctionWithClientResponseManipulations({client, store}) {
    console.log("Downloading markets...");
    let markets = await client.fetch("/markets")
        .then(response => response.json())
        .then(data => data.data.filter(obj => obj.exchangeId === "acx"))
        .catch((err) => {
            throw new Error("Save markets execution error: " + err.message);
        });
    store.save("markets", markets);
    return markets;
}

```

This script has all three fields: client, store and parameters in the input object, with the client help we can call
different API's and process data from the response. In this example we are not just returning the data from the response
but filtering it with values from input parameters and save filtered response to the FILE store. Command to run it:
`bin/run exec -fn functionWithClientResponseManipulationsAndAllParams --store-type FILE --parameters=exchangeId:acx --base-url https://api.coincap.io/v2 exec-functions.js`

```javascript
 async function functionWithClientResponseManipulationsAndAllParams({client, store, parameters}) {
    console.log("Downloading markets...");
    let markets = await client.fetch("/markets")
        .then(response => response.json())
        .then(data => data.data.filter(obj => obj.exchangeId === parameters.exchangeId))
        .catch((err) => {
            throw new Error("Save markets execution error: " + err.message);
        });
    store.save("markets", markets);
    return markets;
}
```

This script has store field in the input object. It can be used for storing data during the execution either in memory
or in a File In this example we are adding --config parameter to simplify commandline input by adding base url and
parameters to the config.json file
[NOTE] parameters are called integrationParametersValues in the config json, it is a temporary solution and will be
renamed later. Store type is a FILE we are adding non-default path and the name of our data store. Command to run it:
`bin/run exec -fn allParamsAndConfigFunction --store-type FILE ---file-store-directory=<<SEE THE COMMENT BELOW>>
--store-file-name testStore.txt --config config.json exec-functions.js `
Path on Windows to desktop: C:
/Users/username/Desktop, Path on Mac to desktop: /Users/username/Desktop.

```javascript
  async function allParamsAndConfigFunction({client, store, parameters}) {
    console.log("Downloading markets...");
    let value1 = parameters.key1;
    let value2 = parameters.key2;
    store.save("key1", value1);
    store.save("key2", value2);
    let markets = await client.fetch("/markets")
        .then(response => response.json())
        .then(data => data.data.filter(obj => obj.exchangeId === parameters.exchangeId))
        .catch((err) => {
            throw new Error("Save markets execution error: " + err.message);
        });
    store.save("markets", markets);
    return markets;
}
  ```