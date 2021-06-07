###Execute sync with OAuth2

Just Execute with Data output to CONSOLE
`bin/run sync --name broadcasts --configuration-file=script-examples/podio/configPodioOauth.templateUSER.json --context-type=FILE script-examples/podio/podio.js`

Just Execute with Data output to FILE (console is not overloaded with "data junk")
`bin/run sync --name broadcasts --configuration-file=script-examples/podio/configPodioOauth.templateUSER.json --context-type=FILE --data-store-format CSV --data-store-type FILE --output-files-directory script-examples/podio/syncFiles script-examples/podio/podio.js`

Create URL for Chrome debugging
`java "-Dpolyglot.inspect=true" -jar console-runner-jar-with-dependencies.jar sync --name broadcasts --configuration-file=script-examples/podio/configPodioOauth.templateUSER.json --context-type=FILE --data-store-format CSV --data-store-type FILE --output-files-directory script-examples/podio/syncFiles --overwrite script-examples/podio/podio.js`
   
---
**NOTE**

The obtained access token will be stored in the _security_context.json_ file inside the work/auth directory. It will be reused during subsequent script executions.

---

###Execute service action with OAuth2

Just Execute with Data output to CONSOLE
`bin/run action --name uploadFile --configuration-file=script-examples/podio/configPodioOauth.templateUSER.json --parameter broadcastItemId=123456789  --parameter attachment="[\"script-examples/podio/JSONexample.txt\"]" script-examples/podio/podio.js`
`bin/run action --name updateBroadcast --configuration-file=script-examples/podio/configPodioOauth.templateUSER.json --parameter broadcastItemId=123456789 --parameter broadcastTitle="This is your new title" script-examples/podio/podio.js`

Create URL for Chrome debugging
`java "-Dpolyglot.inspect=true" -jar console-runner-jar-with-dependencies.jar action --name uploadFile --configuration-file=script-examples/podio/configPodioOauth.templateUSER.json --parameter broadcastItemId=123456789 --parameter attachment="[\"script-examples/podio/JSONexample.txt\"]" script-examples/podio/podio.js`