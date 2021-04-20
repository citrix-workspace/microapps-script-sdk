integration.define({
    "synchronizations": [
    ],
    actions: [
        {
            name: "getReceipts",
            parameters: [
                {
                    name: "limit",
                    type: "INTEGER",
                    required: false,
                    defaultValue: 100
                }
            ],
            function: getReceipts
        },
        {
            name: "addReceiptImage",
            parameters: [
                {
                    name: 'attachments',
                    type: 'FILES',
                    required: true
                }
            ],
            function: addReceiptImage,
        }
    ]
})

function getReceipts({client, actionParameters}) {
    console.log("getting receipts");
    const url = `/api/v3.0/expense/receiptimages?limit=${actionParameters.limit}`;
    const response = client.fetchSync(url, {
        method: 'GET'
    });
    if (response.ok) {
        console.log(response._bodyInit);
    } else {
        const errorMessage = `Request failed(${response.status}: ${response.statusText})`
        console.error(response._bodyText)
        console.error(errorMessage)
        throw new Error(errorMessage)
    }
}

function addReceiptImage({client, actionParameters}) {
    console.log(`attaching file(s)`);
    const url = `/api/v3.0/expense/receiptimages`;
    actionParameters.attachments.forEach(file => {
        const response = client.fetchSync(url, {
            method: 'POST',
            body: file
        });
        if (response.ok) {
            console.log(`Attachment ${file.name} posted`);
        } else {
            const errorMessage = `Request failed(${response.status}: ${response.statusText})`
            console.error(errorMessage)
            console.error(response._bodyText)
            throw new Error(errorMessage)
        }
    })
}

