## Script description
The example of scripted integration with JIRA SoR. 
Two different auth configurations can be used in this example.
- Basic
- OAuth2

## Execution examples

<a id="basicAuth"></a>
###Execute sync with basic auth

Change the _{{username}}_ and _{{username}}_ in `script-examples/jira/configJiraBasicAuth.template.json`

`bin/run sync --name tickets --configuration-file=script-examples/jira/configJiraBasicAuth.template.json script-examples/jira/jira.js`

or

`bin/run sync --name projects --configuration-file=script-examples/jira/configJiraBasicAuth.template.json script-examples/jira/jira.js`

###Execute sync with OAuth2

Replace all `{{...}}` placeholders in `script-examples/jira/configJiraOauth.template.json` with real ones.
(_Use for instance [Insomnia](https://insomnia.rest) to get the refreshToken.
See [authentication documentation](https://support.insomnia.rest/article/38-authentication)_)

`bin/run sync --name tickets --configuration-file=script-examples/jira/configJiraOauth.template.json --context-type=FILE script-examples/jira/jira.js`

or

`bin/run sync --name projects --configuration-file=script-examples/jira/configJiraOauth.template.json --context-type=FILE  script-examples/jira/jira.js`
       
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

`bin/run action --name createTicket --configuration-file=script-examples/jira/configJiraBasicAuth.template.json --parameters projectKey:MYPROJECT,summary:"This is summmary",description:"This is description",issueType:Task,reporterId:johndoe script-examples/jira/jira.js`

#### Command line arguments

* `bin/run` - executable SDK binary
* `action` - command to run
* `--name createTicket` - action to run, see `jira.js` for action declarations, it's not a `function` name but it's good
  convention to use the same name for the `function`
* `--configuration-file=script-examples/jira/configJiraBasicAuth.template.json` - path to configuration file
* `--parameters`
    * `projectKey` (mandatory) - can be derived from project dashboard
      URL `https://jira.acme.com/secure/RapidBoard.jspa?rapidView=1&projectKey=MYPROJECT` or from some existing project
      issue key: `MYPROJECT-1234`
    * `summary` (mandatory) - issue summary or title
    * `description` (mandatory) - issue description
    * `issueType` (mandatory) - depends on the project configuration, typical values are `Bug`, `Task`, `Story`, etc.
    * `reporterId` (optional) - reporter ID or username (depends on project configuration), the issue is created with
      reporter same as username used in credentials reporter, if `reporterId` is used then the issue is updated
      accordingly
* `script-examples/jira/jira.js` - path to Javascript file   
