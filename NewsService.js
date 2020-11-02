exports.NewsStory = class {
	constructor() {
		this.author = "";
		this.headline = "";
		this.public = false;
		this.content = "";
		this.date = null;
	}
}

/**
 * Represents the news service
 */
exports.NewsService = class {
	constructor() {
		this.stories = [];
	}

	/**
	 * Write a new news story from a NewsStory struct to the persistent store.
	 * The passed-in object must conform to the output of the makeStruct() function.
	 *
	 * Params:
	 *   obj - the NewsStory object representing the news story to create
	 */
	writeNewsStory (newsStory) {
		if (!newsStory.headline) {
			throw new Error("Headline is not specified")
		}
		// add news story to persistent store
		this.stories.push(newsStory);
	}

	/**
	 * Returns the index of the first news story in the NewsService that matches the provided
	 * headline. Otherwise, it returns -1, indicating that no news story matched.
	 *
	 * Params:
	 *   headline - the headline to search for
	 *
	 * Returns: The index of the first news story in the NewsService that matches the provided
	 * headline. Otherwise, -1.
	 */
	findIndex (headline) {
		return this.stories.findIndex(story => story.headline == headline);
	}


	/**
	 * Update the headline of an existing story.
	 * If the passed-in oldHeadline doesn't exist, nothing happens.
	 * 
	 * Params:
	 *   oldHeadline - the headline to change
	 *   newHeadline - the updated headline
	 */
	updateHeadline (oldHeadline, newHeadline) {
		let found = this.findIndex(oldHeadline);
		if (found != -1) {
			this.stories[found].headline = newHeadline;
		}
	}

	/**
	 * Change the content of an existing news story.
	 * The content is passed in as a property in a NewsStory object.
	 * We perform a lookup of the headline of the NewsStory.
	 * If the headline can't be found, then nothing happens.
	 * NOTE: Even if there are other properties present in the passed-in NewsStory, only the
	 * content property will be used to update the persistent store.
	 *
	 * Params:
	 *   updatedObj - the NewsStory object with the updated content
	 */
	updateContent (newsStory) {
		let found = this.findIndex(newsStory.headline);
		if (found != -1) {
			this.stories[found].content = newsStory.content;
		}
	}

	/**
	 * Retrieve a news story using its headline.
	 *
	 * Params:
	 *   headline - the headline of the news story to retrieve
	 *
	 * Returns: the NewsStory corresponding to the headline, or undefined if the headline can't
	 *   be found
	 */
	get (headline) {
		return this.stories.find(story => story.headline == headline);
	}

	/**
	 * Remove the story associated with the specified headline from the NewsService
	 *
	 * Params:
	 *   headline - the headline of the news story to remove
	 *
	 * Returns: true if the news story existed and has been removed, or false if the news story
	 *   does not exist
	 */
	delete (headline) {
		let found = this.findIndex(headline);
		if (found != -1) {
			this.stories.splice(found, 1);
			return true;
		}
		return false;
	}

	/**
	 * Return an array of news stories that are in the persistent store.
	 */
	getStories () {
		return this.stories;
	}

	/**
	 * Return a boolean indicating whether a news story with the specified headline exists or not
	 *
	 * Params:
	 *   headline - the headline of the news story to test for presence in the NewsService
	 *
	 * Returns: true if a news story with the specified headline exists in the NewsService;
	 *   otherwise false
	 */
	has (headline) {
	 	return this.findIndex(headline) != -1;
	 }

	 /**
	  * Returns the number of news stories in the NewsService
	  */
	size() {
		return this.stories.length;
	}

	/**
	 * Return a collection of NewsStory objects from the NewsService that satisfy the specified
	 * criteria. The criteria that can be specified are:
	 *
	 * { 
	 *   headline: "headline", 
	 *   dateFrom: "2020-09-10",
	 *   dateTo: "2020-09-14",
	 *   author: "author"
	 * }
	 * 
	 * The headline will be searched for as a substring of any headline in the NewsService.
	 * The author will be searched for as an exact match to authors in the NewsService.
	 * Specifying multiple criteria values will constitute an AND search.
	 */
	filter (criteria) {
		if (!criteria.headline && !criteria.dateFrom && !criteria.dateTo && !criteria.author) {
			throw new Error("At least one of headline, dateFrom, dateTo, author must be specified");
		}

		let filteredStories = this.stories;
		if (criteria.headline) {
			filteredStories = filteredStories.filter(story => story.headline.includes(criteria.headline));
		}
		if (criteria.dateFrom) {
			filteredStories = filteredStories.filter(story => story.date >= criteria.dateFrom);
		}
		if (criteria.dateTo) {
			filteredStories = filteredStories.filter(story => story.date <= criteria.dateTo);
		}
		if (criteria.author) {
			filteredStories = filteredStories.filter(story => story.author == criteria.author);
		}
		return filteredStories;
	}
}
