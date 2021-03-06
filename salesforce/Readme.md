## Script description

The example of scripted integration shows how to use FILE action parameter type in your action.

## Execution examples

### Execute action with OAuth2

Replace all `{{...}}` placeholders in `configSalesforceOauth.template.json` with real ones.
(_Use for instance [Insomnia](https://insomnia.rest) to get the refreshToken.
See [authentication documentation](https://support.insomnia.rest/article/38-authentication)_)

`bin/run action --name attachDocument --parameter=folderId=yourFolderId  --parameter attachments="[\"salesforce/file1.png\",\"salesforce/file2.pdf\"]" --configuration-file=salesforce/configSalesforceOauth.template.json salesforce/salesforce.js`

Note: `file1.png` and `file2.pdf` have to exist in `salesforce` folder.
---

**NOTE**

The obtained access token will be stored in the _security_context.json_ file inside the work/auth directory. It will be reused during subsequent script executions.

---
