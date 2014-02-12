var express = require('express');
var Twit = require('twit');
var fs = require('fs');
var natural = require('natural'),
	classifier = new natural.BayesClassifier();

var twit = new Twit({
	consumer_key:         '7Lmr2KRbN0DwfmRHOBUzg',
	consumer_secret:      '6QWUBxGpBHXbWacocdN575kGMyskL8oeWKO51zzIaE',
	access_token:         '101481624-LWbbPcJgFJ6ka8i5e29wP9LUJVdy9dMcGOZOtUXC',
	access_token_secret:  'PGxd01V5nFYelk4spQi6ePjkJamcHeb4SYrdWy5Dxd3bf'
})

var twit = new Twit({ consumer_key: '7Lmr2KRbN0DwfmRHOBUzg', consumer_secret: '6QWUBxGpBHXbWacocdN575kGMyskL8oeWKO51zzIaE', access_token:'101481624-LWbbPcJgFJ6ka8i5e29wP9LUJVdy9dMcGOZOtUXC', access_token_secret:  'PGxd01V5nFYelk4spQi6ePjkJamcHeb4SYrdWy5Dxd3bf' });

/*classifier.addDocument('i am long qqqq', 'buy');
classifier.addDocument("buy the q's", 'buy');
classifier.addDocument('short gold', 'sell');
classifier.addDocument('sell gold', 'sell');

classifier.train();

console.log(classifier.classify('i am short silver'));
console.log(classifier.classify('i am long copper'));*/


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

var app = express();

app.get('/', function(req, res){
	

	/*var get_rate_limit = function(){
		var limit = twit.get("application/rate_limit_status", { resources: "statuses" }, function(err, reply){
			if (err){
				console.log(err);
				return 50;
			} else {
				//console.log(reply);
				//console.log(reply.resources.statuses['/statuses/user_timeline'].remaining);
				return reply.resources.statuses['/statuses/user_timeline'].remaining;		
			}
		});
		return limit;
	};
	var rate_limit = get_rate_limit();
	console.log(rate_limit);*/

	var s = '';
	/*var fd = fs.open("tweets_for_training.txt", 'w', '0666', function(err, fd){
		if (!err){
			return fd;
		}
	});*/


	//for (var i = 10; i > 0; i--) {
		twit.get("statuses/user_timeline", { screen_name: 'smrtsg', count: 200}, function(err, reply){
			//console.log(reply);
			if (err){
				console.log(err);
			} else {
				for (var i = reply.length - 1; i >= 0; i--) {
					s += reply[i].text + "\n";
					//var no_url = no_at.replace("((?:https?\:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*) ", ''); 
		
					console.log(reply[i].text);
				};	
			}
		});
		console.log(s);
		console.log(typeof(s));
	//};

	fs.writeFileSync("/Users/kawi/dev/Twitelizer/train-data.txt", s, function(err) {
    	if(err) {
        	console.log(err);
    	} else {
        	console.log("The file was saved!");
    	}
	});

	//console.log(s);
	res.send(s);
});

app.listen(3000);
console.log('Listening on port 3000');
//console.log("done");
