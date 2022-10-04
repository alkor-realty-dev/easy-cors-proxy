var express = require('express'),
    request = require('request'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    path = require('path'),
    app = express();
try {/*
https://alkor-realty.herokuapp.com/https://drive-b.amocrm.ru/download/bd9db311-6aca-56a8-bd05-f93111ee3a1d/57749124-c0dc-4460-b9cf-d6bc9825a1f4/logos.png
   */ var myLimit = typeof (process.argv[2]) != 'undefined' ? process.argv[2] : '100kb', reqMethod;
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
            //console.log(req.originalUrl);
            var targetURL = req.originalUrl.substr(1);
            if (targetURL !== "" && targetURL.indexOf("http://") !== 0 && targetURL.indexOf("https://") !== 0) {
                targetURL = 'https://' + targetURL;
            }
            if (!targetURL) {
                res.send(500, {error: 'There is no Target-Endpoint header in the request'});
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

            if (req.header('X-GET-302') && reqMethod === 'HEAD') {
                reqMethod = 'GET';
            }

            request({
                    url: targetURL,
                    method: reqMethod,
                    json: req.body,
                    headers: headers,
                    strictSSL: false,
                    followRedirect:  function (response, body) {
                        if (req.header('X-GET-302')) {

                           // res.send(202, {  response: response, body: body });

                            return true;
                        }
                    }
                },
                function (error, response, body) {
                    if (req.header('X-GET-302')) {
                        /*if (error) {
                            res.send(500, { error: error });
                        }
                        if (response && response.statusCode) {
                            res.send(response.statusCode, {'response' : response, 'body': body });
                        }
                        res.send(201, { error: error, response: response, body: body })*/
                    }
                }).pipe(res);
        }
    });

    app.set('port', process.env.PORT || 3001);

    app.listen(app.get('port'), function () {
        console.log('Proxy server listening on port ' + app.get('port'));
    });
} catch (err) {
    console.log(err)
}
