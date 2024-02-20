const newman = require('newman');

// Define the path to your Postman collection file
const collectionPath = '/Users/jbailey/Code/Scripts/Cloudflare/admin-access-logpush-v2/Cloudflare Audit Logs.postman_collection.json';

// Run Postman collection
newman.run({
    collection: require(collectionPath),
    reporters: 'cli'
}, function (err, summary) {
    if (err) { throw err; }

    console.log('Collection run complete!');

    // Extract logs from Cloudflare and send them to Datadog
    const logs = summary.run.executions.map(execution => execution.item.log);

    // Assuming you have an API key and endpoint for Datadog Logs API
    const apiKey = 'Redacted';
    const datadogEndpoint = 'https://http-intake.logs.datadoghq.com/v1/input';

    // Send logs to Datadog
    sendLogsToDatadog(logs, apiKey, datadogEndpoint);
});

function sendLogsToDatadog(logs, apiKey, endpoint) {
    const https = require('https');

    const payload = JSON.stringify(logs);

    const options = {
        hostname: 'http-intake.logs.datadoghq.com',
        port: 443,
        path: '/v1/input/' + apiKey,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            console.log(`Body: ${chunk}`);
        });
    });

    req.on('error', (e) => {
        console.error(`Error: ${e.message}`);
    });

    req.write(payload);
    req.end();
}
