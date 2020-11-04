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

// Response to GET requests on /stories
app.get('/stories', function (req, res) {
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
