integration.define({
  synchronizations: [],
  actions: [
    {
      name: "attachDocument",
      parameters: [
        {
          name: "attachments",
          type: "FILES",
          required: true,
        },
        {
          name: "description",
          type: "STRING",
          required: false,
        },
        {
          name: "keywords",
          type: "STRING",
          required: false,
        },
        {
          name: "folderId",
          type: "STRING",
          required: true,
        },
      ],
      function: attachDocument,
    },
  ],
});

async function attachDocument({ client, actionParameters }) {
  console.log(`attaching file(s)`);

  const filesArray = [];
  // `attachments`, which is of type FILES is not a standard array.
  // It is object which only offers 'forEach' method.
  // And `await` cannot be used in the forEach cycle (but can be used in for/of)
  actionParameters.attachments.forEach((file) => {
    filesArray.push(file);
  });

  for (const file of filesArray) {
    console.log("File:", file);
    const dotIndex = file.name.lastIndexOf(".");
    const name = file.name.slice(0, dotIndex);
    const type = file.name.slice(dotIndex + 1);
    const data = {
      Description: actionParameters.description,
      Keywords: actionParameters.keywords,
      FolderId: actionParameters.folderId,
      Name: name,
      Type: type,
    };

    const formData = new FormData();
    formData.append(
      "entity_document",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );
    formData.append("Body", file);

    const response = await client.fetch(
      "/services/data/v51.0/sobjects/Document/",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorMessage = `Request failed(${response.status}: ${response.statusText})`;
      console.error(errorMessage);
      console.error(await response.text());
      throw new Error(errorMessage);
    }

    console.log(`Attachment '${file.name}' posted`);
  }
}
