var fs = require('fs');
var path = require('path');
var express = require('express');
var Twit = require('twit');
var Firebase = require('firebase');
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

function save_result_csv(scrname, result){
	//for pie chart: csv file
	/*
	sentiment, tweets
	neutral,200
	positive,100
	negative,200
	*/
	var file_name = "results/" + scrname + ".csv";
	var wstream = fs.createWriteStream(file_name, {encoding: 'utf-8', mode: 438, flag: 'a'});
	wstream.on('finish', function(){
		console.log("please check ", file_name);		
	});

	//call function to create .tsv file for line graph
	var header = "sentiment,tweets";
	console.log(header);
	wstream.write(header + "\n");

	for (var key in result) {
		if (result.hasOwnProperty(key)) {
			var str = key + "," + result[key];
			console.log(str);
			wstream.write(str + "\n");
		}
	}
	wstream.end();
}

function save_result_tsv(scrname, classified_tweets){
	//for line graph
	/*
date	negative	neutral	positive
20101126	0	0	1
20101127	0	4	6
20101128	2	9	6
20101129	1	2	8
	*/
	var file_name = "results/" + scrname + ".tsv";

	var wstream = fs.createWriteStream(file_name, {encoding: 'utf-8', mode: 438, flag: 'a'});
	wstream.on('finish', function(){
		console.log("please check ", file_name);		
	});

	//call function to create .tsv file for line graph
	var header = "date\tnegative\tneutral\tpositive";
	console.log(header);
	wstream.write(header + "\n");

	for (var key in classified_tweets) {
		if (classified_tweets.hasOwnProperty(key)) {
			var str = key + "\t" + classified_tweets[key]["negative"] + "\t" + classified_tweets[key]["neutral"] + "\t" + classified_tweets[key]["positive"];
			console.log(str);
			wstream.write(str + "\n");
		}
	}
	wstream.end();
}

function getUserTimelines(user, done) {
	var data = [];
	search();

	function search(lastId) {
		var args = {
			screen_name: user,
			count: 200,
			max_id: lastId
		}

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


var traindata_dir = "traindata";
var classifier_file = "classifier.json";

app.get('/ratelimit', function(req, res){
	get_limits(function(err, data){
		res.send(data);
		/*{
			"limit": 180,
			"remaining": 180,
			"reset": 1393510499
		}*/
	});
});

app.get('/train/:cmd', function(req, res){
	
	///train/data?screen_name=smu
	var command = req.params.cmd;
	var scrname = (req.query.screen_name) ? req.query.screen_name : null;
	var respond = {
		"status": "unknown",
		"message": "unknown"
	}

	if (command == "data"){
		var d = new Date();
		var date_string = d.getDate().toString()+d.getMonth().toString()+d.getYear().toString()+d.toTimeString().toString().split(' ')[0].replace(/:/g,'');
		var file_name = traindata_dir+"/"+date_string+".txt";
		var wstream = fs.createWriteStream(file_name, {encoding: 'utf-8', mode: 438, flag: 'a'});
		wstream.on('finish', function(){
			console.log("everything has been written to ", file_name);
		});
		twit.get("statuses/user_timeline", { screen_name: scrname, count: 200}, function(err, reply){
			if (err) throw err;
			console.log(scrname + " tweets is retrieved and trying to save it to ", file_name);
			wstream.write("screen_name," + scrname + ":negative,0:neutral,0:positive,0\n");
			reply.forEach(function(tweet){
				var t = tweet.text;
				var no_at = t.replace(/@\w+/g, '');		//remove '@username'
				var no_space = no_at.replace(/^\s+|\s+$/g, '').toLowerCase();;	//remove leading left or right spaces
				var tokenize_string = tokenizer.tokenize(no_space);
				wstream.write(tokenize_string.toString() + "\n");
			});
			wstream.end();
			respond["status"] = "success";
			respond["message"] = "tweets retrieved: " + reply.length + "; proceed to modify train data: " + file_name
			res.send(respond);
		});
	} else if (command == "classifier") {
		fs.readdir(traindata_dir, function(err, files){
			var filelist = [];
			files.forEach(function(fi) {
				var file = traindata_dir + '/' + fi;
				var stat = fs.statSync(file);
				if (path.extname(file) == '.txt' && !stat.isDirectory()){
					filelist.push(file);
				}
			});
			
			var classifier = new natural.BayesClassifier();
			filelist.forEach(function(file){
				fs.readFile(file, 'utf-8', function(err, data){
					var lines = data.toString().split(/\r?\n/);
					var data_info = lines.shift(); //remove the header
					lines.forEach(function(tw){
						var features_string = tw.split(/:/); //array object
						var classification = features_string.pop(); //remove the last element, which is the classification (e.g. neutral, negative)
						var features_arr = features_string[0].split(/,/);
						
						classifier.addDocument(features_arr, classification);
					});
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
		respond["status"] = "success";
		respond["message"] = classifier_file + " file has been created in the root directory.";
		res.send(respond);
	} else {
		respond["status"] = "error";
		respond["message"] = "missing parameter /train/data?screen_name or /train/classifier";
		res.send(respond);
	}
});

app.get('/classify/:screen_name', function(req, res){
	var scrname = (req.params.screen_name) ? req.params.screen_name : null;
	if (scrname) {
		getUserTimelines(scrname, function(err, data){
			if (err) throw err;
			var result = { "neutral": 0, "negative": 0, "positive": 0};
			natural.BayesClassifier.load('classifier.json', null, function(err, classifier) {
				var fbase = new Firebase('https://twitelizer.firebaseio.com/' + scrname);
				data.forEach(function(tweet){
					var t = tweet.text;
					//remove '@username' and leading left or right spaces
					var clean_text = t.replace(/@\w+/g, '').replace(/^\s+|\s+$/g, '').toLowerCase();;
					var classification_res = classifier.classify(clean_text);
					result[classification_res] += 1;
					//save to firebase
					fbase.push({id: tweet.id, screen_name: scrname, date: tweet.created_at, text: clean_text, classification: classification_res});
				});
				console.log(result);

				//save the data for creating the pie chart
				save_result_csv(scrname, result);
				var respond = {
					"status": "success",
					"message": result
				}
				res.send(respond);
			});
		});
	} else {
		var respond = {
			"status": "error",
			"message": "missing screen name: /classify/screen_name"
		}
		res.send(respond);
	}
});

app.get('/analyse/:screen_name', function(req, res){
	var scrname = (req.params.screen_name) ? req.params.screen_name : null;
	if (scrname){
		/*example:
		var classified_tweets = {
			"20120101" : {"neutral": 0, "positive": 1, "negative": 2},
			"20120102" : {"neutral": 0, "positive": 1, "negative": 2}
		}*/
		var classified_tweets = {};
		var fbase = new Firebase("https://twitelizer.firebaseio.com/" + scrname);
		//reference: https://www.firebase.com/docs/javascript/datasnapshot/index.html
		fbase.once('value', function(allMessagesSnapshot) {
	  		allMessagesSnapshot.forEach(function(messageSnapshot) {  			
	    		var d = new Date(messageSnapshot.child('date').val());
	    		var date = d.getFullYear().toString() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2)
			
	    		var classification = messageSnapshot.child('classification').val();
	    		if (!classified_tweets[date]){
	    			classified_tweets[date] = { "negative": 0, "neutral": 0, "positive" : 0 };
	    		}
	    		classified_tweets[date][classification] += 1;
	  		});

	  		save_result_tsv(scrname, classified_tweets);
	  		var respond = {
				"status": "success",
				"message": classified_tweets
			}
			res.send(respond);
		});
	} else {
		var respond = {
			"status": "error",
			"message": "missing screen name: /analyse/screen_name"
		}
		res.send(respond);
	}
});

app.listen(3000);
console.log('Listening on port 3000');