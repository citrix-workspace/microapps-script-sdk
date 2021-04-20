## Script description
The examples of scripted integrations with service now SoR. 
These examples demonstrate the _tasks_ synchronizations, as well as working with **microapp-user-groups** ServiceNOW library.

## Execution examples

Replace all `{{...}}` placeholders in `script-examples/serviceNow/configSnowOauth.template.json` with real ones. 

###Execute tasks sync

`bin/run sync --name tasks --configuration-file=script-examples/serviceNow/configSnowOauth.template.json script-examples/serviceNow/snow.js`

###Execute supergroups sync

`bin/run sync --name snowUserGroups --configuration-file=script-examples/serviceNow/configSnowOauth.template.json script-examples/serviceNow/snowUserGroups.js`

