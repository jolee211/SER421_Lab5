The following modules need to be installed from npm in order for the NewsServiceAPI to work properly.

Modules required:
express
bunyan-request-logger
express-error-handler
moment
jwt-simple

There is a package-lock.json file included.


TESTING

For predictable results, make sure that you place a blank persistencestore.json file in the same
directory as the NewsServiceAPI.js program. You can also delete the persistencestore.json file.

The Postman requests have been exported to a file named NewsService_test.json.

These Postman requests can be used to set up stories:
1. testR1 - create one story
2. setUpMultipleStories - write multiple stories in one request
3. setUpMoreStoriesOfSameAuthors - write multiple stories with same authors as ones from the 
   setUpMultipleStories request

Here are the Postman requests for testing:
1. testR1
2. testR2
3. testR3
4. testR4
5. testR2WithNonExistingItem
6. testR5a

The following requests test R5b
7. testDateFromFilter
8. testDateToFilter
9. testDateRangeFilter

10. testR5c
11. testR5ac
12. testR5abc v1
13. testR5abc v2
