const { User, Group, UserGroupMapping } = library.load("microapp-user-groups");

integration.define({
  synchronizations: [
    {
      name: "snowUserGroups",
      fullSyncFunction: fullSync,
    },
  ],
  model: {
    tables: [User.tableModel, Group.tableModel, UserGroupMapping.tableModel],
  },
});

function fullSync(params) {
  return Promise.all([
    fullSyncUsers(params),
    fullSyncGroups(params),
    fullSyncUserGroupMapping(params),
  ]);
}

async function fullSyncUsers({ client, dataStore }) {
  let offset = 0;
  do {
    const response = await client.fetch(
      `/api/now/table/sys_user?sysparm_query=active%3Dtrue&sysparm_limit=100&sysparm_offset=${offset}`
    );
    if (!response.ok) {
      console.log("Error status:", response.status, response.statusText);
      console.log("Error body:", await response.text());
      throw new Error("Network response was not ok");
    }
    console.log("fetch done");

    const { result: users } = await response.json();
    console.log("users", users);

    users.map((user) =>
      console.log(
        user.name,
        user.name,
        user.email,
        user.sys_domain_path,
        user.name,
        user.sys_id
      )
    );
    dataStore.save(
      User.tableModel,
      users.map(
        (user) =>
          new User(
            user.name,
            user.name,
            user.email,
            user.sys_domain_path,
            user.name,
            user.sys_id
          )
      )
    );
    offset = offset + 100;
    console.log(`offset: ${offset}`);
  } while (offset < 400);
}

async function fullSyncGroups({ client, dataStore }) {
  let offset = 0;
  do {
    const response = await client.fetch(
      `/api/now/table/sys_user_group?sysparm_query=active%3Dtrue&sysparm_limit=100&sysparm_offset=${offset}`
    );
    if (!response.ok) {
      console.log("Error status:", response.status, response.statusText);
      console.log("Error body:", await response.text());
      throw new Error("Network response was not ok");
    }

    const { result: groups } = await response.json();
    groups.map((group) =>
      console.log(
        group.name,
        group.name,
        "domain",
        group.name,
        group.sys_id,
        group.parent.value
      )
    );
    dataStore.save(
      Group.tableModel,
      groups.map(
        (group) =>
          new Group(
            group.name,
            group.name,
            "domain",
            group.name,
            group.sys_id,
            group.parent.value
          )
      )
    );
    offset = offset + 100;
    console.log(`offset: ${offset}`);
  } while (offset < 400);
}

async function fullSyncUserGroupMapping({ client, dataStore }) {
  let offset = 0;
  do {
    const response = await client.fetch(
      `/api/now/table/sys_user_grmember?&sysparm_limit=100&sysparm_offset=${offset}`
    );
    if (!response.ok) {
      console.log("Error status:", response.status, response.statusText);
      console.log("Error body:", await response.text());
      throw new Error("Network response was not ok");
    }

    const { result: mappings } = await response.json();
    mappings.map((mapping) =>
      console.log(mapping.user.value, mapping.group.value)
    );
    dataStore.save(
      UserGroupMapping.tableModel,
      mappings.map(
        (mapping) =>
          new UserGroupMapping(mapping.user.value, mapping.group.value)
      )
    );
    offset = offset + 100;
    console.log(`offset: ${offset}`);
  } while (offset < 400);
}
