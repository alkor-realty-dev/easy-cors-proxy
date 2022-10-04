var express = require('express'),
    request = require('request'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    path = require('path'),
    app = express();
try {
    var myLimit = typeof (process.argv[2]) != 'undefined' ? process.argv[2] : '1500kb', reqMethod;
    console.log('Using limit: ', myLimit);

    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

    app.use(bodyParser.json({limit: myLimit}));

    app.all('*', function (req, res, next) {
        // Set CORS headers: allow all origins, methods, and headers: you may want to lock this down in a production environment
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE, HEAD");
        res.header("Access-Control-Allow-Headers", req.header('access-control-request-headers') ||
            'Access-Control-Allow-Origin, X-AUTH-TOKEN, origin, content-type, accept, location, code, X-Realt-Token, X-Errors-Email');
        res.header('Access-Control-Allow-Credentials', false);

        reqMethod = req.method;
        if (reqMethod === 'OPTIONS') {
            // CORS Preflight
            res.send();
        } else {
            var targetURL = req.originalUrl.substr(1);
            if (targetURL !== "" && targetURL.indexOf("http://") !== 0 && targetURL.indexOf("https://") !== 0) {
                targetURL = 'https://' + targetURL;
            }
            if (!targetURL) {
                res.status(500).send({error: 'There is no Target-Endpoint header in the request'});
                return;
            }

            var headers = {};
            if (req.header('Authorization')) {
                headers['Authorization'] = req.header('Authorization');
            }
            if (req.header('X-Realt-Token')) {
                headers['X-Realt-Token'] = req.header('X-Realt-Token');
            }
            if (req.header('X-Errors-Email')) {
                headers['X-Errors-Email'] = req.header('X-Errors-Email');
            }
            if (req.header('X-AUTH-TOKEN')) {
                headers['X-AUTH-TOKEN'] = req.header('X-AUTH-TOKEN');
            }
            
            if (req.header('X-GET-302')) {
                request({
                        url: targetURL,
                        method: reqMethod,
                        json: req.body,
                        headers: headers,
                        strictSSL: false,
                    },
                    function (error, response) {
                        if (error) {
                             res.status(500).send({ error: error });
                         } else if (response && response.statusCode === 200 && response.request?.uri?.href ) {
                            res.status(200).send({url: response.request.uri.href});
                         } else {
                            res.status(200).send(response);
                        }
                    });
            } else {
                request({
                        url: targetURL,
                        method: reqMethod,
                        json: req.body,
                        headers: headers,
                        strictSSL: false,
                    },
                    function (error, response, body) {}).pipe(res);
            }
        }
    });

    app.set('port', process.env.PORT || 3001);

    app.listen(app.get('port'), function () {
        console.log('Proxy server listening on port ' + app.get('port'));
    });
} catch (err) {
    console.log(err)
}
