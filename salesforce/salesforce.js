integration.define({
    "synchronizations": [
    ],
    actions: [
        {
            name: "attachDocument",
            parameters: [
                {
                    name: 'attachments',
                    type: 'FILES',
                    required: true
                },
                {
                    name: 'description',
                    type: 'STRING',
                    required: false
                },
                {
                    name: 'keywords',
                    type: 'STRING',
                    required: false
                },
                {
                    name: 'folderId',
                    type: 'STRING',
                    required: true
                }
            ],
            function: attachDocument,
        }
    ]
})

function attachDocument({client, actionParameters}) {
    console.log(`attaching file(s)`);
    const url = `/services/data/v51.0/sobjects/Document/`;
    actionParameters.attachments.forEach(file => {
        const formData = new FormData();
        const dotIndex = file.name.lastIndexOf('.');
        const name = file.name.slice(0, dotIndex);
        const type = file.name.slice(dotIndex + 1);
        const blob = new Blob(["{  \n" +
        `    \"Description\" : \"${actionParameters.description}\",\n` +
        `    \"Keywords\" : \"${actionParameters.keywords}\",\n` +
        `    \"FolderId\" : \"${actionParameters.folderId}\",\n` +
        `    \"Name\" : \"${name}\",\n` +
        `    \"Type\" : \"${type}\"\n` +
        "}"], {type: 'application/json'});
        formData.append("entity_document", blob)
        formData.append("Body", file);
        const response = client.fetchSync(url, {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            console.log(`Attachment ${file.name} posted`);
        } else {
            const errorMessage = `Request failed(${response.status}: ${response.statusText})`;
            console.error(errorMessage);
            console.error(response._bodyText);
            throw new Error(errorMessage);
        }
    })
}
