const http = require('http');
const https = require('https');
const { URLSearchParams } = require('url');

const JENKINS_URL = 'http://localhost:8080';
const JOB_NAME = 'contact manager';

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            console.log('--- Received Request from Smee ---');
            try {
                const data = JSON.parse(body);
                console.log('Parameters received:', Object.keys(data).join(', '));
                console.log('EC2_HOST:', data.EC2_HOST);

                // Prepare Jenkins Request
                const params = new URLSearchParams();
                for (const key in data) {
                    params.append(key, data[key]);
                }

                const postData = params.toString();
                const jenkinsReq = http.request(`${JENKINS_URL}/job/${encodeURIComponent(JOB_NAME)}/buildWithParameters`, {
                    method: 'POST',
                    headers: {
                        'Authorization': req.headers.authorization,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                }, (jenkinsRes) => {
                    console.log('Jenkins status:', jenkinsRes.statusCode);
                    res.statusCode = jenkinsRes.statusCode;
                    jenkinsRes.pipe(res);
                });

                jenkinsReq.on('error', (e) => {
                    console.error('Jenkins error:', e.message);
                    res.statusCode = 500;
                    res.end(e.message);
                });

                jenkinsReq.write(postData);
                jenkinsReq.end();

            } catch (e) {
                console.error('Error parsing JSON:', e.message);
                res.statusCode = 400;
                res.end('Invalid JSON');
            }
        });
    } else {
        res.statusCode = 404;
        res.end('Not Found');
    }
});

server.listen(3005, () => {
    console.log('Smee Proxy for Jenkins listening on port 3005');
});
