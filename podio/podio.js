/*
DEVELOPER NOTES
The following is a list of what needs to be improved next before this script can be used as a standalone integration:

IN PODIO INTEGRATION:
- "Podio TRANSFORMATION SCRIPT" needs to be updated so that information about the file comes through and can be used in microapps (example podio_item_id = 1689610293)
- "uploadFile" service action is missing prevalidation and data update after action
- "uploadFile" service action is replacing any existing attachments with the new one

AS A STANDALONE INTEGRATION:
- OAuth2.0 with "app" client credentials does not WORK and needs to be finetuned
- Broadcast endpoint needs an Incremental Synchronisation (use a different endpoint than fullSync: /item/app/{{broadcast_app_id}}/filter/{{broadcast_view_id}})
- Categories; Criticality and Status have only "dummy/empty" function instead of Full Synch and therefore needs to be finished
- "updateBroadcast" service action can update only "title" so other attributes may need to be added
- "updateBroadcast" service action is missing prevalidation and data update after action

*/

/* eslint no-unused-vars: "off" */
/* eslint no-extra-boolean-cast: "off" */

const _ = library.load('lodash')
const moment = library.load('moment-timezone')

// START OF PODIO TRANSFORMATION SCRIPT
// This script is transforming a heavily nested JSON structure of Podio response to a flat JSON more suitable for our needs

const PODIO_VALUE_KEYS = ['value', 'start_utc']

function podioFieldExtract(valueObject, fieldType, options) {
    for (const k of PODIO_VALUE_KEYS) {
        if (valueObject[k] !== undefined) {
            if (fieldType === 'number') {
                return parseFloat(valueObject[k])
            } else if (fieldType === 'app') {
                return valueObject[k].item_id
            } else if (fieldType === 'category') {
                if (options && options.asBoolean) {
                    if (!valueObject[k]) {
                        return null
                    }
                    if (!valueObject[k].text) {
                        return null
                    }

                    return ['yes', 'y', 'true', '1', 'on'].includes(
                        valueObject[k].text.toLowerCase(),
                    )
                } else {
                    return valueObject[k].id
                }
            } else {
                return valueObject[k]
            }
        }
    }
    return null
}

function formatItem(item, options) {
    const ret = {}
    if (item.fields) {
        for (const field of item.fields) {
            if (field.label) {
                const label = field.label.replace(/ /g, '_')
                if (field.values && field.values.length > 0) {
                    const fieldOptions = {}
                    if (!!options?.asBoolean?.indexOf(field.label)) {
                        fieldOptions.asBoolean = true
                    }
                    if (!!options?.explode?.indexOf(field.label)) {
                        // Explode the list into subkeys
                        ret[label] = {}
                        for (let j = 0; j < field.values.length; j++) {
                            ret[label][j.toString()] = podioFieldExtract(
                                field.values[j],
                                field.type,
                                fieldOptions,
                            )
                        }
                    } else {
                        // Always take the first value from the list
                        ret[label] = podioFieldExtract(field.values[0], field.type, fieldOptions)
                    }
                }
            }
        }
    }
    if (item.item_id) {
        ret._podio_item_id = item.item_id
    }
    if (item.app_item_id) {
        ret._podio_app_item_id = item.app_item_id
    }
    return ret
}

function formatItems(items = [], options) {
    return items.map(item => formatItem(item, options))
}

function handleResponse(response, debug = false) {
    let responseData
    if (response?.items) {
        responseData = formatItems(response.items)
    } else if (response?.fields) {
        responseData = formatItem(response.data)
    } else {
        try {
            responseData = typeof response === 'string' ? JSON.parse(response) : response
        } catch (_) {}
    }
    if (debug) console.log(JSON.stringify(responseData))
    return responseData || {}
}

// END OF PODIO TRANSFORMATION SCRIPT

async function syncBroadcasts(dataStore, client, app_id, logEnabled) {
    // this can be used as a base for Incremental Synchronisation for Broadcast endpoint, just this endpoint /item/app/{{broadcast_app_id}}/filter/{{broadcast_view_id}} needs to be used with a different method and pagination
    let broadcastOffset = 0
    const broadcastLimit = 10
    let pageLength = 0
    let ret = {}
    do {
        if (logEnabled) {
            console.log(
                `REQUESTED = syncBroadcasts = app_id: ${app_id} = "item/app/${app_id}?limit=${broadcastLimit}&offset=${broadcastOffset}", {method: "GET"}`,
            )
        }

        ret = await client.fetch(
            `item/app/${app_id}?limit=${broadcastLimit}&offset=${broadcastOffset}`,
            {method: 'GET'},
        )

        if (!ret.ok) {
            throw new Error(`syncBroadcasts - request failed (${ret.status}: ${ret.statusText})`)
        }
        const jsonResponse = await ret.json()

        if (logEnabled) {
            console.log(
                `RECEIVED = syncBroadcasts = response with status: ${ret.status}, total records: ${jsonResponse.total}`,
            )
        }

        const transformedResponse = handleResponse(jsonResponse)
        if (logEnabled) {
            console.log(`TRANSFORMED = syncBroadcasts = ` + JSON.stringify(transformedResponse))
        }

        const items = transformedResponse.map(item => {
            return {
                podio_item_id: parseInt(item._podio_item_id, 10),
                category_id: parseInt(item.Category, 10),
                criticality_id: parseInt(item.Criticality, 10),
                department: item.Department,
                end_date: moment.utc(item.End_Date).toDate(),
                image_url: item.Image_Url,
                link: item.Link,
                message: item.Message,
                podio_app_item_id: parseInt(item._podio_app_item_id, 10),
                published_by: item.Published_By,
                status_id: parseInt(item.Status, 10),
                title: item.Title,
            }
        })

        if (logEnabled) {
            console.log(
                `STORING = ${items.length} records, [${items
                    .map(({title, podio_item_id}) => JSON.stringify({title, podio_item_id}))
                    .join(', ')}]`,
            )
        }

        if (items.length > 0) {
            dataStore.save('broadcasts', items)
        }
        broadcastOffset = broadcastOffset + broadcastLimit
        if (logEnabled) {
            console.log(`STORED = ${items.length} records`)
        }
        pageLength = items.length
    } while (pageLength > 0 && ret.ok)
}

function fullSyncBroadcasts({dataStore, client, integrationParameters}) {
    console.log(`SYNC START - Broadcasts`)
    return syncBroadcasts(
        dataStore,
        client,
        integrationParameters.broadcast_app_id,
        integrationParameters.talkativeConsole,
    )
}

async function fullSyncNone({dataStore, client, integrationParameters}) {
    // this fullSync function is here as a placeholder for endpoints with not yet implemented synchronisation
    // Categories; Criticality and Status have only "dummy/empty" function instead of Full Synch and therefore needs to be finished

    if (integrationParameters.talkativeConsole) {
        console.log('Full synchronization of NONE executed and finished')
    }
}

async function updateBroadcast({dataStore, client, actionParameters, integrationParameters}) {
    const logEnabled = integrationParameters.talkativeConsole

    if (logEnabled) {
        console.log(`Update Broadcast = values (${JSON.stringify(actionParameters)})`)
    }
    const {broadcastItemId, broadcastTitle} = actionParameters
    const updateBroadcastBody = {
        fields: {
            title: [{value: broadcastTitle}],
        },
    }

    if (logEnabled) {
        console.log(
            `Action Parameters = broadcastItemId:${broadcastItemId}; broadcastTitle:${broadcastTitle}`,
        )
        console.log(
            `Request = /item/${broadcastItemId}; body: ${JSON.stringify(updateBroadcastBody)}`,
        )
    }

    const updateBroadcastResponse = await client.fetch(`/item/${broadcastItemId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateBroadcastBody),
    })
    if (!updateBroadcastResponse.ok) {
        const errorMessage = `updateBroadcast = request failed (${updateBroadcastResponse.status}: ${updateBroadcastResponse.statusText})`
        console.error(errorMessage)
        throw new Error(errorMessage)
    }

    if (logEnabled) {
        console.log(`updateBroadcast = updated with Title: ${broadcastTitle} `)
    }
}

async function uploadFile({client, actionParameters, integrationParameters}) {
    const logEnabled = integrationParameters.talkativeConsole
    if (logEnabled) {
        console.log(`uploadFile = file(s) for item ${actionParameters.broadcastItemId}`)
    }

    for (const file of actionParameters.attachment) {
        const formData = new FormData()
        formData.append('filename', file.name)
        formData.append('source', file)

        const response = await client.fetch('/file', {
            method: 'POST',
            body: formData,
        })
        if (!response.ok) {
            const errorMessage = `uploadFile = Upload Request failed (${response.status}: ${response.statusText})`
            console.error(errorMessage)
            throw new Error(errorMessage)
        }
        const jsonResponse = await response.json()

        if (logEnabled) {
            console.log(`uploadFile = response: ${JSON.stringify(jsonResponse)}`)
            console.log(
                `uploadFile = ${file.name} uploaded as ${jsonResponse.name} (${jsonResponse.file_id})`,
            )
        }

        const updateBroadcastBody = {
            file_ids: [jsonResponse.file_id],
        }
        const updateBroadcastResponse = await client.fetch(
            `/item/${actionParameters.broadcastItemId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateBroadcastBody),
            },
        )
        if (!updateBroadcastResponse.ok) {
            const errorMessage = `uploadFile = Attach Request failed (${updateBroadcastResponse.status}: ${updateBroadcastResponse.statusText})`
            console.error(errorMessage)
            throw new Error(errorMessage)
        }
        if (logEnabled) {
            console.log(
                `uploadFile = Broadcast Updated ${actionParameters.broadcastItemId} with file: ${jsonResponse.file_id} `,
            )
        }
    }
}

integration.define({
    synchronizations: [
        {
            name: 'broadcasts', // Logical name
            fullSyncFunction: fullSyncBroadcasts,
            // "incrementalSyncFunction": incrementalSyncBroadcasts,
            // Broadcast endpoint needs an Incremental Synchronisation (use a different endpoint than fullSync: /item/app/{{broadcast_app_id}}/filter/{{broadcast_view_id}})
        },
        // Categories; Criticality and Status have only "dummy/empty" function instead of Full Synch and therefore needs to be finished
        {
            name: 'categories', // Logical name
            fullSyncFunction: fullSyncNone,
        },
        {
            name: 'criticalities', // Logical name
            fullSyncFunction: fullSyncNone,
        },
        {
            name: 'statuses', // Logical name
            fullSyncFunction: fullSyncNone,
        },
    ],
    actions: [
        {
            name: 'updateBroadcast',
            parameters: [
                {
                    name: 'broadcastItemId',
                    type: 'LONG',
                    required: true,
                },
                {
                    name: 'broadcastTitle',
                    type: 'STRING',
                    required: true,
                },
            ],
            function: updateBroadcast,
        },
        {
            name: 'uploadFile',
            parameters: [
                {
                    name: 'broadcastItemId',
                    type: 'LONG',
                    required: true,
                },
                {
                    name: 'attachment',
                    type: 'FILES',
                    required: true,
                },
            ],
            function: uploadFile,
        },
    ],

    // MODEL is finished

    model: {
        tables: [
            {
                name: 'broadcasts',
                columns: [
                    {name: 'podio_item_id', type: 'LONG', primaryKey: true},
                    {name: 'category_id', type: 'INTEGER'},
                    {name: 'criticality_id', type: 'INTEGER'},
                    {name: 'department', type: 'STRING', length: 255},
                    {name: 'end_date', type: 'DATETIME'},
                    {name: 'image_url', type: 'STRING', length: 255},
                    {name: 'link', type: 'STRING', length: 255},
                    {name: 'message', type: 'STRING'},
                    {name: 'podio_app_item_id', type: 'INTEGER'},
                    {name: 'published_by', type: 'STRING', length: 255},
                    {name: 'status_id', type: 'INTEGER'},
                    {name: 'title', type: 'STRING', length: 255},
                ],
            },
            {
                name: 'categories',
                columns: [
                    {name: 'category_id', type: 'INTEGER', primaryKey: true},
                    {name: 'name', type: 'STRING', length: 255},
                ],
            },
            {
                name: 'criticalities',
                columns: [
                    {name: 'criticality_id', type: 'INTEGER', primaryKey: true},
                    {name: 'name', type: 'STRING', length: 255},
                ],
            },
            {
                name: 'statuses',
                columns: [
                    {name: 'status_id', type: 'INTEGER', primaryKey: true},
                    {name: 'name', type: 'STRING', length: 255},
                ],
            },
        ],
        relationships: [
            {
                name: 'broadcast_category',
                primaryTable: 'categories',
                foreignTable: 'broadcasts',
                columnPairs: [
                    {
                        primaryKey: 'category_id',
                        foreignKey: 'category_id',
                    },
                ],
            },
            {
                name: 'broadcast_criticality',
                primaryTable: 'criticalities',
                foreignTable: 'broadcasts',
                columnPairs: [
                    {
                        primaryKey: 'criticality_id',
                        foreignKey: 'criticality_id',
                    },
                ],
            },
            {
                name: 'broadcast_status',
                primaryTable: 'statuses',
                foreignTable: 'broadcasts',
                columnPairs: [
                    {
                        primaryKey: 'status_id',
                        foreignKey: 'status_id',
                    },
                ],
            },
        ],
    },
    integrationParameters: [
        {
            name: 'broadcast_app_id',
            type: 'INTEGER',
            label: 'Podio Broadcast application Id',
            description: 'Synchronize records for the respective application.',
            required: true,
        },
        {
            name: 'broadcast_view_id',
            type: 'INTEGER',
            label: 'Podio Broadcast view Id',
            description: 'Synchronize records for the respective view within an application.',
            required: true,
        },
        {
            name: 'talkativeConsole',
            type: 'BOOLEAN',
            label: 'Console Logging Switch',
            description: 'Silent console logging.',
            defaultValue: false,
            required: false,
        },
    ],
})
