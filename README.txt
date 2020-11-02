In order to instantiate NewsService:
  let newsService = new NewsService();

In order to instantiate a NewsStory:
  let newsStory = new NewsStory();
	newsStory.headline = "Wildfires kill eight";
	newsStory.content = "Oregon faces fire conditions unseen in decades";
	newsStory.date = new Date(2020, 8, 10);	// Sep 10, 2020
	newsStory.author = "Li Zhou";

To save your NewsStory in the NewsService:
  let newsService = new NewsService();
  let newsStory = new NewsStory();
  ... // set the NewsStory properties
  newsService.writeNewsStory(newsStory);

To find out how many stories are in NewsService:
  newsService.size()

To update the headline of a news story, call the NewsService updateHeadline() method, passing in
the old and new headlines:
  newsService.updateHeadline(oldHeadline, newHeadline);

To determine if a particular headline exists in NewsService:
  newsService.has(headline);

To update the content of a news story in NewsService, pass a NewsStory object to the NewsService 
updateContent() method. The headline property of the NewsStory object will be used to search for
the story to update. The content property will be used as the new content:
  let newsStory = new NewsStory();
	newsStory.headline = "Wildfires kill eight";
	newsStory.content = "Oregon faces fire conditions unseen in decades";
	newsStory.date = new Date(2020, 8, 10);	// Sep 10, 2020
	newsStory.author = "Li Zhou";
  newsService.writeNewsStory(newsStory);

  let newContent = "Unprecedented fire conditions burn more than 900,000 acres";
	newsStory.content = newContent;
	newsService.updateContent(newsStory);

To get a NewsStory object from the NewsService, pass a headline to the NewsService get() method:
  newsStory = newsService.get(newsStory.headline);

To delete a NewsStory object from the NewsService, pass a headline to the NewsService delete()
method:
  newsService.delete(headline);

To return a collection of NewsStory objects from the NewsService that satisfy a specified
criteria, pass a criteria object to the NewsService filter() method. The criteria object should
look like this:
 { 
   headline: "headline", 
   dateFrom: "2020-09-10",
   dateTo: "2020-09-14",
   author: "author"
 }
 
The headline will be searched for as a substring of any headline in the NewsService.
The author will be searched for as an exact match to authors in the NewsService.
Specifying multiple criteria values will constitute an AND search.
  let criteria = { headline: 'A' };
	let filteredStories = newsService.filter(criteria);

  criteria = {
		headline: "g",
		dateFrom: new Date(2017, 8, 29),	// Sep 29, 2017
		dateTo: new Date(2020, 11, 9),	// Dec 9, 2020
		author: "Caitlin McFall"
	};
	filteredStories = newsService.filter(criteria);

For further information, please read the comments in the NewsService.js module.
