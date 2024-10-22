// const axios = require('axios');
const fs = require('fs');

// Capture input parameter (e.g., "Test Job")
const jobName = process.argv[2];

// GitHub Actions environment variables
const githubToken = process.env.GITHUB_TOKEN;  // GitHub token for API access
const repo = process.env.GITHUB_REPOSITORY;    // The repository (owner/repo)
const runId = process.env.GITHUB_RUN_ID;       // Run ID for this particular workflow execution

// API endpoint to get workflow run information
const apiUrl = `https://api.github.com/repos/${repo}/actions/runs/${runId}`;

// Fetch workflow status via GitHub API
async function fetchWorkflowStatus() {
    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        // Extract relevant information
        const status = response.data.status;           // in_progress, completed, etc.
        const conclusion = response.data.conclusion;   // success, failure, neutral, cancelled, etc.
        const startTime = response.data.created_at;
        const endTime = response.data.updated_at;

        const executionTime = (new Date(endTime) - new Date(startTime)) / 1000;  // Convert to seconds

        return { status, conclusion, executionTime, startTime, endTime };
    } catch (error) {
        console.error("Error fetching workflow status:", error);
        process.exit(1);
    }
}

// Main function to capture and log the stats
(async () => {
    const workflowStats = await fetchWorkflowStatus();

    const jobStats = {
        jobName: jobName,
        repository: repo,
        runId: runId,
        status: workflowStats.status,
        conclusion: workflowStats.conclusion,
        executionTime: `${workflowStats.executionTime} seconds`,
        startTime: workflowStats.startTime,
        endTime: workflowStats.endTime,
    };


    // Simulate sending the data to GCP Logs (replace with real GCP logic)
    sendToGCPLogs(jobStats);

})();

// Simulate sending data to GCP Logs
function sendToGCPLogs(data) {
    console.log("Sending the following data to GCP Logs...");
    console.log(JSON.stringify(data, null, 2));
}
