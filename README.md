# AWS Elastic Beanstalk Deployment Guide

This project is configured to automatically deploy to AWS Elastic Beanstalk whenever code is pushed to the `main` and `develop` branch.

## Prerequisites

1. **AWS Account** with Elastic Beanstalk access
2. **GitHub repository** with Actions enabled
3. **AWS Elastic Beanstalk application and environment** already created

## Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

### To add secrets:
1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of the following:

### Required Secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS Access Key ID for deployment | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_SESSION_TOKEN` | AWS Session Token for temporary credentials | `FQoGZXIvYXdzE...` |
| `EB_APPLICATION_NAME` | Your Elastic Beanstalk application name | `my-node-app` |
| `EB_ENVIRONMENT_NAME` | Your Elastic Beanstalk environment name | `my-node-app-env` |
| `AWS_REGION` | AWS region where your EB app is deployed | `us-east-1` |

## Elastic Beanstalk Configuration

### For Node.js Applications:
- **Platform**: Node.js 24
- **Application type**: Web server

### For Docker Applications:
- **Platform**: Docker
- **Application type**: Web server

The deployment package includes:
- `package.json` and `package-lock.json`
- Source TypeScript files in `src/` directory
- `tsconfig.json` for TypeScript compilation
- `Dockerfile`, `.dockerignore`, and `Dockerrun.aws.json` (for Docker deployments)

## Deployment Process

1. **Push to main/develop branch** - This triggers the GitHub Action
2. **Setup** - The action sets up Node.js 24 and installs dependencies with `npm ci`
3. **Package** - Creates `beanstalk.zip` with source files and configuration
4. **Deploy** - Uploads and deploys to Elastic Beanstalk using the deployment package
5. **Artifact** - Saves the deployment package as a GitHub artifact with 30-day retention

## Manual Deployment

If you need to deploy manually, you can:

1. Install dependencies locally:
   ```bash
   npm ci
   ```

2. Create the deployment package:
   ```bash
   mkdir -p deploy-package
   cp package.json deploy-package/
   cp package-lock.json deploy-package/
   cp -r src deploy-package/
   cp tsconfig.json deploy-package/
   cp Dockerfile deploy-package/
   cp .dockerignore deploy-package/
   cp Dockerrun.aws.json deploy-package/
   cd deploy-package && zip -r ../beanstalk.zip . && cd ..
   rm -rf deploy-package
   ```

3. Upload `beanstalk.zip` to Elastic Beanstalk manually through the AWS console

## Troubleshooting

- **Build fails**: Check that all dependencies are properly listed in `package.json`
- **Deployment fails**: Verify AWS credentials and Elastic Beanstalk application/environment names
- **Application doesn't start**: Check that your TypeScript source files are properly structured and `tsconfig.json` is configured correctly
- **Port issues**: Ensure your application listens on the port specified by the `PORT` environment variable (Elastic Beanstalk default)
- **Docker issues**: Verify that `Dockerfile`, `.dockerignore`, and `Dockerrun.aws.json` are properly configured

## Environment Variables

If your application requires environment variables, set them in the Elastic Beanstalk environment configuration through the AWS console. 