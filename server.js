const express = require('express'),
    request = require('request'),
    favicon = require('serve-favicon'),
    bodyParser = require('body-parser'),
    path = require('path'),
    cloudinary = require('cloudinary').v2,
    app = express();

const uploadImage = async (imagePath) => {
    // Use the uploaded file's name as the asset's public ID and
    // allow overwriting the asset with new versions
    const options = {
        folder: 'temp',
    };

    try {
        let resObj = {};
        const result = await cloudinary.uploader.upload(imagePath, options);
        if (result?.public_id) {
            resObj[result.public_id] = result.secure_url;
        }
        return resObj;
    } catch (error) {
        console.error(error);
    }
};

const deleteImages = async (imagesArr) => {
    // Use the uploaded file's name as the asset's public ID and
    // allow overwriting the asset with new versions
    const options = {
        folder: 'temp',
    };

    try {
        return await cloudinary.uploader.remove_all_context(imagesArr, options);
    } catch (error) {
        console.error(error);
    }
};

try {
    var myLimit = typeof (process.argv[2]) != 'undefined' ? process.argv[2] : '1500kb', reqMethod, faviconPath;

    console.log('Using limit: ', myLimit);
    faviconPath = path.join(__dirname, 'public', 'favicon.ico');
    app.use(favicon(faviconPath));

    app.use(bodyParser.json({limit: myLimit}));

    app.all('*', async function (req, res, next) {
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
                if (targetURL !== "" && targetURL.indexOf("://") !== 0) {
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

                if (req.header('X-GET-302') || req.header('X-CLEAR-TEMP-302')) {
                    let imageesArr, cdnInageArr, xData;

                    xData = req.header('X-DATA') ? JSON.parse(req.header('X-DATA')) : false;
                    if (xData.cloudinaryConfig) {
                        cloudinary.config(xData.cloudinaryConfig);
                    }
                    imageesArr = xData?.imageUrls ? xData.imageUrls : false;
                    cdnInageArr = [];

                    res.status(200).send({'sssss': xData});
                    console.log(req);
                    /*if (req.header('X-GET-302')) {
                        for (var i = 0; i < imageesArr.length; i++) {
                            var ingUrl = imageesArr[i], rawIOmgData, cdnImageUrlObj;

                            try {
                                rawIOmgData = await request({
                                    url: ingUrl,
                                    method: "GET",
                                    strictSSL: false,
                                })

                                if (rawIOmgData) {
                                    try {
                                        cdnImageUrlObj = await uploadImage(rawIOmgData);

                                        if (cdnImageUrlObj && Object.keys(cdnImageUrlObj).length) {
                                            cdnInageArr.push(cdnImageUrlObj);
                                        }
                                    } catch {
                                    }
                                }
                            } catch {
                            }
                        }

                        if (cdnInageArr?.length) {
                            res.status(200).send({'imageUrls': cdnInageArr});
                        } else {
                            res.status(200).send({'imageUrls': false});
                        }
                    } else if (req.header('X-CLEAR-TEMP-302')) {
                        imageesidsArr = xData?.imageIds ? xData.imageIds : false;
                        if (imageesidsArr) {
                            deleteRes = await deleteImages(imageesidsArr);
                        }

                        if (deleteRes) {
                            res.status(200).send({'result': deleteRes});
                        } else {
                            res.status(200).send({'result': false});
                        }
                    }*/
                } else {
                    request({
                            url: targetURL,
                            method: reqMethod,
                            json: req.body,
                            headers: headers,
                            strictSSL: false,
                        },
                        function (error, response, body) {
                        }).pipe(res);
                }
            }
        }
    );

    app.set('port', process.env.PORT || 3001);

    app.listen(app.get('port'), function () {
        console.log('Proxy server listening on port ' + app.get('port'));
    });
} catch (err) {
    console.log(err)
}
