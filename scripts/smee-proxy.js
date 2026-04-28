const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const JENKINS_URL = 'http://localhost:8080';
const JOB_NAME = 'contact manager';

app.post('*', async (req, res) => {
    console.log('--- Received Request ---');
    console.log('Headers:', req.headers);
    console.log('Body Keys:', Object.keys(req.body));
    console.log('EC2_HOST:', req.body.EC2_HOST);

    const params = new URLSearchParams();
    for (const key in req.body) {
        params.append(key, req.body[key]);
    }

    try {
        const response = await axios.post(`${JENKINS_URL}/job/${encodeURIComponent(JOB_NAME)}/buildWithParameters`, params, {
            headers: {
                'Authorization': req.headers.authorization,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('Jenkins Response:', response.status);
        res.status(response.status).send(response.data);
    } catch (error) {
        console.error('Jenkins Error:', error.response ? error.response.status : error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});

app.listen(3000, () => {
    console.log('Proxy listening on port 3000');
});
