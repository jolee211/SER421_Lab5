const { NewsStory, NewsService } = require('./NewsService.js');

const newsService = new NewsService();

let express = require('express'),
    http = require('http'),
    logger = require('bunyan-request-logger'),
    errorHandler = require('express-error-handler'),
    app = express(),
    log = logger(),
    server,
    port = 3000;

app.use(express.json());
app.use(express.urlencoded());
app.use(log.requestLogger());

const STORIES_PATH = '/stories';
const STORIES_BY_ID_PATH = STORIES_PATH + '/:id';

// Response to GET requests on /stories
app.get(STORIES_PATH, function (req, res) {
    let index = newsService.getStories().map(function (story, i) {
        return {
            href: '/stories/' + i,
            properties: {
                author: story.author,
                headline: story.headline,
                public: story.public,
                content: story.content,
                date: story.date
            }
        };
    });
    res.send(index);
});

const create = function (req, res) {
    let story = new NewsStory(req.body);
    newsService.writeNewsStory(story);
    
    let id = newsService.findIndex(story.headline);
    res.send(201, {
        href: '/stories/' + id
    });
};

// POST    /stories    -> create, return URI
app.post(STORIES_PATH, create);
app.post('/create', create);

// GET    /stories/:id    -> show
app.get(STORIES_BY_ID_PATH, function (req, res, next) {
    let id = req.params.id,
        body = newsService.getById(id),
        err;
    if (!body) {
        err = new Error('Story not found');
        err.status = 404;
        return next(err);
    }
    res.send(200, body);
});

// PUT    /stories/:id    -> create or update
app.put(STORIES_BY_ID_PATH, function (req, res) {
    let story = new NewsStory(req.body),
        id = req.params.id,
        exists = newsService.getById(id);
    newsService.setStory(id, story);
    if (exists) {
        return res.send(204);
    }
    
    // make sure that id is valid
    id = newsService.findIndex(story.headline);
    res.send(201, {
        href: '/stories/' + id
    });
});

app.put('/editTitle', function (req, res, next) {
    let author = req.body.author,
        oldHeadline = req.body.oldHeadline,
        newHeadline = req.body.newHeadline,
        exists = newsService.findIndexByAuthorAndHeadline(author, oldHeadline) != -1;
    if (exists) {
        newsService.editTitle(author, oldHeadline, newHeadline);
        return res.send(204);
    } else {
        err = new Error('Story not found');
        err.status = 404;
        return next(err);
    }
});

// DELETE    /stories/:id    -> destroy
app.delete(STORIES_BY_ID_PATH, function (req, res, next) {
    let id = req.params.id,
        body = newsService.getById(id),
        err;
    if (!body) {
        err = new Error('Story not found');
        err.status = 404;
        return next(err);
    }
    newsService.delete(body.headline);
    res.send(204);
});

// Send available options on OPTIONS requests
app.options(STORIES_PATH, function (req, res) {
    res.send(['GET', 'PUT', 'DELETE', 'OPTIONS']);
});

// Deliver 405 errors if the request method isn't defined
app.all('/stories', errorHandler.httpError(405));

// Deliver 404 errors for any unhandled routes
// Express has a 404 handler built-in, but it
// won't deliver errors consistent with our API
app.all('*', errorHandler.httpError(404));

// Log errors
app.use(log.errorLogger());

// Create the server
server = http.createServer(app);

// Handle errors. Pass the server
// object into the error handler, so it can be
// shut down gracefully in the event of an 
// unhandled error.
app.use(errorHandler({
    server: server
}));

server.listen(port, function() {
    console.log('Listening on port ' + port);
});
