var express = require('express');
var Twit = require('twit');
var fs = require('fs');
var natural = require('natural'),
classifier = new natural.BayesClassifier();

natural.PorterStemmer.attach();

var twit = new Twit({
	consumer_key:         '7Lmr2KRbN0DwfmRHOBUzg',
	consumer_secret:      '6QWUBxGpBHXbWacocdN575kGMyskL8oeWKO51zzIaE',
	access_token:         '101481624-LWbbPcJgFJ6ka8i5e29wP9LUJVdy9dMcGOZOtUXC',
	access_token_secret:  'PGxd01V5nFYelk4spQi6ePjkJamcHeb4SYrdWy5Dxd3bf'
});

var app = express();

var check_limits = (function(){
	console.log("checking limits...")
	twit.get("application/rate_limit_status", { resources: "statuses" }, function(err, reply){
		if (err) {
			console.log(err);
			return 50;
		} else {
			//console.log(reply);
			return parseInt(reply.resources.statuses['/statuses/user_timeline'].remaining);
			console.log(limit);
			//return limit;		
		}
	});
});

/*var get_tweets = (function(c){
	twit.get("statuses/user_timeline", { screen_name: 'smrtsg', count: c}, function(err, reply){
		if (err){
			console.log(err);
		} else {
			//console.log(typeof(reply));
			console.log("success in retrieving tweets");
			reply.forEach(function(tweet){
				console.log(tweet.id, tweet.text);
				that.push( {tweet['id']:tweet.text} );
			});
//			that.tweets = JSON.stringify(reply);
}
console.log(that, typeof(that));
return that;
});
});*/



app.get('/train/:cmd?', function(req, res){
	//check_limits();

	var command = req.params.cmd;

	if (command == "create_data"){
		//only create train_data.txt (e.g. "hello,there,a,tweet")
		//hence, need to modify it after reading it
		//detect query for count of tweets
	} else if (command == "classifier"){
		//train classifier using the created and modified data
		//save the trained result
	} else {
		res.send("please specify the command (e.g. /train/classifier");
	}

	var file_name = "train_data.txt";
	var wstream = fs.createWriteStream(file_name, {encoding: 'utf-8', mode: 438, flag: 'a'});

	wstream.on('finish', function(){
		console.log("everything has been written to ", file_name);
	});

//	var max_id = 0;

	twit.get("statuses/user_timeline", { screen_name: 'smrtsg', count: 200}, function(err, reply){
		if (err) throw err;
		//console.log(typeof(reply));
		console.log("success in retrieving tweets!", " trying to save it to ", file_name);

		reply.forEach(function(tweet){

			var t = tweet.text;
			var no_at = t.replace(/@\w+/g, '');		//remove '@username'
			var no_space = no_at.replace(/^\s+|\s+$/g, '');	//remove leading left or right spaces
			var tokenize_stem = no_space.tokenizeAndStem();
			//console.log(no_spaces);

			wstream.write(tokenize_stem.toString() + "\n");

		}); //end forEach
		wstream.end();

		res.send("tweets are saved in " + file_name);
		
	});

});

app.get('/classify/:count', function(req, res){

});

app.listen(3000);
console.log('Listening on port 3000');
//console.log("done");
