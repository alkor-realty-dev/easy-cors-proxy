var express = require('express'),
    request = require('request'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    path = require('path'),
    app = express();
try{
    var myLimit = typeof(process.argv[2]) != 'undefined' ? process.argv[2] : '100kb';
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
        
        if (req.method === 'OPTIONS') {
            // CORS Preflight
            res.send();
        } else {
            //console.log(req.originalUrl);
            var targetURL = req.originalUrl.substr(1);
            if ( targetURL !== "" && targetURL.indexOf("http://") !== 0 && targetURL.indexOf("https://") !== 0) {
                targetURL = 'https://' + targetURL;
            }
            if (!targetURL) {
               res.send(500, { error: 'There is no Target-Endpoint header in the request' });
               return;
            }
            // process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
            var headers = {};
            if ( req.header('Authorization')) {
                headers['Authorization'] = req.header('Authorization');
            }
             if ( req.header('X-Realt-Token')) {
                headers['X-Realt-Token'] = req.header('X-Realt-Token');
            }
             if ( req.header('X-Errors-Email')) {
                headers['X-Errors-Email'] = req.header('X-Errors-Email');
            }
             if ( req.header('X-AUTH-TOKEN')) {
                headers['X-AUTH-TOKEN'] = req.header('X-AUTH-TOKEN');
            }
            
            // url: targetURL, + req.url
            //console.log(targetURL);
            request({ 
                url: targetURL, 
                method: req.method, 
                json: req.body, 
                headers: headers,
                strictSSL: false },
                function (error, response, body) {
                    console.log(error);
                    console.log(response.statusCode);
                    //res.send(500, { error: error });
                    // if (error) {
                    //      console.log(error);
                    // }
                    // if (response) {
                    //      console.log(response);
                    // }
                    // if (body) {
                    //      console.log(body);
                    // }
                    //                console.log(body);
                }).pipe(res);
        }
    });

    app.set('port', process.env.PORT || 3001);

    app.listen(app.get('port'), function () {
        console.log('Proxy server listening on port ' + app.get('port'));
    });
}catch(err){
    console.log(err)
}
