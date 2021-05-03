function simpleFunctionWithNoParameters() {
    console.log("My first function for console runner");
    return "Done!";
}

function simpleFunctionToPlayWithStore({store}) {
    console.log("My first function to play with store");
    store.save("key1", "value1");
    store.save("key2", "value2");
    console.log("I can fetch my value by key from store " + store.get("key1"));
    store.delete("key2");
    console.log("I've already deleted the value so it is " + store.get("key2"));
    return "Done!";
}

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

function simpleFunctionToPlayWithStoreToFile({store}) {
    console.log("My first function to play with file store");
    store.save("key1", "value1");
    store.save("key2", "value2");
    console.log("I can fetch my value by key from store " + store.get("key1"));
    console.log("I can fetch my value by key from store " + store.get("key2"));
    return "Done!";
}

function simpleFunctionForCallingSomeApi({client}) {
    console.log("Downloading markets...");
    return client.fetch("/markets");
}

async function simpleFunctionForApiCallAndStoreIt({client, store}) {
    console.log("Downloading markets...");
    let markets = await client.fetch("/markets")
    store.save("myKeyForMarkets", markets.json());
    return markets;
}

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