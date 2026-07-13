import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// ── Rate limiter ──────────────────────────────────────────────────────────────
// Each Anthropic call costs real money and takes ~10-30s. 10 requests per 15
// minutes per IP is generous for legitimate demo use while blocking scripted
// abuse. The error string uses the STATUS:detail format so the frontend's
// classifyError() resolves it to "Rate limit reached — wait a moment and try again".
export const dappBuilderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '429:Rate limit exceeded — please wait a moment before generating more apps' },
});

// ── Field size limits ─────────────────────────────────────────────────────────
const MAX_DAPP_NAME        = 200;
const MAX_TEMPLATE         = 100;
const MAX_USER_PROMPT      = 8_000;  // 1000 words × ~8 chars; frontend enforces 1000-word cap
const MAX_API_DETAILS      = 8_000;
const MAX_DESCRIPTION      = 2_000;
const MAX_WORKFLOW_ITEMS   = 20;
const MAX_WORKFLOW_ITEM    = 100;
const MAX_HTML             = 200_000; // generated apps are typically ≤ 50kb
const MAX_FOLLOW_UP        = 5_000;
const MAX_APP_NAME         = 200;

// ── Validation: POST /dapp-builder/generate ───────────────────────────────────
export function validateGenerate(req: Request, res: Response, next: NextFunction): void {
  const { dappName, template, workflow, userPrompt, apiDetails, description } = req.body ?? {};

  if (!dappName || typeof dappName !== 'string' || !dappName.trim()) {
    res.status(400).json({ error: 'dappName is required' });
    return;
  }
  if (dappName.length > MAX_DAPP_NAME) {
    res.status(400).json({ error: `dappName must be ${MAX_DAPP_NAME} characters or fewer` });
    return;
  }

  if (!template || typeof template !== 'string') {
    res.status(400).json({ error: 'template is required' });
    return;
  }
  if (template.length > MAX_TEMPLATE) {
    res.status(400).json({ error: `template must be ${MAX_TEMPLATE} characters or fewer` });
    return;
  }

  if (!Array.isArray(workflow)) {
    res.status(400).json({ error: 'workflow must be an array' });
    return;
  }
  if (workflow.length > MAX_WORKFLOW_ITEMS) {
    res.status(400).json({ error: `workflow may not exceed ${MAX_WORKFLOW_ITEMS} steps` });
    return;
  }
  if (workflow.some((step: unknown) => typeof step !== 'string' || step.length > MAX_WORKFLOW_ITEM)) {
    res.status(400).json({ error: `each workflow step must be a string of ${MAX_WORKFLOW_ITEM} characters or fewer` });
    return;
  }

  if (userPrompt !== undefined) {
    if (typeof userPrompt !== 'string') {
      res.status(400).json({ error: 'userPrompt must be a string' });
      return;
    }
    if (userPrompt.length > MAX_USER_PROMPT) {
      res.status(400).json({ error: `userPrompt must be ${MAX_USER_PROMPT} characters or fewer` });
      return;
    }
  }

  if (apiDetails !== undefined) {
    if (typeof apiDetails !== 'string') {
      res.status(400).json({ error: 'apiDetails must be a string' });
      return;
    }
    if (apiDetails.length > MAX_API_DETAILS) {
      res.status(400).json({ error: `apiDetails must be ${MAX_API_DETAILS} characters or fewer` });
      return;
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      res.status(400).json({ error: 'description must be a string' });
      return;
    }
    if (description.length > MAX_DESCRIPTION) {
      res.status(400).json({ error: `description must be ${MAX_DESCRIPTION} characters or fewer` });
      return;
    }
  }

  next();
}

// ── Validation: POST /dapp-builder/edit ───────────────────────────────────────
export function validateEdit(req: Request, res: Response, next: NextFunction): void {
  const { currentHtml, followUpPrompt, appName } = req.body ?? {};

  if (!currentHtml || typeof currentHtml !== 'string' || !currentHtml.trim()) {
    res.status(400).json({ error: 'currentHtml is required' });
    return;
  }
  if (currentHtml.length > MAX_HTML) {
    res.status(400).json({ error: `currentHtml must be ${MAX_HTML} characters or fewer` });
    return;
  }

  if (!followUpPrompt || typeof followUpPrompt !== 'string' || !followUpPrompt.trim()) {
    res.status(400).json({ error: 'followUpPrompt is required' });
    return;
  }
  if (followUpPrompt.length > MAX_FOLLOW_UP) {
    res.status(400).json({ error: `followUpPrompt must be ${MAX_FOLLOW_UP} characters or fewer` });
    return;
  }

  if (!appName || typeof appName !== 'string' || !appName.trim()) {
    res.status(400).json({ error: 'appName is required' });
    return;
  }
  if (appName.length > MAX_APP_NAME) {
    res.status(400).json({ error: `appName must be ${MAX_APP_NAME} characters or fewer` });
    return;
  }

  next();
}
