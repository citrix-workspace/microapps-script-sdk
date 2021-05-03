## Script description

The example of scripted integration shows how to use FILE action parameter type in your action.

## Execution examples

### Execute action with OAuth2

Replace all `{{...}}` placeholders in `configSalesforceOauth.template.json` with real ones.
(_Use for instance [Insomnia](https://insomnia.rest) to get the refreshToken.
See [authentication documentation](https://support.insomnia.rest/article/38-authentication)_)

`bin/run action --name attachDocument --parameters='folderId:yourFolderId,photos:[file.png,file.pdf]' --configuration-file=salesforce/configSalesforceOauth.template.json salesforce/salesforce.js`

---

**NOTE**

The obtained access token will be stored in the _security_context.json_ file inside the work/auth directory. It will be reused during subsequent script executions.

---
