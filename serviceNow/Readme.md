## Script description

The examples of scripted integrations with service now SoR.
These examples demonstrate the _tasks_ synchronizations, as well as working with **microapp-user-groups** ServiceNOW library.

## Execution examples

Replace all `{{...}}` placeholders in `serviceNow/configSnowOauth.template.json` with real ones.
(_Use for instance [Insomnia](https://insomnia.rest) to get the refreshToken.
See [authentication documentation](https://support.insomnia.rest/article/38-authentication)_)

### Execute tasks sync

`bin/run sync --name tasks --configuration-file=serviceNow/configSnowOauth.template.json serviceNow/snow.js`

### Execute supergroups sync

`bin/run sync --name snowUserGroups --configuration-file=serviceNow/configSnowOauth.template.json serviceNow/snowUserGroups.js`

---

**NOTE**

The obtained access token will be stored in the _security_context.json_ file inside the work/auth directory. It will be reused during subsequent script executions.

---
