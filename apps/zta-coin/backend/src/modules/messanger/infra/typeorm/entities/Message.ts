/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
type Message = {
  id: string;
  conversation_syncid: string;
  sender: string;
  text: string;
  created_at: any;
  updated_at?: Date;
};

export default Message;
