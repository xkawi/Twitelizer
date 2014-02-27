var fs = require('fs');
var path = require('path');
var express = require('express');
var Twit = require('twit');
var natural = require('natural'),
tokenizer = new natural.WordTokenizer();

natural.PorterStemmer.attach();

var twit = new Twit({
	consumer_key:         '7Lmr2KRbN0DwfmRHOBUzg',
	consumer_secret:      '6QWUBxGpBHXbWacocdN575kGMyskL8oeWKO51zzIaE',
	access_token:         '101481624-LWbbPcJgFJ6ka8i5e29wP9LUJVdy9dMcGOZOtUXC',
	access_token_secret:  'PGxd01V5nFYelk4spQi6ePjkJamcHeb4SYrdWy5Dxd3bf'
});

var app = express();

function get_limits(callback){
	twit.get("application/rate_limit_status", { resources: "statuses" }, function(err, reply){
		if (err) throw err;
		var result = reply.resources.statuses['/statuses/user_timeline'];
		console.log("checking limits...", result);
		callback(err, result);
	});
}


var traindata_dir = "traindata";	
var classifier_file = "classifier.json";


app.get('/train/:cmd/:scrname', function(req, res){

	var scrname = req.params.scrname;
	var command = req.params.cmd;

	if (command == "create_data"){
		//only create train_data.txt (e.g. "hello,there,a,tweet")
		//hence, need to modify it after reading it
		//detect query for count of tweets
		var d = new Date();
		var date_string = d.getDate().toString()+d.getMonth().toString()+d.getYear().toString()+d.toTimeString().toString().split(' ')[0].replace(/:/g,'');
		var file_name = train_data_dir+"/"+date_string+".txt";
		var wstream = fs.createWriteStream(file_name, {encoding: 'utf-8', mode: 438, flag: 'a'});

		wstream.on('finish', function(){
			console.log("everything has been written to ", file_name);
		});

		//	var max_id = 0;

		twit.get("statuses/user_timeline", { screen_name: scrname, count: 200}, function(err, reply){
			if (err) throw err;
			//console.log(typeof(reply));
			console.log(scrname + " tweets is retrieved and trying to save it to ", file_name);

			wstream.write("screen_name," + scrname + ":negative,0:neutral,0:positive,0\n");
			
			reply.forEach(function(tweet){

				var t = tweet.text;
				var no_at = t.replace(/@\w+/g, '');		//remove '@username'
				var no_space = no_at.replace(/^\s+|\s+$/g, '');	//remove leading left or right spaces
				var tokenize_string = tokenizer.tokenize(no_space);
				//console.log(no_spaces);

				wstream.write(tokenize_string.toString() + "\n");

			}); //end forEach
			wstream.end();

			res.send(JSON.stringify(reply));

		});

	} else if (command == "classifier") {

		//train classifier using the created and modified data
		//save the trained result
		//iterate through all the traindata and read line by line

		fs.readdir(traindata_dir, function(err, files){

			var filelist = [];
			
			files.forEach(function(fi) {
				var file = traindata_dir + '/' + fi;
				var stat = fs.statSync(file);
				if (path.extname(file) == '.txt' && !stat.isDirectory()){
					filelist.push(file);
				}
			});

			var features = [];
			var classifier = new natural.BayesClassifier();
			//console.log(filelist);
			filelist.forEach(function(file){
				fs.readFile(file, 'utf-8', function(err, data){
					var lines = data.toString().split(/\r?\n/);
					var data_info = lines.shift(); //remove the header
					lines.forEach(function(tw){
						var features_string = tw.split(/:/); //array object
						var classification = features_string.pop(); //remove the last element, which is the classification (e.g. neutral, negative)
						var features_arr = features_string[0].split(/,/);
						features.push([features_arr, classification]);
						classifier.addDocument(features_arr, classification);
					});
					//console.log(file, "done reading with features length of ", features.length, " and classifier is ", classifier.length);
					console.log("training the classifier...");
					classifier.train();
					console.log("saving the train result...");
					classifier.save(classifier_file, function(err, classifier) {
						console.log('train result is persisted in ', classifier_file, 'file');
						//console.log(classifier.classify('SMU is so cool!'));
					});
				});
});
});

res.send("Please check the directory for ", classifier_file, " file!");

} else {
	res.send("please specify the command (e.g. /train or /classifier");
}
});

/*function getTweets_byScrname(scrname, cnt, callback){
	console.log("Screen name: ", scrname);
	//search or statuses
	twit.get("statuses/user_timeline", { screen_name: scrname, count: cnt}, function(err, reply){
		if (err) throw err;
		reply.forEach(function(tweet){

			var t = tweet.text;
			var no_at = t.replace(/@\w+/g, '');		//remove '@username'
			var no_space = no_at.replace(/^\s+|\s+$/g, '');	//remove leading left or right spaces
			var tokenize_string = tokenizer.tokenize(no_space);
			//console.log(no_spaces);

			callback(err, data);		
		});
	});
}

var stopwords = []
fs.readFile("stop-words.txt", 'utf-8', function(err, data){
//	var lines = data.toString().split(/\r?\n/);
	//console.log(lines);
	var words = data.toString().split(/,/);
	//console.log(words);
	stopwords = words;
	//console.log(stopwords);
});

function search_tweets(query, callback){
	console.log("Search: ", query);
	var data = [];
	var err = null;
	twit.get('search/tweets', { q: query, count: 200 }, function(err, reply) {
		err = (err) ? err : null;
		var tweets = reply.statuses;
		//console.log(typeof tweets, tweets);
		tweets.forEach(function(tweet){
			var t = tweet.text;
			var no_at = t.replace(/@\w+/g, '');		//remove '@username'
			var no_space = no_at.replace(/^\s+|\s+$/g, '');	//remove leading left or right spaces
			var tokenize_string = tokenizer.tokenize(no_space);

			for (var i = tokenize_string.length - 1; i >= 0; i--) {
				if (tokenize_string[i].length <= 2) tokenize_string.splice(i, 1);
			};

			//console.log(tokenize_string.join(" "), tokenize_string.length);
			//data.push(tokenize_string.join(" "));
			data.push(tokenize_string);
			//tokenize_string.toString() + "\n");
		}); //end forEach
		callback(err, data);
	});
}*/

app.get('/classify/:calltype', function(req, res){

	var calltype = req.params.calltype;
	var scrname = (req.query.screen_name) ? req.query.screen_name : null;
	var cnt = (req.query.count) ? req.query.count : 200;
	var query = (calltype == 'search' && req.query.q) ? req.query.q : null;

	var max_tweets = 3200;
	var total_retrieved = 0;
	var max_id = 0;
	var remaining = 180;
	var data = [];

	if (calltype == "search" && query){
		
		twit.get('search/tweets', { q: query, count: cnt }, function(err, reply) {
			err = (err) ? err : null;

			var tweets = reply.statuses;

			total_retrieved += tweets.length;			
			max_id = tweets[tweets.length-1].id;

			get_limits(function(err, data){
				remaining = data.remaining; //{remaining: 180, reset: 1234567, limit: 180}
			});
			
			//analyse and classified
			natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {
				console.log("classifier: ", classifier);
				tweets.forEach(function(tweet){
					var t = tweet.text;
					var no_at = t.replace(/@\w+/g, '');		//remove '@username'
					var no_space = no_at.replace(/^\s+|\s+$/g, '');	//remove leading left or right spaces
					//var tokenize_string = tokenizer.tokenize(no_space);
					console.log(classifier.classify(no_space));
					/*for (var i = tokenize_string.length - 1; i >= 0; i--) {
						if (tokenize_string[i].length <= 2) tokenize_string.splice(i, 1);
					};*/
				});//end forEach
			});
		});

		/*if (classifier && data.length > 0 && remaining > 50 && max_id != 0 && total_retrieved < max_tweets){
			data.forEach(function(tweet){
				console.log(tweet);
				console.log(classifier);
				console.log(classifier.classify(tweet));
			});
}*/

} else if (scrname) {

		//retrieve tweets first

		var options = {
			screen_name: scrname,
			count: 200
		}
		
		getUserHistory(scrname, function(err, data){

		});

		//if (max_id != 0) options.max_id = max_id;

		//for (var i = 5; i > 0; i--) {
			//loop 5 times;
			/*twit.get("statuses/user_timeline", options, function(err, reply){
				if (err) throw err;
				total_retrieved += reply.length;			
				max_id = reply[reply.length-1].id;
				console.log(reply[0].text);
				get_limits(function(err, data){
					remaining = data.remaining; //{remaining: 180, reset: 1234567, limit: 180}
				});
				reply.forEach(function(tweet){
					var t = tweet.text;
					var no_at = t.replace(/@\w+/g, '');		//remove '@username'
					var no_space = no_at.replace(/^\s+|\s+$/g, '');	
					//write_to_file("tweets.txt", no_space);
				});

				if (max_id != 0) options.max_id = max_id;

				console.log("max_id from options: ", options);
				twit.get("statuses/user_timeline", options, function(err, reply){
					if (err) throw err;
					total_retrieved += reply.length;			
					max_id = reply[reply.length-1].id;
					console.log(reply[0].text);
					get_limits(function(err, data){
						remaining = data.remaining; //{remaining: 180, reset: 1234567, limit: 180}
					});
					reply.forEach(function(tweet){
						var t = tweet.text;
						var no_at = t.replace(/@\w+/g, '');		//remove '@username'
						var no_space = no_at.replace(/^\s+|\s+$/g, '');	
					});
				});


			}); //end of get*/
		//}//end of while loop


		//classify here

		/*var result = { "neutral": 0, "negative": 0, "positive": 0};
		var lines = [];

		natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {
			reply.forEach(function(tweet){
				var t = tweet.text;
				var no_at = t.replace(/@\w+/g, '');		//remove '@username'
				var no_space = no_at.replace(/^\s+|\s+$/g, '');	//remove leading left or right spaces

				//tweet.created_at: 'Wed Mar 28 02:32:25 +0000 2012'
				var d = new Date(tweet.created_at);
				var date_str = d.getFullYear().toString() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2)

				var classification_res = classifier.classify(no_space);
				
				lines.push([date_str, classification_res]);

				result[classification_res] += 1;
			});
			//store this information
			//date | negative | neutral | positive
			//20110214 | 14 | 15 | 14

			console.log(result, lines);

			/*var options = {
				"remaining": remaining,
				"max_id": max_id,
				"total_retrieved": total_retrieved,
				"max_tweets": max_tweets,
				"screen_name": scrname,
				"count": (cnt-200)
			}

			get_tweets(null, options, function(err, data){
				console.log(data.length);
			});*/

		//});

		//if (classifier && data.length > 0 && remaining > 50 && max_id != 0 && total_retrieved < max_tweets)
		//request for more tweets
	}
	
	/*do {
		get_limits(function(err, data){
			remaining = data.remaining; //{remaining: 180, reset: 1234567, limit: 180}
		});

		//analyse
		var calltype = 
		get_tweets(calltype, scrname, query, function(err, data){

		});
} while (remaining > 15);*/

	//console.log(typeof(limits), JSON.stringify(limits));

	res.send("done");
});

/*function get_tweets(err, options, callback){
	var data = [];
	
	var loops = parseInt(options.count / options.total_retrieved, 10);

	//console.log(options, loops);
	
	for (var i = loops; i > 0; i--) {
		var max_id = options.max_id;
		console.log(max_id);

		twit.get("statuses/user_timeline", { screen_name: options.screen_name, max_id: max_id, count: options.count}, function(err, reply){
			console.log(reply[0].text);
			
			options.total_retrieved += reply.length;			
			max_id = reply[reply.length-1].id;

			get_limits(function(err, data){
				options.remaining = data.remaining; //{remaining: 180, reset: 1234567, limit: 180}
			});

			reply.forEach(function(tweet){
				var t = tweet.text;
				var no_at = t.replace(/@\w+/g, '');		//remove '@username'
				var no_space = no_at.replace(/^\s+|\s+$/g, '');	//remove leading left or right spaces
				data.push(no_space);
			});
			console.log("retrieved: ", reply.length);
		});
		//console.log(data.length);
	};

	if (data.length = options.count){
		//console.log("data: ", data.length);	
		callback(err, data);
	}

	//console.log(data.length);
	//do {		
		//console.log(data);
	//} while (options.total_retrieved < options.cnt)

	//options.remaining > 50 || 
}*/

/*app.get('/data_analysis', function(req, res){
	
});
*/

function write_to_file(file_name, text){
	var wstream = fs.createWriteStream(file_name, {encoding: 'utf-8', mode: 438, flag: 'a'});
	wstream.on('finish', function(){
		console.log(text, " >>> ", file_name);		
	});
	wstream.write(text, "\n");
	wstream.end();
}

function getUserHistory(user, done) {
	var data = [];

	search();

	function search(lastId) {
		var args = {
			screen_name: user,
			count: 200,
			max_id: lastId
		};

		twit.get('statuses/user_timeline', args, onTimeline);

		function onTimeline(err, chunk) {
			if (err) {
				console.log('Twitter search failed!');
				return done(err);
			}

			if (data.length) chunk.shift(); // What is this for?
			data = data.concat(chunk);
			var thisId = parseInt(data[data.length - 1].id_str);

			if (chunk.length) return search(thisId);
			return done(undefined, data);
		}
	}
}


      	app.listen(3000);
      	console.log('Listening on port 3000');