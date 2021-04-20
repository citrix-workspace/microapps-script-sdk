let _ = library.load("lodash");
let moment = library.load("moment-timezone");

function syncTickets(dataStore, client, jql) {
    var searchParameters = {
        "startAt": 0,
        "maxResults": 50,
        "fields": ["issuetype", "summary", "status", "reporter", "assignee", "priority", "description", "comment", "timetracking", "created", "updated", "fixVersions", "versions", "components", "labels", "project", "parent"],
        jql,
    }

    do {
        console.log(`syncTickets(startAt=${searchParameters.startAt}, jql=${jql})`);
        var ret = client.fetchSync("rest/api/2/search", {method: "POST", body: JSON.stringify(searchParameters)});

        if(!ret.ok) {
            throw new Error(`Request failed(${ret.status}: ${ret.statusText})`)
        }
        currentResponse = ret.jsonSync();
        console.log("ticket response received, status: " + ret.status + ", total: " + currentResponse.total);

        let issues = currentResponse.issues.map(issue => {
            return {
                "id": parseInt(issue.id),
                "key": issue.key,
                "summary": issue.fields.summary,
                "created": moment.utc(issue.fields.created).toDate(),
                "projectId": parseInt(issue.fields.project.id, 10),
                "reporter_email": issue.fields.reporter.emailAddress,
                "reporter_name": issue.fields.reporter.displayName,
                "status": issue.fields.status.name,
            }
        });

        console.log(`Saving ${issues.length} to data store, [${issues.map(({project, summary}) => JSON.stringify({project, summary})).join(", ")}]`);

        dataStore.save("tickets", issues);
        searchParameters.startAt += searchParameters.maxResults;
    } while (searchParameters.startAt < currentResponse.total)
}

function fullSyncTickets({dataStore, client, integrationParameters}) {
    const jql = `updated >= -${integrationParameters.daysToSync}d`;
    return syncTickets(dataStore, client, jql);
}

function incrementalSyncTickets({dataStore, client, latestSynchronizationTime}) {
    print(`JIRA inc sync at ${latestSynchronizationTime}`)
    const updatedDateTime = moment(new Date(latestSynchronizationTime)).format('YYYY-MM-DD HH:mm');
    const jql = `updated >= '${updatedDateTime}'`
    return syncTickets(dataStore, client, jql)
}

function fullSyncProjects({dataStore, client}) {
    console.log('Full synchronization projects start')
    const response = client.fetchSync("/rest/api/2/project/search")
    if(!response.ok) {
        throw new Error(`Request failed(${response.status}: ${response.statusText})`)
    }
    const convertProject = project => {
        const result = _.pick(project, ['id', 'key', 'name', 'isPrivate']);
        return {...result, id: parseInt(result.id, 10)}
    }
    const projects = response.jsonSync().values.map(convertProject);
    print(`sync projects saving ${projects.length} projects: [${projects.map(p => p.name).join(', ')}]`)
    dataStore.save("projects", projects);
}

async function createTicket({client, dataStore, actionParameters}) {
    console.log(`createTicket(${JSON.stringify(actionParameters)})`)
    const {projectKey, summary, description, issueType, reporterId} = actionParameters
    const issueRequest = {
        fields: {
            project: {
                key: projectKey
            },
            summary,
            description,
            issuetype: {
                name: issueType
            },
            ...(reporterId ? {reporter: {accountId: reporterId}} : undefined)
        }
    }

    const postIssueResponse = client.fetchSync('/rest/api/2/issue',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(issueRequest)
        })
    if (postIssueResponse.ok) {
        const {id, key, self: link} = await postIssueResponse.json()
        console.log(`Issue '${summary}' successfully created: id=${id}, key=${key}, link=${link}`)

        const getIssueResponse = client.fetchSync(`/rest/api/2/issue/${id}`)
        let issueFields = null;
        if (getIssueResponse.ok) {
            ({fields: issueFields} = await getIssueResponse.json())
        } else {
            throw new Error(`Get ticket error: ${getIssueResponse.statusText}`)
        }

        const ticketModel = {
            id: parseInt(id),
            key,
            summary,
            created: new Date(issueFields.created),
            project: projectKey,
            reporter_email: issueFields.reporter.emailAddress,
            reporter_name: issueFields.reporter.displayName,
            status: issueFields.status.name,
        }

        dataStore.save('tickets', ticketModel)
    } else {
        const errorMessage = `Request failed(${postIssueResponse.status}: ${postIssueResponse.statusText})`
        console.error(errorMessage)
        throw new Error(errorMessage)
    }
}

function addAttachmentsOneByOne({client, actionParameters}) {
    console.log(`attaching file to issue ${actionParameters.issueKey}`);
    const url = `/rest/api/2/issue/${actionParameters.issueKey}/attachments`;
    actionParameters.attachments.forEach(file => {
        const formData = new FormData();
        formData.append("file", file);
        const response = client.fetchSync(url, {
            method: 'POST',
            headers: {
                "X-Atlassian-Token": "nocheck"
            },
            body: formData
        });
        if (response.ok) {
            console.log(`Attachment ${file.name} posted`);
        } else {
            const errorMessage = `Request failed(${response.status}: ${response.statusText})`
            console.error(errorMessage)
            throw new Error(errorMessage)
        }
    })
}

function addAttachmentsSingleRequest({client, actionParameters}) {
    console.log(`attaching file(s) to issue ${actionParameters.issueKey}`);
    const formData = new FormData();
    const url = `/rest/api/2/issue/${actionParameters.issueKey}/attachments`;
    actionParameters.attachments.forEach(file => {
        formData.append("file", file);
    });
    const response = client.fetchSync(url, {
        method: 'POST',
        headers: {
            "X-Atlassian-Token": "nocheck"
        },
        body: formData
    });
    if (response.ok) {
        console.log('Attachment(s) posted');
    } else {
        const errorMessage = `Request failed(${response.status}: ${response.statusText})`
        console.error(errorMessage)
        throw new Error(errorMessage)
    }
}

integration.define({
    "synchronizations": [
        {
            "name": "tickets", // Logical name
            "fullSyncFunction": fullSyncTickets,
            "incrementalSyncFunction": incrementalSyncTickets,
        },
        {
            "name": "projects", // Logical name
            "fullSyncFunction": fullSyncProjects,
            // Projects API does not have any search criteria for date/time so only the full sync is possible.
        }
    ],
    actions: [
        {
            name: 'createTicket',
            parameters: [
                {
                    name: 'projectKey',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'summary',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'description',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'reporterId',
                    type: 'STRING',
                },
                {
                    name: 'issueType',
                    type: 'STRING',
                    required: false,
                    defaultValue: 'Task'
                }
            ],
            function: createTicket,
        },
        {
            name: "addAttachmentsOneByOne",
            parameters: [
                {
                    name: 'issueKey',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'attachments',
                    type: 'FILES',
                    required: true
                }
            ],
            function: addAttachmentsOneByOne,
        },
        {
            name: "addAttachmentsSingleRequest",
            parameters: [
                {
                    name: 'issueKey',
                    type: 'STRING',
                    required: true
                },
                {
                    name: 'attachments',
                    type: 'FILES',
                    required: true
                }
            ],
            function: addAttachmentsSingleRequest,
        }
    ],
    "model": {
        "tables": [
            {
                "name": "tickets",
                "columns": [
                    {"name": "id", "type": "INTEGER", "primaryKey": true},
                    {"name": "key", "type": "STRING", "length": 100},
                    {"name": "summary", "type": "STRING", "length": 100},
                    {"name": "created", "type": "DATETIME"},
                    {"name": "projectId", "type": "INTEGER"},
                    {"name": "reporter_email", "type": "STRING", "length": 100},
                    {"name": "reporter_name", "type": "STRING", "length": 100},
                    {"name": "status", "type": "STRING", "length": 100},
                ]
            },
            {
                "name": "projects",
                "columns": [
                    {"name": "id", "type": "INTEGER", "primaryKey": true},
                    {"name": "key", "type": "STRING", "length": 100},
                    {"name": "name", "type": "STRING", "length": 100},
                    {"name": "isPrivate", "type": "BOOLEAN"}
                ]
            }
        ],
        "relationships": [
            {
                "name": "tickets2projects",
                "primaryTable": "tickets",
                "foreignTable": "projects",
                "columnPairs": [
                    {
                        "primaryKey": "projectId",
                        "foreignKey": "id"
                    }
                ]
            }
        ]
    },
    'integrationParameters': [
        {
            name: 'daysToSync',
            type: 'INTEGER',
            label: 'Number of days to sync',
            description: 'Synchronize only tickets newer then N days.',
            defaultValue: 30,
            required: true
        }
    ]
})
