# GitHub Artifacts Download Proxy

A secure, standalone download page for listing and downloading GitHub Actions artifacts from **Private Repositories**.

It uses a lightweight Node.js proxy to handle GitHub authentication on the server side, allowing you to share a public download link without exposing your GitHub Personal Access Token (PAT).

## Features
- 🔒 **Secure**: Keeps your GitHub Token safe on the server.
- 📂 **Auto-Listing**: Fetches the latest build artifacts from your repo.
- 🎨 **Modern UI**: Clean, dark-mode design with filtering for expired artifacts.
- 🚀 **Docker Ready**: Easy to deploy on any platform (Dokploy, Portainer, etc.).

## Prerequisites
- A GitHub Personal Access Token (PAT) with `repo` scope (or `public_repo` if public).
- Node.js 18+ (for local dev) OR Docker.

## 🔑 GitHub Token Generation

You need a Personal Access Token (PAT) for the server to access your artifacts.

### Option A: Fine-grained Token (Recommended)
1.  Go to **Settings** > **Developer settings** > **Personal access tokens** > **Fine-grained tokens**.
2.  Click **Generate new token**.
3.  **Repository access**: Select **"Only select repositories"** and choose your target repository.
4.  **Permissions**:
    - Click **Repository permissions**.
    - Find **Actions** and select **Read-only**.
    - (Metadata permission is selected automatically).

### Option B: Classic Token
1.  Go to **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
2.  Click **Generate new token (classic)**.
3.  **Scopes**:
    - **Private Repo**: Check `repo` (Full control of private repositories).
    - **Public Repo**: Check `public_repo`.

## Configuration
The application is configured via Environment Variables.

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_TOKEN` | **Required**. Your GitHub PAT. | `ghp_abc123...` |
| `REPO_OWNER` | **Required**. GitHub Username. | `horsley` |
| `REPO_NAME` | **Required**. Repository Name. | `my-project` |
| `DOWNLOAD_MODE` | `redirect` (Default) or `proxy`. | `redirect` |
| `PORT` | Optional. Server port (default: 3000). | `3000` |

### Download Modes
- **redirect** (Default): Redirects user to GitHub's signed URL. Faster, saves server bandwidth.
- **proxy**: Server downloads and streams the file to user. Use if users cannot access GitHub directly.

## Quick Start (Docker)
The easiest way to run the application.

1.  **Build the image** (or skip if pulling from a registry):
    ```bash
    docker build -t artifacts-proxy .
    ```

2.  **Run the container**:
    ```bash
    docker run -d \
      -p 3000:3000 \
      -e GITHUB_TOKEN=your_token_here \
      -e REPO_OWNER=your_username \
      -e REPO_NAME=your_repo_name \
      --name artifacts-page \
      artifacts-proxy
    ```

3.  Visit `http://localhost:3000`.

## Local Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    Copy `.env.example` to `.env` and update it:
    ```bash
    cp .env.example .env
    # Edit .env with your details
    ```

3.  **Start Server**:
    ```bash
    npm run dev
    ```

## Project Structure
- `server.js`: Express.js proxy server.
- `index.html`: The frontend UI.
- `style.css`: Styling.
- `Dockerfile`: Container definition.
