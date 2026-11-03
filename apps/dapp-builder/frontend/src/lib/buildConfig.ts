/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Template, WorkflowBlock } from '../types';

export interface DAppConfig {
  dappName: string;
  template: string;
  permissionModel: string;
  apis: string[];
  workflow: string[];
}

export function templateDisplayName(id: string): string {
  const names: Record<string, string> = {
    'token-dashboard': 'Token Rewards Portal',
    'nft-mint': 'NFT Collection Launch',
    'dao-voting': 'DAO Voting Demo',
    'escrow-payment': 'Escrow Payment Flow',
    'ledger-app': 'Aviation Ledger App',
    'permissioned-workflow': 'Internal Workflow App',
  };
  return names[id] ?? id;
}

export function buildConfig(
  template: Template | null,
  steps: WorkflowBlock[],
  dappName?: string
): DAppConfig {
  if (!template) {
    return {
      dappName: dappName ?? 'Untitled dApp',
      template: 'none',
      permissionModel: 'role-based',
      apis: [],
      workflow: steps.map((s) => s.id),
    };
  }
  const extraApis = steps
    .map((s) => s.apiId)
    .filter((id): id is string => !!id && !template.apiIds.includes(id));
  return {
    dappName: dappName ?? templateDisplayName(template.id),
    template: template.id,
    permissionModel: template.permissionModel,
    apis: [...template.apiIds, ...extraApis],
    workflow: steps.map((s) => s.id),
  };
}
