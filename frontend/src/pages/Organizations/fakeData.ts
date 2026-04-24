import { v4 as uuid, V4Options } from "uuid";

import chat from "../../assets/chat.svg";
import dataforms from "../../assets/dataforms.svg";
import group from "../../assets/group.svg";
import nft from "../../assets/nft.svg";
import organizations from "../../assets/organizations.svg";
import wallet from "../../assets/wallet.svg";
import { IOrganizationItem } from "./types";

// the group admins are the mentors and admins of groups and sub-groups

export const organizationsFake = [
  {
    id: "123",
    sync_id: "123abc",
    name: "Org1",
    admin_alias: "Group Admins",
    file_path: "",
    // isOwner: true,
    number_of_admins: 3,
    number_of_members: 20,
    admins: [
      {
        id: "1",
        sync_id: "1",
        name: "Karen",
        email: "karen@email.com",
        status: "inactive",
      },
      {
        id: "2",
        sync_id: "2",
        name: "Jeff",
        email: "jeff@email.com",
        status: "active",
      },
      {
        id: "3",
        sync_id: "3",
        name: "John",
        email: "john@email.com",
        status: "pending",
      },
    ],
    groups: [
      {
        id: "123",
        sync_id: "123",
        name: "Group 1",
        number_of_rooms: 2,
        admin: {
          id: "123",
          sync_id: "123",
          email: "admin@test.com",
          name: "Fake Name",
          status: "active",
        },

        rooms: [
          {
            id: "123",
            sync_id: "123",
            name: "Room 1",
            dls: [
              {
                id: uuid(),
                name: "Digital Assets",
                icon: nft,
                route: "/digitalassets",
                sync_id: uuid(),
                flag: "digital_assets",
              },
              {
                id: uuid(),
                sync_id: uuid(),

                name: "Wallet",
                icon: wallet,
                route: "/trasactions",
                flag: "wallet",
              },
              {
                id: uuid(),
                sync_id: uuid(),

                name: "Messenger",
                icon: chat,
                route: "/messenger",
              },
            ],
            members: [
              // {
              //   id: "2",
              //   sync_id: "2",
              //   name: "John",
              //   email: "john@email.com",
              //   status: "active",
              // },
            ],
            admin: {
              id: "1",
              sync_id: "1",
              name: "Karen",
              email: "karen@email.com",
              status: "inactive",
            },
          },
        ],
      },
    ],
  },
] as IOrganizationItem[];
