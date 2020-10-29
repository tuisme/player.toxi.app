'use strict'

const PORT = $PORT || 3000;
const express = require('express');
const bodyParser = require('body-parser');

const path = require('path');
const cors = require('cors');

const app = express();

const request = require('request');
const getLink = require('./lib/getlink');

app.use(cors());
app.options('*', (req, res, next) => res.end());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.get('/', async (req, res) => {

    var fileId = req.query.fileId || null;
    if(!fileId) return res.end('Vui long them query ?fileId={drive-id}');

    var datas = await getLink(fileId);
    if(!datas) return res.end('Get link that bai');
    
    var result = [];
    var domain = req.protocol + '://' + req.get('host');
    var cookie = new Buffer.from(JSON.stringify(datas.cookie)).toString('base64');
    
    var sources = datas.sources;
    for (let i = 0; i < sources.length; i++) {

        var label = sources[i].label;
        var urnEnc = new Buffer.from(sources[i].file).toString('base64');
        var file = domain+'/videdplayback?url='+urnEnc+'&cookie='+cookie;
        
        result.push({ file, label });
    }

    return res.json(result)
});

app.get('/videdplayback', async (req, res) => {

    var url = req.query.url || null;
    var cookie = req.query.cookie || null;
    if(!url || !cookie) return res.end();

    url = new Buffer.from(url, 'base64').toString('ascii');
    cookie = JSON.parse(new Buffer.from(cookie, 'base64').toString('ascii'));
    
    if(!url || !cookie) return res.end();

    const headers = Object.assign(req.headers, { cookie });

    delete headers.host;
    delete headers.referer;

    request({ url, headers }).pipe(res);
})

app.listen(PORT, () => console.log('Run app port: %s', PORT))