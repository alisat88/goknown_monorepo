import AppError from '@shared/errors/AppError';
import IDAppBuilderRepository, {
  ICreateAppDTO,
  IUpdateAppDTO,
} from '../repositories/IDAppBuilderRepository';
import IUsersRepository from '@modules/users/repositories/IUsersRepository';
import DAppBuilderApp from '../infra/typeorm/entities/DAppBuilderApp';
import User from '@modules/users/infra/typeorm/entities/User';

export interface AppDTO {
  id: string;
  dappName: string;
  description: string;
  userPrompt: string;
  template: string;
  status: string;
  generatedCode: string;
  generatedConfig: string;
  internalAppPath: string;
  permissionModel: string;
  apis: string[];
  workflow: string[];
  version: number;
  ownerId: string;       // owner's email
  ownerName: string;     // owner's name
  sharedWith: string[];  // recipient emails
  sharedAccess: Array<{ email: string; role: string; userId: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppInput {
  dapp_name: string;
  description?: string;
  user_prompt?: string;
  template?: string;
  status?: string;
  generated_code?: string;
  generated_config?: string;
  internal_app_path?: string;
  permission_model?: string;
  apis?: string[];
  workflow?: string[];
  version?: number;
  client_id?: string;  // for migration deduplication
}

export interface UpdateAppInput {
  dapp_name?: string;
  description?: string;
  user_prompt?: string;
  template?: string;
  status?: string;
  generated_code?: string;
  generated_config?: string;
  internal_app_path?: string;
  permission_model?: string;
  apis?: string[];
  workflow?: string[];
  version?: number;
}

// Allowed roles for editing
const EDITOR_ROLES = new Set(['Builder']);
const OWNER_ONLY_ACTIONS = ['delete', 'share'];

function formatApp(app: DAppBuilderApp): AppDTO {
  const access = app.access_records ?? [];
  const sharedWith = access.map((r) =>
    r.user?.email?.toLowerCase() ?? '',
  ).filter(Boolean);
  const sharedAccess = access.map((r) => ({
    email: r.user?.email?.toLowerCase() ?? '',
    role: r.role,
    userId: r.user_id,
  })).filter((a) => a.email);

  return {
    id: app.id,
    dappName: app.dapp_name,
    description: app.description ?? '',
    userPrompt: app.user_prompt ?? '',
    template: app.template ?? '',
    status: app.status,
    generatedCode: app.generated_code ?? '',
    generatedConfig: app.generated_config ?? '',
    internalAppPath: app.internal_app_path ?? `/dapp-builder/apps/${app.id}`,
    permissionModel: app.permission_model ?? 'role-based',
    apis: app.apis ?? [],
    workflow: app.workflow ?? [],
    version: app.version ?? 1,
    ownerId: app.owner?.email?.toLowerCase() ?? '',
    ownerName: app.owner?.name ?? '',
    sharedWith,
    sharedAccess,
    createdAt: app.created_at?.toISOString() ?? new Date().toISOString(),
    updatedAt: app.updated_at?.toISOString() ?? new Date().toISOString(),
  };
}

class DAppBuilderAppsService {
  constructor(
    private dappRepo: IDAppBuilderRepository,
    private usersRepo: IUsersRepository,
  ) {}

  private async resolveUser(syncId: string): Promise<User> {
    const user = await this.usersRepo.findBySyncId(syncId);
    if (!user) throw new AppError('Authenticated user not found', 401);
    return user;
  }

  // ── List ──────────────────────────────────────────────────────────────────

  public async listForUser(syncId: string): Promise<AppDTO[]> {
    const user = await this.resolveUser(syncId);
    const [owned, shared] = await Promise.all([
      this.dappRepo.findByOwner(user.id),
      this.dappRepo.findSharedWithUser(user.id),
    ]);
    // Deduplicate (edge case: owner is also in access table)
    const seen = new Set<string>();
    const all: DAppBuilderApp[] = [];
    for (const app of [...owned, ...shared]) {
      if (!seen.has(app.id)) { seen.add(app.id); all.push(app); }
    }
    return all.map(formatApp);
  }

  // ── Create ────────────────────────────────────────────────────────────────

  public async createApp(syncId: string, input: CreateAppInput): Promise<AppDTO> {
    const user = await this.resolveUser(syncId);

    // Idempotency: if the frontend supplied a client_id and we already have
    // a server record for it, return the existing app (migration dedup).
    if (input.client_id) {
      const existing = await this.dappRepo.findByClientId(input.client_id, user.id);
      if (existing) {
        // Reload with relations
        const full = await this.dappRepo.findById(existing.id);
        return formatApp(full!);
      }
    }

    const appId = input.internal_app_path
      ? undefined  // will be overwritten below
      : undefined;

    const app = await this.dappRepo.create({
      owner_id: user.id,
      dapp_name: input.dapp_name,
      description: input.description,
      user_prompt: input.user_prompt,
      template: input.template,
      status: input.status ?? 'Draft',
      generated_code: input.generated_code,
      generated_config: input.generated_config,
      permission_model: input.permission_model,
      apis: input.apis ?? [],
      workflow: input.workflow ?? [],
      version: input.version ?? 1,
      client_id: input.client_id,
    });

    // Set internal_app_path now that we have the real id
    app.internal_app_path = input.internal_app_path ?? `/dapp-builder/apps/${app.id}`;
    const saved = await this.dappRepo.save(app);

    const full = await this.dappRepo.findById(saved.id);
    return formatApp(full!);
  }

  // ── Get ───────────────────────────────────────────────────────────────────

  public async getApp(appId: string, syncId: string): Promise<AppDTO> {
    const user = await this.resolveUser(syncId);
    const app = await this.dappRepo.findById(appId);
    if (!app) throw new AppError('App not found', 404);

    const isOwner = app.owner_id === user.id;
    const hasAccess = (app.access_records ?? []).some((r) => r.user_id === user.id);
    if (!isOwner && !hasAccess) throw new AppError('Access denied', 403);

    return formatApp(app);
  }

  // ── Update ────────────────────────────────────────────────────────────────

  public async updateApp(
    appId: string,
    syncId: string,
    input: UpdateAppInput,
  ): Promise<AppDTO> {
    const user = await this.resolveUser(syncId);
    const app = await this.dappRepo.findById(appId);
    if (!app) throw new AppError('App not found', 404);

    const isOwner = app.owner_id === user.id;
    if (!isOwner) {
      const access = (app.access_records ?? []).find((r) => r.user_id === user.id);
      if (!access || !EDITOR_ROLES.has(access.role)) {
        throw new AppError('Only the owner or a Builder may update this app', 403);
      }
    }

    // Prevent owner_id from being changed via update
    if (input.dapp_name !== undefined) app.dapp_name = input.dapp_name;
    if (input.description !== undefined) app.description = input.description;
    if (input.user_prompt !== undefined) app.user_prompt = input.user_prompt;
    if (input.template !== undefined) app.template = input.template;
    if (input.status !== undefined) app.status = input.status;
    if (input.generated_code !== undefined) app.generated_code = input.generated_code;
    if (input.generated_config !== undefined) app.generated_config = input.generated_config;
    if (input.internal_app_path !== undefined) app.internal_app_path = input.internal_app_path;
    if (input.permission_model !== undefined) app.permission_model = input.permission_model;
    if (input.apis !== undefined) app.apis = input.apis;
    if (input.workflow !== undefined) app.workflow = input.workflow;
    if (input.version !== undefined) app.version = input.version;

    await this.dappRepo.save(app);
    const full = await this.dappRepo.findById(app.id);
    return formatApp(full!);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  public async deleteApp(appId: string, syncId: string): Promise<void> {
    const user = await this.resolveUser(syncId);
    const app = await this.dappRepo.findById(appId);
    if (!app) throw new AppError('App not found', 404);
    if (app.owner_id !== user.id) throw new AppError('Only the owner may delete this app', 403);
    await this.dappRepo.softDelete(appId);
  }

  // ── Share ─────────────────────────────────────────────────────────────────

  public async shareApp(
    appId: string,
    ownerSyncId: string,
    recipientEmail: string,
    role: string,
  ): Promise<AppDTO> {
    const owner = await this.resolveUser(ownerSyncId);
    const app = await this.dappRepo.findById(appId);
    if (!app) throw new AppError('App not found', 404);
    if (app.owner_id !== owner.id) throw new AppError('Only the owner may share this app', 403);

    const normalizedEmail = recipientEmail.trim().toLowerCase();

    // Must not share with self
    if (owner.email.toLowerCase() === normalizedEmail) {
      throw new AppError('You already own this app.', 400);
    }

    // Recipient must be a real DAppGenius user
    const recipient = await this.usersRepo.findByEmail(normalizedEmail);
    if (!recipient) {
      throw new AppError('This email is not a valid user.', 400);
    }

    await this.dappRepo.upsertAccess(appId, recipient.id, role);

    // Set status to Shared if it wasn't already
    if (app.status !== 'Shared') {
      app.status = 'Shared';
      await this.dappRepo.save(app);
    }

    const full = await this.dappRepo.findById(appId);
    return formatApp(full!);
  }

  // ── Remove Share ──────────────────────────────────────────────────────────

  public async removeShare(
    appId: string,
    ownerSyncId: string,
    targetUserId: string,
  ): Promise<AppDTO> {
    const owner = await this.resolveUser(ownerSyncId);
    const app = await this.dappRepo.findById(appId);
    if (!app) throw new AppError('App not found', 404);
    if (app.owner_id !== owner.id) throw new AppError('Only the owner may change sharing', 403);

    await this.dappRepo.removeAccess(appId, targetUserId);

    const full = await this.dappRepo.findById(appId);
    return formatApp(full!);
  }
}

export default DAppBuilderAppsService;
