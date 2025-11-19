# Vercel Deployment Setup

This repository is configured to automatically deploy to Vercel via GitHub Actions.

## Required GitHub Secrets

The following secrets must be configured in GitHub repository settings:

- `VERCEL_TOKEN` - Vercel authentication token
- `VERCEL_ORG_ID` - Vercel organization/user ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Deployment Workflows

### Production Deployment
- Triggers: Push to `main` branch
- Workflow: `.github/workflows/deploy.yml`
- Environment: Production

### Preview Deployment
- Triggers: Pull requests
- Workflow: `.github/workflows/pr-preview.yml`
- Environment: Preview
- Includes Lighthouse CI performance checks

## Conditional Deployment

Both workflows include conditional checks - they will skip Vercel deployment if the required secrets are not configured. This allows CI to pass even when Vercel is not set up.
