"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');
var session = require('express-session');
var fs = require("fs");
var bodyParser = require('body-parser');
var multer = require('multer');
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();

// XXX - Your submission should work without this line
// var cs142models = require('./modelData/photoApp.js').cs142models;

mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function(request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function(request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function(err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {
                name: 'user',
                collection: User
            }, {
                name: 'photo',
                collection: Photo
            }, {
                name: 'schemaInfo',
                collection: SchemaInfo
            }
        ];
        async.each(collections, function(col, done_callback) {
            col.collection.count({}, function(err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function(err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));

            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function(request, response) {

    if (!request.session.user_id) {
        response.status(401).send('No user logged in.');
        return;
    }

    User.find({}, 'first_name last_name _id', function(err, users) {
        if (err) {
            console.error('Doing /user/list error:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        } else {
            response.status(200).send(users);
        }
    });

});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function(request, response) {
    if (!request.session.user_id) {
        response.status(401).send('No user logged in.');
        return;
    }

    var id = request.params.id;

    User.findOne({
        _id: id
    }, 'first_name last_name _id location description occupation', function(err, user) {
        if (err) {
            response.status(400).send('User not found.');
            return;
        } else {
            response.status(200).send(JSON.stringify(user));
        }

    });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function(request, response) {
    if (!request.session.user_id) {
        response.status(401).send('No user logged in.');
        return;
    }

    var id = request.params.id;

    var allPhotos = Photo.find({user_id: id}).sort('-likes').select('file_name date_time user_id _id likes liked favorited comments').populate({path: 'comments.user_id', model: 'User', select: '_id first_name last_name'}).lean().exec(function(error1, photos) {
        if (error1) {
            response.status(400).send('Photos not found.');
            return;
        } else {
            photos.forEach(function(photo) {
                photo.comments.forEach(function(comm) {
                    var obj = comm.user_id;
                    comm.user = obj;
                    delete comm.user_id;
                });
            });
            response.status(200).send(photos);
        }
    });

});

app.get('/favorites', function(request, response) {
    if (!request.session.user_id) {
        response.status(401).send('No user logged in.');
    }

    var userId = request.session.user_id;

    Photo.find({}, function(err, photos) {
        var favedPhotos = [];
        async.each(photos, function(photo, callback2) {
            var index = photo.favorited.indexOf(userId);
            if (index !== -1) {
                //found, so delete like
                favedPhotos.push(photo);
            }
            callback2();
        }, function(err) {
            if (err) {
                response.status(404).send('photo async error');
            }
            response.status(200).send(favedPhotos);
        });
    });

});

app.post('/likePhoto/:photo_id', function(request, response){
    var photoId = request.params.photo_id;
    var userId = request.body.user_id;

    if (request.session.user_id !== userId) {
        response.status(404).send('User not in session storage.');
    }

    Photo.findById(photoId, function(err, photo){
        if (err){
            response.status(404).send('Finding photo error.');
        } else if (!photo) {
            response.status(400).send('Photo not found.');
        } else {
            var index = photo.liked.indexOf(request.session.user_id);
            if (index === -1) {
                //not found, so add
                photo.liked.push(request.session.user_id);
                photo.likes = photo.likes + 1;
            } else {
                //found, so delete
                photo.liked.splice(index, 1);
                photo.likes = photo.likes - 1;
            }
            photo.save();
            response.status(200).send('Likes changed.');
        }
    });
});

app.post('/favPhoto/:photo_id', function(request, response){
    var photoId = request.params.photo_id;
    var userId = request.body.user_id;

    if (request.session.user_id !== userId) {
        response.status(404).send('User not in session storage.');
    }

    Photo.findById(photoId, function(err, photo){
        if (err){
            response.status(404).send('Finding photo error.');
        } else if (!photo) {
            response.status(400).send('Photo not found.');
        } else {
            var index = photo.favorited.indexOf(request.session.user_id);
            if (index === -1) {
                //not found, so add
                photo.favorited.push(request.session.user_id);
            } else {
                //found, so delete
                photo.favorited.splice(index, 1);
            }
            photo.save();
            response.status(200).send('Favorites changed.');
        }
    });
});

app.post('/admin/login', function(request, response) {
    var loginName = request.body.login_name;
    var pass = request.body.password;

    User.findOne({
        login_name: loginName
    }, function(err, user) {
        if (err) {
            response.status(404).send('Bad input.');
        }
        if (user !== null) {
            if (pass === user.password) {
                //login success
                request.session.user_id = user._id;
                response.status(200).send(JSON.stringify(user));
            } else {
                //wrong password
                response.status(400).send('Wrong password.');
            }
        } else {
            //user name doesn't exist
            response.status(400).send('Username does not exist.');
        }
    });
});

app.post('/user', function(request, response) {

    User.findOne({
        login_name: request.body.login_name
    }, function(err, user) {
        if (err) {
            response.status(404).send('Bad input.');
        }
        if (user !== null) {
            response.status(400).send('Username already exists.');
        } else {
            //create new user
            var newUser = new User({
                first_name: request.body.first_name,
                last_name: request.body.last_name,
                password: request.body.password,
                login_name: request.body.login_name,
                location: request.body.location,
                description: request.body.description,
                occupation: request.body.occupation
            });

            newUser.save(function(err) {
                if (err) {
                    response.status(400).send('Saving Problem.');
                } else {
                    response.status(200).send(JSON.stringify(newUser));
                }
            });
        }
    });
});

app.post('/admin/logout', function(request, response) {
    if (request.session.user_id) {
        request.session.destroy(function(err) {
            if (err) {
                response.status(404).send('Destruction failed.');
            } else {
                response.status(200).send('User logged out.');
            }
        });
    } else {
        response.status(400).send('No user logged in.');
    }

});

app.post('/commentsOfPhoto/:photo_id', function(request, response) {
    var photoId = request.params.photo_id;
    var comm = request.body.comment;
    var userId = request.session.user_id;

    Photo.findById(photoId, function(err, photo) {
        if (err) {
            response.status(404).send('Server Error.');
            return;
        }
        if (comm.length === 0) {
            response.status(400).send('Comment empty.');
            return;
        } else if (!photo) {
            response.status(400).send('Photo not found.');
            return;
        } else {

            photo.comments.push({comment: comm, user_id: userId});

            photo.save(function(err, done) {
                if (err) {
                    response.status(400).send('Saving Problem.');
                    return;
                } else {
                    response.status(200).send(JSON.stringify(done));
                }
            });
        }
    });
});

app.post('/photos/new', function(request, response) {

    processFormBody(request, response, function(err) {
        if (err || !request.file) {
            if (!request.file) {
                response.status(400).send('No file.');
            }
            response.status(404).send('Server error.');
            return;
        }
        // request.file has the following properties of interest
        //      fieldname      - Should be 'uploadedphoto' since that is what we sent
        //      originalname:  - The name of the file the user uploaded
        //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
        //      buffer:        - A node Buffer containing the contents of the file
        //      size:          - The size of the file in bytes

        // XXX - Do some validation here.
        // We need to create the file in the directory "images" under an unique name. We make
        // the original file name unique by adding a unique prefix with a timestamp.
        var timestamp = new Date().valueOf();
        var filename = 'U' + String(timestamp) + request.file.originalname;

        fs.writeFile("./images/" + filename, request.file.buffer, function(err) {
            // XXX - Once you have the file written into your images directory under the name
            // filename you can create the Photo object in the database

            if (err) {
                response.status(400).send('Writing file problem.');
                return;
            }

            var thePhoto = new Photo({
                file_name: filename, // 	Name of a file containing the actual photo (in the directory project6/images).
                user_id: request.session.user_id // The user object of the user who created the photo.
            });

            thePhoto.save(function(err, done) {
                if (err) {
                    response.status(400).send('Saving Problem.');
                    return;
                } else {
                    response.status(200).send(JSON.stringify(done));
                }
            });
        });
    });
});

app.delete('/delete/:type/:commId/:photoId', function(request, response) {
    var objType = request.params.type;
    var photoId = request.params.photoId;
    var commId = request.params.commId;

    if (objType === '') {
        response.status(400).send('no object type passed');
    } else if (photoId === '') {
        response.status(400).send('no photo id passed');
    }

    if (objType === 'comment') {
        //delete comment
        Photo.findById(photoId, function(err, photo) {
            if (err) {
                response.status(404).send('Server error after call.');
            } else if (!photo) {
                response.status(400).send('Photo not found.');
            } else {
                photo.comments.id(commId).remove();

                photo.save(function(err, done) {
                    if (err) {
                        response.status(400).send('Saving Problem.');
                        return;
                    } else {
                        response.status(200).send(done);
                    }
                });
            }
        });

    } else if (objType === 'photo') {
        //delete photo
        Photo.remove({
            _id: photoId
        }, function(err, photoGone) {
            if (err) {
                response.status(404).send('deleting problem');
            } else {
                response.status(200).send(photoGone);
            }
        });

    } else {
        response.status(400).send('not a valid object type');
    }

});

app.delete('/deleteuser/:id', function(request, response) {
    var userId = request.params.id;

    Photo.find({user_id: userId}).remove(function(err) {
        if (err) {
            response.status(404).send('removing photos error');
        }
    });

    Photo.find({}, function(err, photos) {
        async.each(photos, function(photo, callback2) {
            var newComments = [];
            var index = photo.liked.indexOf(userId);
            if (index !== -1) {
                //found, so delete like
                photo.liked.splice(index, 1);
                photo.likes = photo.likes - 1;
            }
            index = photo.favorited.indexOf(userId);
            if (index !== -1) {
                //found, so delete like
                photo.favorited.splice(index, 1);
            }
            async.each(photo.comments, function(comment, callback1) {
                if (JSON.stringify(comment.user_id) !== JSON.stringify(userId)) {
                    newComments.push(comment);
                }
                callback1();
            }, function(err) {
                if (err) {
                    response.status(404).send('comment async error');
                }
                delete photo.comments;
                photo.comments = newComments;
                photo.save();
            });
            callback2();
        }, function(err) {
            if (err) {
                response.status(404).send('photo async error');
            }
        });
    });

    User.remove({
        _id: userId
    }, function(err, userGone) {
        if (err) {
            response.status(404).send('user deleting problem');
        } else {
            response.status(200).send(userGone);
        }
    });

});

var server = app.listen(3000, function() {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
