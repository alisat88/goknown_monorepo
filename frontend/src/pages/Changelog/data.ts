/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { v4 as uuid } from "uuid";

interface IChangelogItem {
  id: string;
  category: "fixed" | "added" | "improved" | "updated";
  description: string;
}

interface IVersionItem {
  id: string;
  version: string;
  date: string;
  changelogs: IChangelogItem[];
}

export default [
  {
    id: uuid(),
    version: "1.0.1",
    date: "jul 5, 2022",
    changelogs: [
      {
        id: uuid(),
        category: "added",
        description: "organizations index screen",
      },
      {
        id: uuid(),
        category: "added",
        description: "groups index screen",
      },
      {
        id: uuid(),
        category: "added",
        description: "rooms index screen",
      },
    ],
  },
] as IVersionItem[];
