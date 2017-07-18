var Post         = require('../models/Post');
var config = {
  name: 'Simple Blog',
  publicPath: '/public',
  viewPath: '/views',
  dumpPath: false,
  slugType: 'title',
  rootDir: __dirname,
  redirectWWW: true,
  pageSize: 3,
  secret: process.env.BLOG_SECRET || 'password',
  rss: false
};
exports.GetAllPosts = function (req, res) {
	  var limit = config.pageSize;
    console.log('inside root get');
    // ?p=1 OR ?page=1
    req.query.page = req.query.p || req.query.page;

    Post
      .where('published', true)
      .sort({ date: 'desc' })
      .limit(limit)
      .skip(Math.max(0, req.query.page - 1) * limit || 0)
      .exec(function(err, posts) {
        if (err) { res.statusCode(500); res.end(); }
        
        res.send(200, {
          title: '',
          posts: posts,
          page: parseInt(req.query.page, 1) || 1
        });

      });
}

exports.GetDrafts = function (req, res) {
	 Post
      .where('published', false)
      .sort({ date: 'desc' })
      .exec(function(err, posts) {
        if (err) { res.statusCode(500); res.end(); }
        res.render('drafts', {
          title: 'Drafts',
          posts: posts
        });
      });
}

exports.GetComments = function (req, res) {
	 Post
      .where('numComments').gt(0)
      .sort({ 'comments.date': 'desc' })
      .limit(10)
      .exec(function(err, posts) {
        if (err) { res.statusCode(500); res.end(); }
        res.render('comments', {
          title: 'Comments',
          posts: posts
        });
      });
}

exports.GetPostBySlug = function (req, res) {
	 Post
      .where('slug', req.params.slug)
      .findOne( function(err, post) {
        if (err || !post) { return next(); }
        res.render('post', { title: post.title, post: post });
      });
}

exports.GetPostByTag = function (req, res) {
	 Post
      .where('tags', req.params.tag)
      .where('published', true)
      .sort({ date: 'desc' })
      .exec(function(err, posts) {
        if (err) { res.statusCode = 500; res.end(); }
        if (posts) {
          var post = posts[0];
          res.render('tag', { title: '#' + req.params.tag, posts: posts, tag: req.params.tag });
        } else {
          res.statusCode = 404;
          res.end();
        }
      });
}

exports.SaveNewPost = function (req, res) {
	 if (
      process.env.NODE_ENV === 'production' &&
      req.body.payload.secret !== config.secret
    ) {
      res.statusCode = 400;
      res.end();
    } else {
      new Post(req.body.payload)
        .setSlugType(config.slugType)
        .save(function(err, data) {
          if (err) {
            res.statusCode = 400;
            res.json(err);
            console.log('Error submitting post: ', err);
          } else {
         //   app.locals({ totalPosts: undefined });
            res.json(data);
          }
      });
    }
}

exports.EditPost = function (req, res) {
	 if (
      process.env.NODE_ENV === 'production' &&
      req.body.secret !== config.secret
    ) {
      res.statusCode = 400;
      res.end();
    } else {
      Post
        .where('slug', req.params.slug)
        .findOne( function(err, post) {
          if (err || !post) { res.statusCode = 404; res.end(); return; }
          post.md = req.body.md;
          post.tags = req.body.tags;
          post.title = req.body.title;

          // SET SLUG IF WASN'T PUBLISHED
          if (!post.published || !req.body.published) {
            post.setSlug();
          }
          post.published = req.body.published;

          post.save( function(err, newPost) {
            if (err) { res.statusCode = 500; res.end(); return console.log(err); }
            res.json(newPost);
          });
        });
    }
}

exports.PreviewPost = function (req, res) {
	 var post = new Post(req.body);
    res.render('preview', { title: post.title, post: post });
}

exports.AddComment = function (req, res) {
	 console.log("slug post");
    if (!(req.body && req.body.payload && req.body.payload.name && req.body.payload.body)) {
      res.statusCode = 500; res.end(); return;
    }
    Post
      .where('slug', req.params.slug)
      .where('published', true)
      .findOne( function(err, post) {
        if (err || !post) { res.statusCode = 404; res.end(); return; }
        var comment = req.body.payload;
        post.comments.push(comment);

       // simpleEvents.emit('comment', comment);

        post.save( function(err, data) {
          if (err) {
            res.statusCode = 500;
            res.end();
            console.log('Error submitting comment: ', err);
          }
          else { res.json(data); }
        });
      });
}