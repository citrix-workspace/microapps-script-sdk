async function saveMarkets({client, store}) {
    console.log('Downloading markets...');
    let markets = await client.fetch('/v2/markets')
        .then(response => response.json())
        .then(data => data.data.filter(obj => obj.exchangeId === 'acx'))
        .catch((err) => {
            throw new Error('Save markets execution error: ' + err.message);
        });
    store.save('markets', markets);
    return markets;
}

function fetchMarkets({client, store}) {
    console.log('Downloading markets...');
    store.save('tesKey', 'testValue');
    let value = store.get('key');
    return client.fetch('/v2/markets')
        .then(response => response.json())
        .then(data => data.data.filter(obj => obj.exchangeId === 'acx'))
        .catch((err) => {
            throw new Error('Fetch market execution error: ' + err.message);
        });
}