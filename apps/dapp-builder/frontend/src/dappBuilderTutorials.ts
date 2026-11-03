/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
export interface IDAppBuilderTutorial {
  id: string;
  title: string;
  description: string;
  url: string;
}

export const DAPP_BUILDER_TUTORIALS: IDAppBuilderTutorial[] = [
  {
    id: 'walkthrough-1',
    title: 'DApp Builder Walkthrough',
    description: 'Learn how to use DApp Builder to create and preview apps.',
    url: 'https://www.loom.com/share/eeb06d45824748009ad4bd1ba387daf4',
  },
];
