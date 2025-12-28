require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
    console.error('❌ Missing environment variables. Please check .env file.');
    process.exit(1);
}

// Serve static files (HTML, CSS)
app.use(express.static(path.join(__dirname)));

// API: List Artifacts
app.get('/api/artifacts', async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/artifacts?per_page=30`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching artifacts:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch artifacts' });
    }
});

// API: Download Artifact
app.get('/api/download/:id', async (req, res) => {
    const artifactId = req.params.id;
    try {
        // 1. Get the download URL (redirect)
        const response = await axios.get(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/artifacts/${artifactId}/zip`,
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                },
                responseType: 'stream', // Important for piping
                maxRedirects: 5
            }
        );

        // 2. Stream the file to the client
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="artifact-${artifactId}.zip"`);
        response.data.pipe(res);

    } catch (error) {
        console.error('Error downloading artifact:', error.message);
        res.status(error.response?.status || 500).json({ error: 'Failed to download artifact' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`   Serving artifacts for: ${REPO_OWNER}/${REPO_NAME}`);
});
