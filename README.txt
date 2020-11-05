The following modules need to be installed from npm in order for the NewsServiceAPI to work properly.

Modules required:
express
bunyan-request-logger
express-error-handler


TESTING

For predictable results, make sure that you place a blank persistencestore.json file in the same
directory as the NewsServiceAPI.js program. You can also delete the persistencestore.json file.

Make sure to submit the Postman requests in order:
1. testR1
2. testR2
3. testR3
4. testR4
5. testR2WithNonExistingItem
6. setUpMultipleStories
7. testR5a

The following requests test R5b
8. testDateFromFilter
9. testR5c
10. testR5ac
11. testR5abc
