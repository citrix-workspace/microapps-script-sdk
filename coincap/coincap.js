integration.define({
  synchronizations: [
    {
      name: "currencies",
      fullSyncFunction: fullSyncCurrencies,
    },
  ],
  actions: [
    {
      name: "getRate",
      parameters: [
        {
          name: "symbol",
          type: "STRING",
          required: true,
        },
      ],
      function: actionGetRate,
    },
  ],
  model: {
    tables: [
      {
        name: "rates",
        columns: [
          {
            name: "id",
            type: "STRING",
            length: 100,
            primaryKey: true,
          },
          {
            name: "symbol",
            type: "STRING",
            length: 5,
          },
          {
            name: "rateUsd",
            type: "STRING",
          },
        ],
      },
      {
        name: "currencies",
        columns: [
          {
            name: "id",
            type: "STRING",
            length: 100,
            primaryKey: true,
          },
          {
            name: "symbol",
            type: "STRING",
            length: 5,
          },
        ],
      },
    ],
    relationships: [
      {
        name: "rates2currencies",
        primaryTable: "rates",
        foreignTable: "currencies",
        columnPairs: [
          {
            primaryKey: "id",
            foreignKey: "id",
          },
          {
            primaryKey: "symbol",
            foreignKey: "symbol",
          },
        ],
      },
    ],
  },
  integrationParameters: [
    {
      name: "debug",
      label: "Debug",
      type: "BOOLEAN",
      required: true,
      defaultValue: true,
    },
    {
      name: "simulateError",
      label: "Simulate error",
      type: "BOOLEAN",
      required: true,
      defaultValue: false,
    },
  ],
});

/**
 * Synchronize all currencies
 */
async function fullSyncCurrencies({ dataStore, client }) {
  let response = await client.fetch("/v2/assets", {
    headers: {
      "Content-Type": "text/json",
    },
  });
  console.log(`Status: ${response.status} (${response.statusText})`);
  if (response.ok) {
    let body = await response.json();
    dataStore.save("currencies", body.data);
  } else {
    throw new Error(response.statusText);
  }
}

/**
 * Fetch one rate and adds it to the cache
 * The example show how to work with action and integration parameter
 */
async function actionGetRate({
  actionParameters,
  client,
  dataStore,
  integrationParameters,
}) {
  const { symbol } = actionParameters;
  const { debug } = integrationParameters;
  if (debug) {
    console.log(`Requested symbol: ${symbol}`);
  }

  const response = await client.fetch("/v2/rates");
  const rates = await response.json();
  if (debug) {
    console.log(`Body: ${JSON.stringify(rates.data)}`);
  }
  const rate = rates.data.filter((record) => record.symbol === symbol);

  if (debug) {
    console.log("Rate: " + JSON.stringify(rate));
  }
  dataStore.save("rates", rate);
}
