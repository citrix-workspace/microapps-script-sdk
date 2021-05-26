integration.define({
  synchronizations: [
    {
      name: "tasks",
      fullSyncFunction: fullSync,
    },
  ],
  actions: [
    {
      name: "uploadAttachment",
      parameters: [
        {
          name: "table_name",
          type: "STRING",
          required: true,
        },
        {
          name: "table_sys_id",
          type: "STRING",
          required: true,
        },
        {
          name: "attachments",
          type: "FILES",
          required: true,
        },
      ],
      function: uploadAttachment,
    },
    {
      name: "addAttachmentsAsBinary",
      parameters: [
        {
          name: "table_name",
          type: "STRING",
          required: true,
        },
        {
          name: "table_sys_id",
          type: "STRING",
          required: true,
        },
        {
          name: "file_name",
          type: "STRING",
          required: true,
        },
        {
          name: "attachments",
          type: "FILES",
          required: true,
        },
      ],
      function: addAttachmentsAsBinary,
    },
  ],
  model: {
    tables: [
      {
        name: "tasks",
        columns: [
          {
            name: "sys_id",
            type: "STRING",
            length: 100,
            primaryKey: true,
          },
        ],
      },
    ],
  },
});

async function fullSync({ client, dataStore }) {
  let offset = 0;
  do {
    console.log("tasks page " + offset);
    const response = await client.fetch(
      `/api/now/table/task?sysparm_query=active%3Dtrue&sysparm_limit=100&sysparm_offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(
        `Request failed(${response.status}: ${response.statusText})`
      );
    }

    console.log(`task response received, status: ${response.status}`);
    const body = await response.json();
    dataStore.save("tasks", body.result);
    offset += 100;
  } while (offset < 300);
}

async function uploadAttachment({ client, actionParameters }) {
  console.log(
    `attaching file(s) to table ${actionParameters.table_name}, table_sys_id ${actionParameters.table_sys_id}`
  );

  for (const file of actionParameters.attachments) {
    const formData = new FormData();
    formData.append("table_name", actionParameters.table_name);
    formData.append("table_sys_id", actionParameters.table_sys_id);
    formData.append("file", file);

    const response = await client.fetch("/api/now/attachment/upload", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const errorMessage = `Request failed(${response.status}: ${response.statusText})`;
      console.error(errorMessage);
      console.log(await response.text());
      throw new Error(errorMessage);
    }

    console.log(`Attachment ${file.name} posted`);
  }
}

async function addAttachmentsAsBinary({ client, actionParameters }) {
  console.log(
    `attaching file(s) to table ${actionParameters.table_name}, table_sys_id ${actionParameters.table_sys_id}`
  );

  for (const file of actionParameters.attachments) {
    const url = `/api/now/attachment/file?table_name=${actionParameters.table_name}&table_sys_id=${actionParameters.table_sys_id}&file_name=${file.name}`;
    const response = await client.fetch(url, {
      method: "POST",
      body: file,
    });

    if (!response.ok) {
      const errorMessage = `Request failed(${response.status}: ${response.statusText})`;
      console.error(errorMessage);
      console.log(await response.text());
      throw new Error(errorMessage);
    }

    console.log(`Attachment ${file.name} posted`);
  }
}
