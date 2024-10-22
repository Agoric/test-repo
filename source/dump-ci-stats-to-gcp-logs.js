// // Access the command line arguments passed to the script
// const inputParam = process.argv[2]; // process.argv[0] is 'node', argv[1] is the script path

// // Check if an argument was provided
// if (!inputParam) {
//     console.error("No parameter provided! Please pass a parameter as an argument.");
//     process.exit(1); // Exit with a non-zero code to indicate an error
// }

// // Log the provided parameter to the console
// console.log(`The provided parameter is: ${inputParam}`);

// Import necessary modules
// const fs = require('fs');

// Capture input parameter (e.g., "Test Job")
const jobName = process.argv[2];

// GitHub Actions environment variables
const jobStatus = process.env.GITHUB_JOB;  // This gives you the name of the current job
const conclusion = process.env.GITHUB_WORKFLOW;  // This gives the workflow name
const runId = process.env.GITHUB_RUN_ID;   // Run ID for this particular workflow execution
const runNumber = process.env.GITHUB_RUN_NUMBER; // Run number (increasing with each push)
const actor = process.env.GITHUB_ACTOR;    // Who triggered the workflow (user)
const repo = process.env.GITHUB_REPOSITORY; // The repo (owner/repo)
const sha = process.env.GITHUB_SHA;        // Commit SHA being tested

// Start and end time can be calculated from process times
const startTime = new Date(process.env.GITHUB_EVENT_PATH);  // When the job started
const endTime = new Date();  // When this script ends
const executionTime = (endTime - startTime) / 1000;  // Convert to seconds

// This function simulates sending data to GCP logs (can be replaced with actual GCP code)
function sendToGCPLogs(data) {
    console.log("Sending the following data to GCP Logs...");
    console.log(JSON.stringify(data, null, 2));
    // In a real scenario, you would use a logging library to send this data to GCP.
}

// Gather the stats for the "Test Job"
const jobStats = {
    jobName: jobName,
    repository: repo,
    actor: actor,
    commitSha: sha,
    runId: runId,
    runNumber: runNumber,
    status: jobStatus,   // Whether the job succeeded, failed, or was canceled
    conclusion: conclusion, // Workflow name or conclusion
    executionTime: `${executionTime} seconds`, // Execution time in seconds
    startTime: startTime,
    endTime: endTime
};

// Log the stats to the console
console.log("Job Stats:");
console.log(JSON.stringify(jobStats, null, 2));

// Simulate sending the data to GCP Logs
// sendToGCPLogs(jobStats);

// Optionally, you could save the data locally or to a log file
// fs.writeFileSync('job_stats.json', JSON.stringify(jobStats, null, 2));

