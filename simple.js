var express = require('express'),
    path = require('path'),
    http = require('http'),
  PostRoutes = require('./routes/postRoutes');
var bodyParser = require('body-parser');
var postRoutes = require('./routes/postRoutes');
var app = express();

//Very important change for enabling cross domain origin ----------------Start
app.use(function(req, res, next) {
    var oneof = false;
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        console.log("Origin:"+req.headers.origin);
        oneof = true;
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        oneof = true;
    }
    if(req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        oneof = true;
    }
    if(oneof) {
        res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }

    // intercept OPTIONS method
    if (oneof && req.method == 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
});
//Very important change for enabling cross domain origin ----------------End
    app.set('port', process.env.PORT || 5000);
    app.set('view engine', 'jade');
    app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'images')));
app.get('/',postRoutes.GetAllPosts);
app.get('/drafts',postRoutes.GetDrafts);
app.get('/comments', postRoutes.GetComments);
app.get('/post/:slug', postRoutes.GetPostBySlug);
app.get('/tag/:tag', postRoutes.GetPostByTag);
app.post('/new', postRoutes.SaveNewPost);
app.put('/edit/:slug', postRoutes.EditPost);
app.post('/preview', postRoutes.PreviewPost);
app.post('/post/:slug/comment', postRoutes.AddComment);
var Server = http.createServer(app);

Server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});