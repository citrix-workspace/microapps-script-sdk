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

function fullSync({ client, dataStore }) {
  let offset = 0;
  do {
    console.log("tasks page " + offset);
    let sysparm_offset = offset++ * 100 + "";
    console.log(encodeURIComponent("aaa bbb"));
    let response = client.fetchSync(
      "/api/now/table/task?sysparm_query=active%3Dtrue&sysparm_limit=100&sysparm_offset=" +
        sysparm_offset
    );

    if (!response.ok)
      throw new Error(
        `Request failed(${response.status}: ${response.statusText})`
      );

    console.log("task response received, status: " + response.status);
    response.json().then((body) => {
      dataStore.save("tasks", body.result);
    });
  } while (offset < 3);
}

function uploadAttachment({ client, actionParameters }) {
  console.log(
    `attaching file(s) to table ${actionParameters.table_name}, table_sys_id ${actionParameters.table_sys_id}`
  );
  const url = `/api/now/attachment/upload`;
  actionParameters.attachments.forEach((file) => {
    const formData = new FormData();
    formData.append("table_name", actionParameters.table_name);
    formData.append("table_sys_id", actionParameters.table_sys_id);
    formData.append("file", file);
    const response = client.fetchSync(url, {
      method: "POST",
      body: formData,
    });
    if (response.ok) {
      console.log(`Attachment ${file.name} posted`);
    } else {
      const errorMessage = `Request failed(${response.status}: ${response.statusText})`;
      console.error(errorMessage);
      console.log(response._bodyText);
      throw new Error(errorMessage);
    }
  });
}

function addAttachmentsAsBinary({ client, actionParameters }) {
  console.log(
    `attaching file(s) to table ${actionParameters.table_name}, table_sys_id ${actionParameters.table_sys_id}`
  );
  actionParameters.attachments.forEach((file) => {
    const url = `/api/now/attachment/file?table_name=${actionParameters.table_name}&table_sys_id=${actionParameters.table_sys_id}&file_name=${file.name}`;
    const response = client.fetchSync(url, {
      method: "POST",
      body: file,
    });
    if (response.ok) {
      console.log(`Attachment ${file.name} posted`);
    } else {
      const errorMessage = `Request failed(${response.status}: ${response.statusText})`;
      console.error(errorMessage);
      console.error(response._bodyText);
      throw new Error(errorMessage);
    }
  });
}
