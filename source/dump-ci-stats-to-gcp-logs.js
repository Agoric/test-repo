
// Capture input parameter (e.g., "Test Job")
const jobName = process.argv[2];

// GitHub Actions environment variables
const githubToken = process.env.GITHUB_TOKEN;  // GitHub token for API access
const repo = process.env.GITHUB_REPOSITORY;    // The repository (owner/repo)
const runId = process.env.GITHUB_RUN_ID;       // Run ID for this particular workflow execution

// API endpoint to get the workflow run details and jobs
const workflowUrl = `https://api.github.com/repos/${repo}/actions/runs/${runId}`;
const jobsUrl = `https://api.github.com/repos/${repo}/actions/runs/${runId}/jobs`;

console.log("process.env.GCP_CREDENTIALS", process.env.GCP_CREDENTIALS)
const gcpCredentials = JSON.parse(process.env.GCP_CREDENTIALS);

console.log("GCP CREDS:", gcpCredentials);


// Fetch workflow run-level details
async function fetchWorkflowDetails() {
    try {
        const response = await fetch(workflowUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract relevant workflow-level information
        const workflowDetails = {
            runId: data.id,
            workflowName: data.name,
            status: data.status,           // e.g., "in_progress", "completed"
            conclusion: data.conclusion,   // e.g., "success", "failure"
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            actor: data.actor.login,       // Who triggered the workflow
            repository: data.repository.full_name,
            event: data.event,             // e.g., "push", "pull_request"
            runAttempt: data.run_attempt,  // Attempt number (for retries)
            headBranch: data.head_branch,  // The branch that triggered the workflow
            headSha: data.head_sha,        // The commit SHA that triggered the workflow
            triggeredBy: data.actor.login  // The user who triggered the workflow
        };

        return workflowDetails;
    } catch (error) {
        console.error("Error fetching workflow details:", error);
        process.exit(1);
    }
}

// Fetch job details for the workflow run
async function fetchJobDetails() {
    try {
        const response = await fetch(jobsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Now we extract the relevant information from each job in the workflow run
        const jobDetails = data.jobs.map(job => ({
            jobId: job.id,
            jobName: job.name,
            status: job.status,         // e.g., "completed", "in_progress"
            conclusion: job.conclusion, // e.g., "success", "failure", "cancelled", "skipped"
            startedAt: job.started_at,
            completedAt: job.completed_at,
            executionTime: job.completed_at ? 
                (new Date(job.completed_at) - new Date(job.started_at)) / 1000 : null, // In seconds
            runnerName: job.runner_name,   // The name of the runner
            steps: job.steps.map(step => ({
                stepName: step.name,
                status: step.status,         // e.g., "completed"
                conclusion: step.conclusion, // e.g., "success", "failure"
                startedAt: step.started_at,
                completedAt: step.completed_at,
                executionTime: step.completed_at ? 
                    (new Date(step.completed_at) - new Date(step.started_at)) / 1000 : null // In seconds
            })),
            jobUrl: job.html_url // Link to the job details page
        }));

        return jobDetails;
    } catch (error) {
        console.error("Error fetching job details:", error);
        process.exit(1);
    }
}

// Main function to capture and log the combined workflow and job stats
(async () => {
    const workflowStats = await fetchWorkflowDetails();
    const jobStats = await fetchJobDetails();

    // Combine workflow stats and job stats into one object
    const finalStats = {
        workflow: workflowStats,
        jobs: jobStats
    };

    // Log the combined stats to the console
    // console.log("Combined Workflow and Job Stats:");
    // console.log(JSON.stringify(finalStats, null, 2));

    // Simulate sending the data to GCP Logs (replace with real GCP logic)
    sendToGCPLogs(finalStats);

    // Optionally, save the stats locally
    // fs.writeFileSync('final_stats.json', JSON.stringify(finalStats, null, 2));
})();

// Simulate sending data to GCP Logs
const { Logging } = require('@google-cloud/logging');  // Import the GCP Logging client

// Initialize the logging client
const logging = new Logging({
    projectId: gcpCredentials.project_id,
    credentials: {
      client_email: gcpCredentials.client_email,
      private_key: gcpCredentials.private_key
    }
});


// Define the log name (you can change this to any descriptive name)
const logName = 'ci-job-logs';
const log = logging.log(logName);

// Function to send the final stats to GCP Logs
async function sendToGCPLogs(data) {
    // Define the metadata for the log entry
    const metadata = {
        resource: { type: 'global' },  // Resource type can be 'global' or more specific if needed
        severity: 'INFO',
        labels: {                      // Adding custom labels
            identifier: 'GH-CI',    // Pass a unique identifier or label
            workflow_name: data.workflow.workflowName,  // Example of passing a workflow name as a label
        }
               // You can set the severity level (e.g., INFO, ERROR, WARNING)
    };

    // Create the log entry
    const entry = log.entry(metadata, data);

    try {
        // Write the log entry
        await log.write(entry);
        console.log('Log entry sent to GCP Logging successfully.');
    } catch (error) {
        console.error('Error sending log entry to GCP Logging:', error);
    }
}
