export const logsFake = [
  {
    user_id: "user-1",
    user: {
      name: "John Doe",
      avatar_url: "none",
      role: "buyer",
    },
    sync_id: "sync_id",
    action: "SEND",
    dapp: "Transaction",
    dapp_token: "123123-asd123-asd1412-asd1234",
    dapp_token_sync: "123123-asd123-asd1412-asd1234",
    master_node: "NODE 1",
    nodes: [
      {
        node: "NODE 1",
        status: "success",
        created_at: "sat 10 jun 12:15",
      },
      {
        node: "NODE 2",
        status: "success",
        created_at: "sat 10 jun 12:16",
      },
      {
        node: "NODE 3",
        status: "success",
        created_at: "sat 10 jun 12:16",
      },
    ],
  },
  {
    user_id: "user-2",
    user: {
      name: "John Doe",
      avatar_url: "none",
      role: "buyer",
    },
    sync_id: "sync_id",
    action: "SEND",
    dapp: "Transaction",
    dapp_token: "123123-asd123-asd1412-asd1234",
    dapp_token_sync: "123123-asd123-asd1412-asd1234",
    master_node: "NODE 1",
    nodes: [
      {
        node: "NODE 1",
        status: "success",
        created_at: "sat 10 jun 12:15",
      },
      {
        node: "NODE 2",
        status: "success",
        created_at: "sat 10 jun 12:16",
      },
      {
        node: "NODE 3",
        status: "success",
        created_at: "sat 10 jun 12:16",
      },
    ],
  },
  {
    user_id: "user-2",
    user: {
      name: "John Doe",
      avatar_url: "none",
      role: "buyer",
    },
    sync_id: "sync_id",
    action: "SEND",
    dapp: "Transaction",
    dapp_token: "123123-asd123-asd1412-asd1234",
    dapp_token_sync: "123123-asd123-asd1412-asd1234",
    outcome: "success",
    nodes: [
      {
        node: "NODE 1",
        outcome: "success",
        created_at: "sat 10 jun 12:15",
      },
      {
        node: "NODE 2",
        outcome: "success",
        created_at: "sat 10 jun 12:16",
      },
      {
        node: "NODE 3",
        outcome: "success",
        created_at: "sat 10 jun 12:16",
      },
    ],
  },
];
