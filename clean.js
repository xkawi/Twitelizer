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

var traindata_dir = "traindata";
var classifer_file = "classifer.json";

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

		var all_features = [];

		var add_doc = (function(arr, cls){
			classifier.addDocument(arr, cls);
			all_features.push([arr, cls]);
			console.log("add_doc here", all_features.length);
			//console.log(arr.length, " lines with add_doc called");
		});

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
					var data_info = lines.shift();
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
						console.log('train result is persisted in ', classifer_file, 'file');
						//console.log(classifier.classify('SMU is so cool!'));
					});


				});
			});
		});

		res.send("Please check the directory for ", classifer_file, " file!");

	} else {
		res.send("please specify the command (e.g. /train/classifier");
	}
});

app.get('/classify/:scrname/:qty', function(req, res){

	var scrname = req.params.scrname;
	var cnt = req.params.qty;

	twit.get("statuses/user_timeline", { screen_name: scrname, count: cnt}, function(err, reply){
			if (err) throw err;

			//console.log(scrname + " tweets is retrieved and trying to save it to ", file_name);

			//wstream.write("screen_name," + scrname + ":negative,0:neutral,0:positive,0\n");
			
			reply.forEach(function(tweet){

				var t = tweet.text;
				var no_at = t.replace(/@\w+/g, '');		//remove '@username'
				var no_space = no_at.replace(/^\s+|\s+$/g, '');	//remove leading left or right spaces
				var tokenize_string = tokenizer.tokenize(no_space);
				//console.log(no_spaces);

				//wstream.write(tokenize_string.toString() + "\n");

			}); //end forEach
			//wstream.end();

			res.send(JSON.stringify(reply));

		});
});

/*app.get('/data_analysis', function(req, res){
	
});
*/

app.listen(3000);
console.log('Listening on port 3000');