#Batch.js


Made to easily iterate, map, reduce and find elements when you have to deal with really huge collections of data, on client-side.
It is asynchronous, chainable, and no blocked UI anymore.



##Read more about it

`$ docco src/` or just read annotated source code.


##Install

	$ bower install batchjs


##Examples

##### Iterate:
	
	batch(huge_collection)
	.each(function(item, index, flow){
	   //make some cool stuff
	})
	.next(function(results){
	   console.log("Woot! Done!");
	});
	
##### Find:
	
	batch(some_huge_collection)
	.find(function(item, index, flow){
	   return item['foo'] === 'cool stuff';
	})
	.next(function(results){
	   console.log("Woot! Found!", results);
	});
	
##### Map-Reduce:

	batch(another_huge_collection)
	.map(function(item, index, flow){
		return item['foo'];
	})
	.reduce(function(item, index, summary){
	  	return summary + item;
	})
	.next(function(result){
		console.log ("Mapped, Reduced", result);
	});


##### Chaining:

	batch(yet_another_huge_collection)
	.each(function(item){
		//iterate over cool stuff
	})
	.next(function(result){
		console.log ("Iterated!", result);
	})
	.map(function(item, index, flow){
		return item['foo'];
	})
	.next(function(result){
		console.log ("Mapped", result);
	})
	.reduce(function(item, index, summary){
	  	return summary + item;
	})
	.next(function(result){
		console.log ("Reduced", result);
	});




### Tests

	$ grunt test