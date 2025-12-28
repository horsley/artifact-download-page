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
        console.error('❌ Error fetching artifacts:');
        console.error(`   Status: ${error.response?.status}`);
        console.error(`   URL: ${error.config?.url}`);
        console.error('   Response:', JSON.stringify(error.response?.data, null, 2));

        if (error.response?.status === 404) {
            console.error('💡 TIP: 404 usually means:');
            console.error('   1. REPO_OWNER or REPO_NAME is incorrect in .env');
            console.error('   2. GITHUB_TOKEN is invalid');
            console.error('   3. GITHUB_TOKEN does not have "repo" scope (required for private repos)');
        }

        res.status(error.response?.status || 500).json({ error: 'Failed to fetch artifacts', details: error.response?.data });
    }
});

// API: Download Artifact
app.get('/api/download/:id', async (req, res) => {
    const artifactId = req.params.id;
    const downloadMode = process.env.DOWNLOAD_MODE || 'redirect'; // 'redirect' (default) or 'proxy'

    try {
        if (downloadMode === 'proxy') {
            // PROXY MODE: Server downloads and streams to client

            // 1. Fetch Metadata (to get Name and Size)
            const metadataResponse = await axios.get(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/artifacts/${artifactId}`,
                {
                    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
                }
            );

            const artifactName = metadataResponse.data.name;
            const artifactSize = metadataResponse.data.size_in_bytes;

            // 2. Start Stream
            const response = await axios.get(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/artifacts/${artifactId}/zip`,
                {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    },
                    responseType: 'stream',
                    maxRedirects: 5
                }
            );

            // 3. Set Headers for Progress and Filename
            res.setHeader('Content-Type', 'application/zip');
            // Encode filename to handle special characters
            const filename = encodeURIComponent(artifactName + '.zip');
            res.setHeader('Content-Disposition', `attachment; filename="${artifactName}.zip"; filename*=UTF-8''${filename}`);
            if (artifactSize) {
                res.setHeader('Content-Length', artifactSize);
            }

            response.data.pipe(res);

        } else {
            // REDIRECT MODE (Default): Redirect client to GitHub's signed URL
            // Faster, saves bandwidth, requires client to reach GitHub
            const response = await axios.get(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/artifacts/${artifactId}/zip`,
                {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    },
                    maxRedirects: 0,
                    validateStatus: function (status) {
                        return status >= 200 && status < 400;
                    }
                }
            );

            const signedUrl = response.headers.location;
            if (!signedUrl) throw new Error('No redirect location found');
            res.redirect(signedUrl);
        }

    } catch (error) {
        console.error(`❌ Error downloading artifact (Mode: ${downloadMode}):`);
        console.error(`   Status: ${error.response?.status}`);
        res.status(500).json({ error: 'Failed to retrieve download link' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`   Serving artifacts for: ${REPO_OWNER}/${REPO_NAME}`);
    console.log(`   Download Mode: ${process.env.DOWNLOAD_MODE || 'redirect'}`);
});
