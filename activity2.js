// Import the NewsService objects
const { NewsStory, NewsService } = require('./NewsService.js');
const http = require('http');
// This is the configured port for our server
const port = 3000;

const LOGIN_URL = "/login";
const LOGOUT_URL = "/logout";
const CREATE_NEW_URL = "/display_create";
const DELETE_URL = "/delete";
const SUBMIT_CREATE_URL = "/submit_create";
const VIEW_STORY_URL = "/view";
const HOME_URL = '/';
const SAVE_ACTION = "save";
const CANCEL_ACTION = "cancel";
const ERROR_MESSAGE_KEY = "errorMessage";

/**
 * The roles in the system.
 * 
 * Users with the Guest role can read any public news story.
 * Users with the Subscriber role can read any news story, public or private.
 * Users with the Author role can read any public news story, and private stories that they have
 *  authored.
 */
const Role = {
  Author: 'Author',
  Guest: 'Guest',
  Subscriber: 'Subscriber',
};

/**
 * Parse an HTTP cookie header string and retun an object of all cookie name-value pairs
 */
const parseCookie = str =>
  str
    .split(';') // split the string by semicolon and stuff each token into an array
                // this should result in an array like ['name1=value1', 'name2=value2', ...]
    .map(v => v.split('=')) // further split each element by '=' and stuff each token into another array
                            // this should result in an array of arrays like [ ['name1', 'value1'], ['name2', 'value2'], ... ]
    .reduce((acc, v) => {
      // finally, accumulate each element in the array of arrays from above into one array
      // the acc value is the accumulated array so far, starting with an empty object
      // the v value is the current element from the array above being processed
      // set element 0 to name, set element 1 to value
      // this should result in an object like { name1: 'value1', name2: 'value2', ... }
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {}); // start with an empty object

/**
 * Parse a URL query string into a collection of key and value pairs.
 * For example, the query string 'foo=bar&abc=xyz&abc=123' is parsed into:
 * {
 *    foo: 'bar',
 *    abc: ['xyz', '123']
 * }
 * @param {string} queryString a string representing an HTTP query to parse
 */
function parse(queryString) {
  let queries = queryString.split("&"); // Split into key/value pairs
  let params = {};  // this will hold the parsed key/value pairs
  for (let i = 0, l = queries.length; i < l; i++) { // Convert the array of strings into an object
    let temp = queries[i].split('='); // split into key and value
    // replace the '+' signs in the string with spaces
    if (temp[1]) {
      temp[1] = replaceAll(temp[1], '+', ' ');
      // decode the string as it is encoded by default
      temp[1] = decodeURIComponent(temp[1]);
    }
    params[temp[0]] = temp[1];  // use the first value as the key name and second value as the value
  }
  return params;
}

/**
 * Return all the URL parameters as an object
 */
function getAllUrlParams(url) {
  if (url) {
    // split the url by ?, then take the rest of the string to the right of it
    let queryString = url.split('?')[1];
    if (queryString) {
      return parse(queryString);
    }
  }
}

/**
 * Return all the URL parameters as an object
 */
function getUrlOnly(url) {
  if (url) {
    // split the url by ?, then take everything to the left of it
    return url.split('?')[0];
  }
}

/**
 * Return an object containing the username and role if they are present in the incoming message
 */
function getUserContextFromRequest(request) {
  let cookies = request.headers['cookie'];
  if (cookies) {
    cookies = parseCookie(cookies);
    let u = cookies.username;
    let r = cookies.role;
    if (u && r) {
      return {
        username: u,
        role: r
      };
    }
  }
}

/**
 * Return the HTML for rendering the Username input textbox.
 */
function getUsernameHtml(userContext) {
  let html = '      <input type="text" name="username" placeholder="Enter Username"';
  if (userContext && userContext.username) {
    html += ` value="${userContext.username}"`;
  }
  return html + '>';
}

/**
 * Check if the role selected is equal to the passed-in role. If it is, return the string "checked".
 * Otherwise, return "".
 */
function roleChecked(userContext, roleToCheck) {
  if (userContext && userContext.role && userContext.role === roleToCheck) {
    return "checked";
  } else if (roleToCheck == Role.Guest) {
    return "checked"; // there's no logged-in user, so return the Guest as default
  }
  return "";
}

/**
 * Return the HTML to render the role radio buttons.
 */
function getRoleHtml(userContext) {
  if (userContext) {
    return `      <p><input type="radio" name="role" value="${Role.Author}" ${roleChecked(userContext, Role.Author)}/> ${Role.Author}</p>`
        + `      <p><input type="radio" name="role" value="${Role.Guest}" ${roleChecked(userContext, Role.Guest)}/> ${Role.Guest}</p>`
        + `      <p><input type="radio" name="role" value="${Role.Subscriber}" ${roleChecked(userContext, Role.Subscriber)}/> ${Role.Subscriber}</p>`;
  } else {
    return `      <p><input type="radio" name="role" value="${Role.Author}"/> ${Role.Author}</p>`
        + `      <p><input type="radio" name="role" value="${Role.Guest}" checked/> ${Role.Guest}</p>`
        + `      <p><input type="radio" name="role" value="${Role.Subscriber}"/> ${Role.Subscriber}</p>`;
  }
}

/**
 * Return HTML for starting a document. If a title is specified, it will be set.
 * @param {string} title the title to set in the HTML head
 */
function getOpeningHtml(title) {
  let data = "<html>";
  data += "<head>";
  data += `  <title>${title}</title>`;
  data += "</head>";
  data += "<body>";
  return data;
}

/**
 * Return HTML for closing a document. 
 */
function getClosingHtml() {
  let  data = '</body>';
  data += '</html>';
  return data;
}

/**
 * Return HTML for welcoming back a user. 
 */
function getWelcomeHtml(userContext) {
  return userContext.username != '' ? `<h2>Welcome ${userContext.role} ${userContext.username}, please enter your password</h2>` : '';
}

/**
 * Return the HTML to render the login page.
 */
function getLoginHtml(request) {
  let userContext = getUserContextFromRequest(request);
  let data = getOpeningHtml("Login Form");
  data += "  <div>";
  if (userContext) {
    data += getWelcomeHtml(userContext);
  }
  data += "    <h1>Login Here</h1>";
  data += `    <form id="login-form" method="POST" action="${LOGIN_URL}">`;
  data += '      <p>Username</p>';
  data += getUsernameHtml(userContext);
  data += '      <p>Password</p>';
  data += '      <input type="password" name="password" placeholder="Enter Password">';
  data += '      <p>Role</p>';
  data += getRoleHtml(userContext);
  data += '      <br/>';
  data += '      <input type="submit" value="Login">';
  data += '    </form>';
  data += '  </div>';
  data += getClosingHtml();
  return data;
}

/**
 * Return true if there is a user logged in
 */
function isLoggedIn(request) {
  return getUserContextFromRequest(request) != null && getUserContextFromRequest(request) != undefined;
}

/**
 * Return the HTML to render a logged-in user's username and role
 */
function getLoggedInUserHtml(username, role) {
  return `<div>Username: ${username}, Role: ${role}</div>`;
}

/**
 * Return the HTML to render a logout link
 */
function getLogoutHtml() {
  return `<div><a href="${LOGOUT_URL}">Logout</a></div>`;
}

/**
 * Return the HTML to render a logout link
 */
function getBackToHomeHtml() {
  return `<div><a href="${HOME_URL}">Back to Home</a></div>`;
}

/**
 * Return the HTML to render a link to delete a story
 */
function getDeleteLinkHtml(i) {
  return `<div><a href="${DELETE_URL}?headline=${i}">Delete Story</a></div>`;
}

/**
 * Return the HTML to render a link to create a story
 */
function getCreateLinkHtml() {
  return `<div><a href="${CREATE_NEW_URL}">Create Story</a></div>`;
}

/**
 * Write the HTTP 200 response
 * @param {Object} response the HTTP response to write to
 */
function writeOKResponse(response) {
  response.writeHead(200, { 'Content-Type': 'text/html' });
}

/**
 * Write the data to the response and close it
 * @param {Object} response the HTTP response to write to
 * @param {string} data the data to write to the HTTP response
 */
function writeAndEndResponse(response, data) {
  response.write(data);
  response.end();
}

/**
 * Render the login form to the response
 * @param {Object} request the HTTP request
 * @param {Object} response the HTTP response
 */
function getLoginForm(request, response) {
  writeOKResponse(response);
  
  let data = getLoginHtml(request);
  writeAndEndResponse(response, data);
}

/**
 * Return true if the specified role can view the given story
 * @param {Role} role the role of the user
 * @param {NewsStory} story the news story
 */
function canRoleView(username, role, story) {
  if (story.public == true) {
    return true;
  }
  // if the story is not public:
  switch (role) {
    case Role.Guest:
      return false;
    case Role.Author:
      return story.author == username;
    case Role.Subscriber:
      return true;
    default:
      return false;
  }
}

/**
 * Return true if the specified role can create a story
 */
function canRoleCreate(role) {
  return role == Role.Author;
}

/**
 * Return true if the specified user can delete a story
 */
function canUserDeleteStory(username, ns) {
  return ns && username === ns.author;
}

/**
 * Return HTML to render a NewsStory object as an HTML list item
 */
function getNewsStoryItemHtml(user, role, story, i) {
  let data = "<li>";
  let hyperlinked = false;
  if (canRoleView(user, role, story)) {
    data += `<a href='/view?headline=${i}'>`
    hyperlinked = true;
  }
  data += story.headline;
  if (hyperlinked) {
    data += '</a>';
  }
  data += '</li>';
  return data;
}

/**
 * Render the HTML for the list of news stories
 */
function getNewsStoriesListHtml(newsService, user, role) {
  let data = '';
  if (newsService && newsService.size() > 0) {
    let stories = newsService.getStories();
    data += "<ul>";
    for (let i = 0; i < stories.length; i++) {
      data += getNewsStoryItemHtml(user, role, stories[i], i);
    }
    data += "</ul>";
  } else {
    data += '<div>No news stories</div>';
  }
  return data;
}

/**
 * Render the View News page to the response
 */
function getViewNewsPage(response, username, role, newsService) {
  writeOKResponse(response);
  
  let data = getOpeningHtml("View News");
  data += `<h2>View News</h2>`;
  data += getLoggedInUserHtml(username, role);
  if (canRoleCreate(role)) {
    data += getCreateLinkHtml();
  }
  data += getLogoutHtml();
  data += getNewsStoriesListHtml(newsService, username, role);
  data += getClosingHtml();
  writeAndEndResponse(response, data);
}

/**
 * Return the HTML for displaying a news story
 */
function getNewsStoryHtml(ns) {
  let data = '';
  if (ns) {
    data += `<h1>${ns.headline}</h1>`;
    data += `<div>${ns.author}<div>${ns.public ? 'PUBLIC' : ''}</div>`;
    data += `<div>${ns.date}</div>`;
    data += `<p>${ns.content}</p>`;
  }
  return data;
}

/**
 * Return the HTML for displaying an error message
 */
function getErrorMessageHtml(request) {
  if (request.headers[ERROR_MESSAGE_KEY]) {
    return `<div>ERROR: ${request.headers[ERROR_MESSAGE_KEY]}</div>`;
  }
  return '';
}

/**
 * Render the View News page to the response
 */
function getViewNewsStoryPage(request, response, username, role, i) {
  writeOKResponse(response);
  
  let ns = newsService.getStories()[i];
  let data = getOpeningHtml(ns.headline);
  data += getLoggedInUserHtml(username, role);
  data += getLogoutHtml();
  data += getErrorMessageHtml(request);
  data += getNewsStoryHtml(ns);
  if (canUserDeleteStory(username, ns)) {
    data += getDeleteLinkHtml(i);
  }
  data += getBackToHomeHtml();
  data += getClosingHtml();
  writeAndEndResponse(response, data);
}

/**
 * Return the HTML for rendering the headline text field. If there was previously submitted data,
 * show that as the default value.
 * @param {object} formData previously submitted form data
 */
function getCreateStoryHeadlineHtml(formData) {
  let html = '      <input type="text" name="headline" placeholder="Enter headline" ';
  if (formData && formData.headline) {
    html += `value="${formData.headline}"`;
  }
  html += '>';
  return html;
}

/**
 * Return the HTML for rendering the public checkbox. If there was previously submitted data,
 * show that as the default value.
 * @param {object} formData previously submitted form data
 */
function getCreateStoryPublicHtml(formData) {
  let html = '      <input type="checkbox" name="public" ';
  if (formData && formData.public) {
    html += 'checked';
  }
  html += '>';
  return html;
}

/**
 * Return the HTML for rendering the content text area. If there was previously submitted data,
 * show that as the default value.
 * @param {object} formData previously submitted form data
 */
function getCreateStoryContentHtml(formData) {
  let html = '      <textarea name="content" rows="5" cols="33">';
  if (formData && formData.content) {
    html += formData.content;
  }
  html += '</textarea>';
  return html;
}

/**
 * Return the HTML for rendering the date text field. If there was previously submitted data,
 * show that as the default value.
 * @param {object} formData previously submitted form data
 */
function getCreateStoryDateHtml(formData) {
  html = '      <input type="date" name="date"';
  if (formData && formData.date) {
    html += `value="${formData.date}"`;
  }
  html += '>';
  return html;
}

/**
 * Render the Create Story page to the response.
 * If there was existing form data from (i.e., if an error occurs from submission), then populate
 * the form fields with the previously submitted data.
 */
function getCreateStoryForm(request, response, formData) {
  writeOKResponse(response);
  
  let data = getOpeningHtml("Create Story");
  data += `<h2>Create Story</h2>`;
  let userContext = getUserContextFromRequest(request);
  data += getLoggedInUserHtml(userContext.username, userContext.role);
  data += getLogoutHtml();
  
  data += `    <form id="create-story-form" method="POST" action="${SUBMIT_CREATE_URL}">`;
  getErrorMessageHtml(request);
  data += `      <p>Author ${userContext.username}</p>`;
  data += `      <input type="hidden" name="author" value="${userContext.username}">`;
  data += '      <p>Headline</p>';
  data += getCreateStoryHeadlineHtml(formData);
  data += '      <p>Public?</p>';
  data += getCreateStoryPublicHtml(formData);
  data += '      <p>Content</p>';
  data += getCreateStoryContentHtml(formData);
  data += '      <p>Date</p>';
  data += getCreateStoryDateHtml(formData);
  data += '      <br/>';
  data += `      <button name="action" type="submit" value="${SAVE_ACTION}">Save</button>`;
  data += `      <button name="action" type="submit" value="${CANCEL_ACTION}">Cancel</button>`;
  data += '    </form>'
  
  data += getClosingHtml();
  writeAndEndResponse(response, data);
}

/**
 * Render the Failed Login page to the response
 * @param {Object} request the HTTP request
 * @param {Object} response the HTTP response
 */
function getLoginErrorPage(request, response) {
  writeOKResponse(response);
  
  let data = getOpeningHtml("Login Error");
  data += `<div><h2>Login error:</h2>Incorrect password entered. Please try again. <a href='/'>Back to Login</a></div>`;
  data += getClosingHtml();
  writeAndEndResponse(response, data);
}

/**
 * Render a response to a request for a URL that we don't recognize
 * @param {Object} request the HTTP request
 * @param {Object} response the HTTP response
 */
function get404(request, response) {
  response.writeHead(404, "Resource not found", { 'Content-Type': 'text/html' });
  response.write("<html><head><title>404</title></head><body>404: Resource not found. Go to <a href='/'>Home</a></body></html>");
  response.end();
}

/**
 * Render a response to a request to view a story with insufficient permissions
 */
function getCantViewStory(request, response) {
  response.writeHead(401, "Unauthorized", { 'Content-Type': 'text/html' });
  response.write("<html><head><title>401</title></head><body>401: The story couldn't be shown because you don't have permission to view it. Go to <a href='/'>Home</a></body></html>");
  response.end();
}

/**
 * Render a response to a request to delete a story with insufficient permissions
 */
function getCantDeleteStory(request, response) {
  response.writeHead(401, "Unauthorized", { 'Content-Type': 'text/html' });
  response.write("<html><head><title>401</title></head><body>401: The story couldn't be deleted because you don't have permission to view it. Go to <a href='/'>Home</a></body></html>");
  response.end();
}

/**
 * Render a response to a request using a method that we don't recognize
 * @param {Object} request the HTTP request
 * @param {Object} response the HTTP response
 */
function get405(request, response) {
  response.writeHead(405, "Method not supported", { 'Content-Type': 'text/html' });
  response.write("<html><head><title>405</title></head><body>405: Method not supported. Go to <a href='/'>Home</a></body></html>");
  response.end();
}

/**
 * Render a response for when there's too much data in the request
 * @param {Object} request the HTTP request
 * @param {Object} response the HTTP response
 */
function get413(request, response) {
  response.writeHead(405, "Request entity too large", { 'Content-Type': 'text/html' });
  response.write("<html><head><title>413</title></head><body>413: Too much information. Server cannot handle this. Go to <a href='/'>Home</a></body></html>");
  response.end();
}

/**
 * Return true if the request is for the home page (/)
 * @param {Object} request the HTTP request
 */
function isRequestToHome(request) {
  return request.url === "/";
}

/**
 * Return true if the request is for LOGOUT_URL
 * @param {Object} request the HTTP request
 */
function isRequestToLogout(request) {
  return request.url === LOGOUT_URL;
}

/**
 * Return true if the request is for the login page (LOGIN_URL)
 * @param {Object} request the HTTP request
 */
function isRequestToLogin(request) {
  return request.url === LOGIN_URL;
}

/**
 * Return true if the request is for the Create Story page
 * @param {Object} request the HTTP request
 */
function isRequestToCreate(request) {
  return request.url === CREATE_NEW_URL;
}

/**
 * Return true if the request is for submitting the Create Story form
 * @param {Object} request the HTTP request
 */
function isRequestToSubmitCreate(request) {
  return request.url === SUBMIT_CREATE_URL;
}

/**
 * Return true if the request is for viewing a news story
 * @param {Object} request the HTTP request
 */
function isRequestToViewStory(request) {
  return getUrlOnly(request.url) === VIEW_STORY_URL;
}

/**
 * Return true if the request is for deleting a news story
 * @param {Object} request the HTTP request
 */
function isRequestToDeleteStory(request) {
  return getUrlOnly(request.url) === DELETE_URL;
}

/**
 * Return true if the request size is greater than 10MB
 * @param {Object} request the HTTP request
 */
function isRequestTooLarge(reqBody) {
  return reqBody.length > 1e7;  // 10MB
}

/**
 * Replace all occurrences of a search string
 * @param {string} string the string to modify
 * @param {string} search the string to replace
 * @param {string} replace the string to replace with
 */
function replaceAll(string, search, replace) {
  return string.split(search).join(replace);
}

/**
 * Check that the submitted password is valid for the username. Return true if the password is
 * valid.
 * @param {Object} formData the submitted form data
 */
function checkPassword(formData) {
  return formData && formData.username != '' && formData.username == formData.password;
}

/**
 * Save the username and role so that they can be displayed in other pages
 */
function saveUsernameAndRole(response, username, role) {
  response.setHeader('Set-Cookie', [`username=${username}`, `role=${role}`]);
}

/**
 * Blank out the username and role
 */
function resetUsernameAndRole(request, response) {
  let userContext = getUserContextFromRequest(request);
  if (userContext) {
    let reallyOldDate = new Date(0);
    response.setHeader('Set-Cookie', [`username=${userContext.username};Expires=${reallyOldDate}`, `role=${userContext.role};Expires=${reallyOldDate}`]);
  }
}

/**
 * Render the View News page
 */
function renderViewNewsPage(request, response) {
  let userContext = getUserContextFromRequest(request);
  getViewNewsPage(response, userContext.username, userContext.role, newsService);
}

/**
 * Handle the submission of the login form
 * @param {Object} request the HTTP request
 * @param {Object} response the HTTP response
 * @param {string} body the body of the request
 */
function handleLoginRequest(request, response, body) {
  let formData = parse(body);
  if (checkPassword(formData)) {
    saveUsernameAndRole(response, formData.username, formData.role);
    getViewNewsPage(response, formData.username, formData.role, newsService);
  } else {
    getLoginErrorPage(request, response);
  }
}

/**
 * Save the news story according to the submitted form data
 * @param {object} formData the object containing the details for the news story
 */
function saveNewsStory(formData) {
  let ns = new NewsStory();
  ns.author = formData.author;
  ns.headline = formData.headline;
  if (formData.public) {
    ns.public = true;
  }
  ns.content = formData.content;
  ns.date = new Date(formData.date);
  newsService.writeNewsStory(ns);
}

/**
 * Save the news story to NewsService
 */
function handleSaveStory(formData, request, response) {
  try {
    saveNewsStory(formData);
    renderViewNewsPage(request, response);
  } catch (e) {
    request.headers[ERROR_MESSAGE_KEY] = 'An error occurred. Please try again.';
    getCreateStoryForm(request, response, formData);
  }
}

/**
 * Handle the submission of the Create Story form
 * @param {Object} request the HTTP request
 * @param {Object} response the HTTP response
 */
function handleSubmitCreateRequest(request, response, body) {
  let formData = parse(body);
  if (formData.action === SAVE_ACTION) {
    handleSaveStory(formData, request, response);
  } else if (formData.action === CANCEL_ACTION) {
    renderViewNewsPage(request, response);
  }
}

/**
 * Handle the submission of the login form
 * @param {Object} request the HTTP request
 * @param {Object} response the HTTP response
 */
function handleLogoutRequest(request, response) {
  resetUsernameAndRole(request, response);
  getLoginForm(request, response);
}

/**
 * Handle a request to home page
 */
function handleHomeRequest(request, response) {
  if (!isLoggedIn(request)) {
    getLoginForm(request, response);
  } else {
    renderViewNewsPage(request, response);
  }
}

/**
 * Handle a request to create story
 */
function handleCreateStoryRequest(request, response) {
  if (!isLoggedIn(request)) {
    getLoginForm(request, response);
  } else {
    getCreateStoryForm(request, response);
  }
}

/**
 * Handle a request to view story
 */
function handleViewStoryRequest(request, response) {
  if (!isLoggedIn(request)) {
    getLoginForm(request, response);
  } else {
    let userContext = getUserContextFromRequest(request);
    let params = getAllUrlParams(request.url);
    let i = parseInt(params.headline);
    let ns = newsService.getStories()[i];
    if (canRoleView(userContext.username, userContext.role, ns)) {
      getViewNewsStoryPage(request, response, userContext.username, userContext.role, i);
    } else {
      getCantViewStory(request, response);
    }
  }
}

/**
 * Handle a request to view story
 */
function handleDeleteStoryRequest(request, response) {
  if (!isLoggedIn(request)) {
    getLoginForm(request, response);
  } else {
    let userContext = getUserContextFromRequest(request);
    let params = getAllUrlParams(request.url);
    let i = parseInt(params.headline);
    let ns = newsService.getStories()[i];
    if (canUserDeleteStory(userContext.username, ns)) {
      try {
        newsService.delete(ns.headline);
        renderViewNewsPage(request, response);
      } catch (e) {
        request.headers[ERROR_MESSAGE_KEY] = 'An error occurred. Please try again.';
        getViewNewsStoryPage(request, response, userContext.username, userContext.role, i);
      }
    } else {
      getCantDeleteStory(request, response);
    }
  }
}

/**
 * Handle all incoming GET requests
 * @param {Object} request the HTTP request
 * @param {Object} response the HTTP response
 */
function doGet(request, response) {
  if (isRequestToHome(request)) {
    handleHomeRequest(request, response)
  } else if (isRequestToLogout(request)) {
    handleLogoutRequest(request, response);
  } else if (isRequestToCreate(request)) {
    handleCreateStoryRequest(request, response);
  } else if (isRequestToViewStory(request)) {
    handleViewStoryRequest(request, response);
  } else if (isRequestToDeleteStory(request)) {
    handleDeleteStoryRequest(request, response);
  } else {
    get404(request, response);
  }
}

/**
 * Handle all incoming POST requests
 * @param {Object} request the HTTP request
 * @param {Object} response the HTTP response
 */
function doPost(request, response, body) {
  if (isRequestToLogin(request)) {
    handleLoginRequest(request, response, body);
  } else if (isRequestToSubmitCreate(request)) {
    handleSubmitCreateRequest(request, response, body);
  } else {
    get404(request, response);
  }
}

// we start off with a blank NewsService
const newsService = new NewsService();

// optional - seed the newsService with stories
const story1Headline = "A group of centrist lawmakers has a new compromise proposal for more stimulus";
const story2Headline = "Ukraine backs opposition forces against Belarusian president";
const story3Headline = "Nicaragua, Venezuela offer asylum to Snowden";
const story4Headline = "Magic's not back yet at Disney: Analysts";
const story5Headline = "Six Kids Die in Detroit House Fire";
const story6Headline = "McEnroe routs Lendl";
const story7Headline = "Bush Decries Exxon Valdez Spillage of 'Precious, Precious' Oil";
const story8Headline = "Ouija riot baffles police";
const story9Headline = "Remember Those Few Glorious Minutes When the World Was Free of Trump's Twitter Account?";
const story10Headline = "'I turned away Beatles for just 25 pounds'";

function setUpMultipleStories(newsService) {
	// Story 1
	let ns = new NewsStory();
	ns.headline = story1Headline;
	ns.content = "A centrist bipartisan group is trying to break through the stimulus stalemate - and put pressure on Congress to get something done."
		+ " Members of the House Problem Solvers Caucus on Tuesday released what they viewed as an effective compromise offer amid the ongoing impasse between Democratic and Republican negotiators over the next phase of Covid-19 aid.";
	ns.date = new Date(2020, 8, 16);	// Sep 16, 2020
  ns.author = "Li";
  ns.public = true;
	newsService.writeNewsStory(ns);

	// Story 2
	ns = new NewsStory();
	ns.headline = story2Headline;
	ns.content = "Ukrainian lawmakers joined Western countries in condemning the recent presidential election in Belarus by passing a motion that would enforce future sanctions against individuals involved in fixing elections and using violence against demonstrators.";
	ns.date = new Date(2020, 8, 15);	// Sep 15, 2020
  ns.author = "Caitlin";
  ns.public = true;
	newsService.writeNewsStory(ns);

	// Story 3
	ns = new NewsStory();
	ns.headline = story3Headline;
	ns.content = "Presidents Daniel Ortega of Nicaragua and Nicolas Maduro of Venezuela said Friday they were willing to grant asylum to NSA leaker Edward Snowden.";
	ns.date = new Date(2013, 6, 5);	// Jul 5, 2013
  ns.author = "AP";
  ns.public = false;
	newsService.writeNewsStory(ns);

	// Story 4
	ns = new NewsStory();
	ns.headline = story4Headline;
	ns.content = "Michael Eisner's efforts to slash costs and pump up revenue at Disney may have stabilized earnings, but some analysts insist that the road ahead is still bumpy."
		+ " Morgan Stanley Dean Witter's Richard Bilotti warned in a report yesterday that he 'continues to be cautious about the stock,' which he 'anticipates could tread water for about six months.'"
		+ " Bilotti remains pessimistic about the future of the media empire, which he says is susceptible to the economy and would likely be affected by any economic slowdown."
		+ " Meanwhile, Prudential Securities' media analyst Katherine Styponais says the Magic Kingdom 'still [has] a ways to go until we see a turnaround.'"
		+ ' "There are a couple of businesses that we will continue to keep an eye on - particularly their consumer products division."'
		+ ' "We continue to put a \'hold\' on Disney until we see stronger results," Styponais said.';
	ns.date = new Date(1999, 8, 28);	// Sep 28, 1999
  ns.author = "Allyson";
  ns.public = true;
	newsService.writeNewsStory(ns);

	// Story 5
	ns = new NewsStory();
	ns.headline = story5Headline;
	ns.content = "Six children died in a fire at their grandmother's home Sunday while their mother was at a hospital after having a baby."
		+ " The fire rushed up a stairway and trapped the children in two upstairs bedrooms."
		+ ' Their grandmother and three others escaped.'
		+ ' The fire started in a living room closet and appeared accidental, but its cause was not yet known, fire Lt. Katrina Butler said.'
		+ ' "Oh God, no! No! No!," neighbor Carolyn King screamed, falling to her knees as coroners\' workers carried the first of six body bags from the home.';
	ns.date = new Date(1998, 11, 27);	// Dec 27, 1998
  ns.author = "David";
  ns.public = false;
	newsService.writeNewsStory(ns);

	// Story 6
	ns = new NewsStory();
	ns.headline = story6Headline;
	ns.content = "John McEnroe settled his grudge duel with Ivan Lendl in straight sets and Chris Lewis survived a 3-hour, 45-minute marathon against Kevin Curren yesterday to advance to tomorrow's final in the $1.4 million Wimbledon chamnpionships."
		+ " McEnroe, pushed to a tiebreaker in the first set, won it and went to a 7-6, 6-4, 6-4 victory over Lendl.";
	ns.date = new Date(1983, 6, 2);	// Jul 2, 1983
  ns.author = "UPI";
  ns.public = false;
	newsService.writeNewsStory(ns);
}

function setUpMoreStoriesOfSameAuthors(newsService) {
	// Story 7
	let ns = new NewsStory();
	ns.headline = story7Headline;
	ns.content = "In a highly charged White House press conference Friday, President Bush lashed out against Exxon's supertanker spill off the Alaska coast, decrying the company's \"shocking lack of respect for our planet's greatest natural resource: precious, precious oil.\""
		+ ' "What has happened there in Alaska is a tragic, tragic waste of the fossil fuel most dear to my heart," the visibly grieving president said.';
	ns.date = new Date(1989, 2, 25);	// Mar 25, 1989
  ns.author = "Allyson";
  ns.public = false;
	newsService.writeNewsStory(ns);

	// Story 8
	ns = new NewsStory();
	ns.headline = story8Headline;
	ns.content = 'The mass hysteria that drove students temporarily berserk at a military-styled private school here yesterday began when several students were playing with a ouija board and suddenly felt that "a spirit took over it," a teacher told the Miami News today.'
		+ ' "Everybody just got carried away and it was a riot," the teacher, Iliana Vicledo, said.'
		+ ' "There were girls crying and screaming that there was a spirit inside (the ouija board)."'
		+ ' Police said they were baffled by the outbreak at the Miami Aerospace Academy, which they said led to "mass hysteria" that had students kicking walls, tearing at doors, talking of witches and screaming about demons.'
		+ ' "The whole school went berserk," said Miami policeman Harry Cunelli.';
	ns.date = new Date(1979, 9, 26);	// Oct 26, 1979
  ns.author = "David";
  ns.public = true;
	newsService.writeNewsStory(ns);

	// Story 9
	ns = new NewsStory();
	ns.headline = story9Headline;
	ns.content = 'Nov. 2, 2017, is a day that will go down in history.';
	ns.date = new Date(2017, 11, 27);	// Dec 27, 2017
  ns.author = "David";
  ns.public = false;
	newsService.writeNewsStory(ns);

	// Story 10
	ns = new NewsStory();
	ns.headline = story10Headline;
	ns.content = 'City landlord George, 72, has no regrets.'
		+ ' The man who once turned down the Beatles because they were "too pricey" is still going strong at his pub in Sneinton.'
		+ ' George Dove, 72, landlord of The March Hare on Carlton Road, has never regretted his decision to give the Fab Four the heave-ho.'
		+ " That's because in his 36 years as landlord he's never had trouble drawing the customers.";
	ns.date = new Date(1994, 11, 12);	// Dec 12, 1994
  ns.author = "Caitlin";
  ns.public = true;
	newsService.writeNewsStory(ns);
}

setUpMultipleStories(newsService);
setUpMoreStoriesOfSameAuthors(newsService);

/**
 * Create a HTTP server for our NewsService web application
 */
const server = http.createServer(function (request, response) {
  const { method } = request;
  let body = '';
  request.on('error', (err) => {
    console.error(err);
  }).on('data', (chunk) => {
    body += chunk;
    if (isRequestTooLarge(body)) { 
      get413(request, response);
    }
  }).on('end', () => {
    switch(method) {
      case "GET":
        doGet(request, response);
        break;
      case "POST":
        doPost(request, response, body);
        break;
      default:
        get405(request, response);
        break;
    }
  });
}).listen(port);
