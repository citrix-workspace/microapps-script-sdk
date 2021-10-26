let _ = library.load("lodash");
let moment = library.load("moment-timezone");

integration.define({
  synchronizations: [
    {
      name: "tickets",
      fullSyncFunction: fullSyncTickets,
      incrementalSyncFunction: incrementalSyncTickets,
    },
    {
      name: "projects",
      fullSyncFunction: fullSyncProjects,
      // Projects API does not have any search criteria for date/time so only the full sync is possible.
    },
  ],
  actions: [
    {
      name: "bulkStatusUpdate",
      parameters: [
        {
          name: "tickets",
          type: "ARRAY",
          required: true,
          items: {
            type: "OBJECT",
            properties: [
              {
                name: "issueKey",
                type: "STRING",
              },
              {
                name: "status",
                type: "STRING",
              },
            ],
          },
        },
      ],
      function: bulkStatusUpdate,
    },
    {
      name: "createTicket",
      parameters: [
        {
          name: "projectKey",
          type: "STRING",
          required: true,
        },
        {
          name: "summary",
          type: "STRING",
          required: true,
        },
        {
          name: "description",
          type: "STRING",
          required: true,
        },
        {
          name: "reporterId",
          type: "STRING",
        },
        {
          name: "issueType",
          type: "STRING",
          required: false,
          defaultValue: "Task",
        },
        {
          name: "labels",
          type: "ARRAY",
          required: true,
          items: {
            type: "STRING",
          },
        },
      ],
      function: createTicket,
    },
    {
      name: "addAttachmentsOneByOne",
      parameters: [
        {
          name: "issueKey",
          type: "STRING",
          required: true,
        },
        {
          name: "attachments",
          type: "FILES",
          required: true,
        },
      ],
      function: addAttachmentsOneByOne,
    },
    {
      name: "addAttachmentsSingleRequest",
      parameters: [
        {
          name: "issueKey",
          type: "STRING",
          required: true,
        },
        {
          name: "attachments",
          type: "FILES",
          required: true,
        },
      ],
      function: addAttachmentsSingleRequest,
    },
  ],
  webhookListeners: [
    {
      name: "updateTicketWebhook",
      listenerFunction: ticketHasChanged,
      postActionFunction: downloadTicketDetails
    }
  ],
  model: {
    tables: [
      {
        name: "tickets",
        columns: [
          { name: "id", type: "INTEGER", primaryKey: true },
          { name: "key", type: "STRING", length: 100 },
          { name: "summary", type: "STRING", length: 100 },
          { name: "created", type: "DATETIME" },
          { name: "projectId", type: "INTEGER" },
          { name: "reporter_email", type: "STRING", length: 100 },
          { name: "reporter_name", type: "STRING", length: 100 },
          { name: "status", type: "STRING", length: 100 },
        ],
      },
      {
        name: "projects",
        columns: [
          { name: "id", type: "INTEGER", primaryKey: true },
          { name: "key", type: "STRING", length: 100 },
          { name: "name", type: "STRING", length: 100 },
          { name: "isPrivate", type: "BOOLEAN" },
        ],
      },
    ],
    relationships: [
      {
        name: "tickets2projects",
        primaryTable: "tickets",
        foreignTable: "projects",
        columnPairs: [
          {
            primaryKey: "projectId",
            foreignKey: "id",
          },
        ],
      },
    ],
  },
  integrationParameters: [
    {
      name: "daysToSync",
      type: "INTEGER",
      label: "Number of days to sync",
      description: "Synchronize only tickets newer then N days.",
      defaultValue: 30,
      required: true,
    },
  ],
});

async function syncTickets(dataStore, client, jql) {
  const searchParameters = {
    startAt: 0,
    maxResults: 50,
    fields: [
      "issuetype",
      "summary",
      "status",
      "reporter",
      "assignee",
      "priority",
      "description",
      "comment",
      "timetracking",
      "created",
      "updated",
      "fixVersions",
      "versions",
      "components",
      "labels",
      "project",
      "parent",
    ],
    jql,
  };

  let currentResponse;
  do {
    console.log(`syncTickets(startAt=${searchParameters.startAt}, jql=${jql})`);
    const ret = await client.fetch("rest/api/2/search", {
      method: "POST",
      body: JSON.stringify(searchParameters),
    });

    if (!ret.ok) {
      throw new Error(`Request failed(${ret.status}: ${ret.statusText})`);
    }
    currentResponse = await ret.json();
    console.log(
      `ticket response received, status: ${ret.status}, total: ${currentResponse.total}`
    );

    const tickets = currentResponse.issues.map((issue) => mapIssueToTicket(issue));

    console.log(
      `Saving ${tickets.length} to data store, [${tickets
        .map(({ project, summary }) => JSON.stringify({ project, summary }))
        .join(", ")}]`
    );

    dataStore.save("tickets", tickets);
    searchParameters.startAt += searchParameters.maxResults;
  } while (searchParameters.startAt < currentResponse.total);
}

function mapIssueToTicket(issue) {
  return {
    id: parseInt(issue.id),
    key: issue.key,
    summary: issue.fields.summary,
    // FIXME [MICROAPP-15341] date property won't work with webhook: Unsupported value type: class java.time.ZonedDateTime
    created: moment.utc(issue.fields.created).toDate(),
    projectId: parseInt(issue.fields.project.id, 10),
    reporter_email: issue.fields.reporter.emailAddress,
    reporter_name: issue.fields.reporter.displayName,
    status: issue.fields.status.name,
  };
}

function fullSyncTickets({ dataStore, client, integrationParameters }) {
  const jql = `updated >= -${integrationParameters.daysToSync}d`;
  return syncTickets(dataStore, client, jql);
}

function incrementalSyncTickets({
  dataStore,
  client,
  latestSynchronizationTime,
}) {
  print(`JIRA inc sync at ${latestSynchronizationTime}`);
  const updatedDateTime = moment(latestSynchronizationTime).format(
    "YYYY-MM-DD HH:mm"
  );
  const jql = `updated >= '${updatedDateTime}'`;
  return syncTickets(dataStore, client, jql);
}

async function fullSyncProjects({ dataStore, client }) {
  console.log("Full synchronization projects start");
  const response = await client.fetch("/rest/api/2/project/search");
  if (!response.ok) {
    throw new Error(
      `Request failed(${response.status}: ${response.statusText})`
    );
  }
  const convertProject = (project) => {
    const result = _.pick(project, ["id", "key", "name", "isPrivate"]);
    return { ...result, id: parseInt(result.id, 10) };
  };
  const projects = response.jsonSync().values.map(convertProject);
  print(
    `sync projects saving ${projects.length} projects: [${projects
      .map((p) => p.name)
      .join(", ")}]`
  );
  dataStore.save("projects", projects);
}

async function createTicket({ client, dataStore, actionParameters }) {
  console.log(`createTicket(${JSON.stringify(actionParameters)})`);
  const {
    projectKey,
    summary,
    description,
    issueType,
    labels,
    reporterId,
  } = actionParameters;
  const issueRequest = {
    fields: {
      project: {
        key: projectKey,
      },
      summary,
      description,
      labels,
      issuetype: {
        name: issueType,
      },
      ...(reporterId ? { reporter: { accountId: reporterId } } : undefined),
    },
  };

  const postIssueResponse = await client.fetch("/rest/api/2/issue", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(issueRequest),
  });
  if (!postIssueResponse.ok) {
    const errorMessage = `Request failed(${postIssueResponse.status}: ${postIssueResponse.statusText})`;
    console.error(errorMessage);
    console.log("Error body:", await postIssueResponse.text());
    throw new Error(errorMessage);
  }

  const { id, key, self: link } = await postIssueResponse.json();
  console.log(
    `Issue '${summary}' successfully created: id=${id}, key=${key}, link=${link}`
  );

  // uncomment, when webhook for updating ticket isn't active, otherwise change should be handled by webhook
  // await updateTicketFromSoR(client, dataStore, id);
}

async function updateTicketFromSoR(client, dataStore, issueIdOrKey) {
  const getIssueResponse = await client.fetch(`/rest/api/2/issue/${issueIdOrKey}`);
  if (!getIssueResponse.ok) {
    throw new Error(`Get ticket error: ${getIssueResponse.statusText}`);
  }

  const issue = await getIssueResponse.json();
  const ticket = mapIssueToTicket(issue);

  dataStore.save("tickets", ticket);
}

async function addAttachmentsOneByOne({ client, actionParameters }) {
  console.log(`attaching file to issue ${actionParameters.issueKey}`);
  for (const file of actionParameters.attachments) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await client.fetch(
      `/rest/api/2/issue/${actionParameters.issueKey}/attachments`,
      {
        method: "POST",
        headers: {
          "X-Atlassian-Token": "nocheck",
        },
        body: formData,
      }
    );
    if (!response.ok) {
      const errorMessage = `Request failed(${response.status}: ${response.statusText})`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    console.log(`Attachment ${file.name} posted`);
  }
}

async function addAttachmentsSingleRequest({ client, actionParameters }) {
  console.log(`attaching file(s) to issue ${actionParameters.issueKey}`);
  const formData = new FormData();
  actionParameters.attachments.forEach((file) => {
    formData.append("file", file);
  });
  const response = await client.fetch(
    `/rest/api/2/issue/${actionParameters.issueKey}/attachments`,
    {
      method: "POST",
      headers: {
        "X-Atlassian-Token": "nocheck",
      },
      body: formData,
    }
  );
  if (!response.ok) {
    const errorMessage = `Request failed(${response.status}: ${response.statusText})`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  console.log("Attachment(s) posted");
}

async function bulkStatusUpdate({ client, actionParameters }) {
  for (const ticket of actionParameters.tickets) {
    console.log(`Updating status for ${ticket.issueKey} ticket.`);
    const request = {
      transition: {
        id: ticket.status,
      },
    };

    const response = await client.fetch(
      `/rest/api/2/issue/${ticket.issueKey}/transitions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorMessage = `Request failed(${response.status}: ${response.statusText})`;
      console.error(errorMessage);
      console.error('Response body:', await response.text());
      throw new Error(errorMessage);
    }

    console.log(`Updated status for ${ticket.issueKey} ticket.`);
  }
}

async function ticketHasChanged({request, integrationParameters, dataStore, webhook}) {
  const { issue } = await request.json();
  if (issue) {
    console.log(`Ticket ${issue.key} has changed.`);
    webhook.schedulePostWebhookAction({issueIdOrKey: issue.key}); // issue.key can be also used here
  }
  return new Response;
}

async function downloadTicketDetails({parameters, client, dataStore}) {
  console.log(`Downloading changed details for ${parameters.issueIdOrKey} ticket.`)
  await updateTicketFromSoR(client, dataStore, parameters.issueIdOrKey);
}
