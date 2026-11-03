/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
export default interface IVoteDTO {
  type: 'transaction' | 'user' | 'charge';
  nodeName: string;
  syncId: string;
  toUserSyncId: string;
  fromUserSyncId: string;
  vote: 'approved' | 'unpproved' | 'failed';
  timestamp: number;
  error?: string;
}
