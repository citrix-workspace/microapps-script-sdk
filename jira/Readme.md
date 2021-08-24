## Script description

The example of scripted integration with JIRA SoR.
Two different auth configurations can be used in this example.

- Basic
- OAuth2

## Execution examples

<a id="basicAuth"></a>

### Execute sync with basic auth

Change the _{{username}}_ and _{{username}}_ in `jira/configJiraBasicAuth.template.json`

`bin/run sync --name tickets --configuration-file=jira/configJiraBasicAuth.template.json jira/jira.js`

or

`bin/run sync --name projects --configuration-file=jira/configJiraBasicAuth.template.json jira/jira.js`

### Execute sync with OAuth2

Replace all `{{...}}` placeholders in `jira/configJiraOauth.template.json` with real ones.
(_Use for instance [Insomnia](https://insomnia.rest) to get the refreshToken.
See [authentication documentation](https://support.insomnia.rest/article/38-authentication)_)

`bin/run sync --name tickets --configuration-file=jira/configJiraOauth.template.json --context-type=FILE jira/jira.js`

or

`bin/run sync --name projects --configuration-file=jira/configJiraOauth.template.json --context-type=FILE jira/jira.js`

---

**NOTE**

The obtained access token will be stored in the _security_context.json_ file inside the work/auth directory. It will be reused during subsequent script executions.

---

### Execute create issue action with basic auth

The following example creates a Jira issue with minimal required fields. If your project configuration requires more
mandatory fields then you must update `jira.js` action parameters definitions and action function `createTicket`
otherwise the REST call will fail.

See [Execute sync with basic auth](#basicAuth) to prepare `configJiraBasicAuth.json` config file. Basic auth
and `baseUrl` are not provided as CLI arguments in the example.

`bin/run action --name createTicket --configuration-file=jira/configJiraBasicAuth.template.json --parameter projectKey=MYPROJECT --parameter summary="This is summmary"  --parameter description="This is description" --parameter issueType=Task --parameter reporterId=johndoe jira/jira.js`

#### Command line arguments

- `bin/run` - executable SDK binary
- `action` - command to run
- `--name createTicket` - action to run, see `jira.js` for action declarations, it's not a `function` name but it's good convention to use the same name for the `function`
- `--configuration-file=jira/configJiraBasicAuth.template.json` - path to configuration file
- `--parameter`
  - `projectKey` (mandatory) - can be derived from project dashboard
    URL `https://jira.acme.com/secure/RapidBoard.jspa?rapidView=1&projectKey=MYPROJECT` or from some existing project
    issue key: `MYPROJECT-1234`
  - `summary` (mandatory) - issue summary or title
  - `description` (mandatory) - issue description
  - `issueType` (mandatory) - depends on the project configuration, typical values are `Bug`, `Task`, `Story`, etc.
  - `reporterId` (optional) - reporter ID or username (depends on project configuration), the issue is created with reporter same as username used in credentials reporter, if `reporterId` is used then the issue is updated accordingly
- `jira/jira.js` - path to Javascript file

### Start and invoke webhook listener with issue updated event

The following example starts console runner in simple http server mode which expose URL with webhook listener defined in javascript file and specified by parameter `--name`. When http server is running, can be invoked from tools like curl or Postman.

See [Execute sync with basic auth](#basicAuth) to prepare `configJiraBasicAuth.json` config file. Basic auth
and `baseUrl` are not provided as CLI arguments in the example. Webhook listener has post webhook action, download ticket detail from Jira, then auth needs to be configured.

`bin\run.bat webhook --name updateTicketWebhook --configuration-file=jira/configJiraBasicAuth.template.json jira/jira.js`

Console runner starts in http server mode on default port (8282), can be changed by parameter. Also prints URL on which is webhook listener exposed, which could be used in next step for invoking webhook listener.

`curl -v -d "{ \"issue\": { \"key\": \"FP-1151\" } }" http://localhost:8282/<uuid>/updateTicketWebhook`

Invoked URL path contains <uuid> placeholder, which will be printed when console runner starts.