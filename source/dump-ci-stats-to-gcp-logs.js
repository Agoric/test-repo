// Access the command line arguments passed to the script
const inputParam = process.argv[2]; // process.argv[0] is 'node', argv[1] is the script path

// Check if an argument was provided
if (!inputParam) {
    console.error("No parameter provided! Please pass a parameter as an argument.");
    process.exit(1); // Exit with a non-zero code to indicate an error
}

// Log the provided parameter to the console
console.log(`The provided parameter is: ${inputParam}`);