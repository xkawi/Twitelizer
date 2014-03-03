### Welcome to Twitelizer.
Twitelizer is a web application that helps you understand yourself better just from your tweets. It mainly focuses on Sentiment Analysis such that you know what is your overall mood in year 2013 as an example. This is part of a module's project in my university - Singapore Management University. Hence, its robustness and reliability might not be sufficient.

### Technology
* [ExpressJS](http://expressjs.com/) - Backend code that performs the actual sentiment analysis
* [Natural](https://github.com/NaturalNode/natural) - general natural language facility for node.js
* [Twit](https://github.com/ttezel/twit) - Twitter API Client for node (REST & Streaming API)
* [AngularJS](http://angularjs.org/) - Frontend Library
* [Twitter Bootstrap](http://getbootstrap.com/) - Frontend Library

### Theory/Concepts Applied
1. Naive Bayes Classifier
2. Supervised Learning

If you would like to develop similar application for education purpose, here is a high level guide that you can follow:

1. Start by **looking** for ways of **retrieving** the **data needed** and store it somewhere. There are 2 possible ways that you can consider depending on the type of data: web scraping or API. (e.g. in my case I use twitter API - please do not abuse my API key.. tyvm! =D )
2. **Develop** the classification engine. If you are a Python guy, [NLTK](http://www.nltk.org/) is the best library out there related to Natural Language Processing stuffs. If you are not, you can always Google it like this: Natural Language Processing <Java,C#,Javascript,replace with the language that you prefer>. For me I use Natural, it is the Javascript version of NLTK. **NOTE**: you might not be able to find it in your preferred language, but keep searching because I believe someone somewhere out there in this world is developing it - you could be that person if want to. ;)
3. Prepare **train dataset** and **start training the classification engine**. Type of Train Dataset is dependent on your objective. As an example, if you want classify certain string to either "good" or "bad", the possible train dataset would be:
* [i,dislike,you] = bad
* [you,are,so,kind] = good
The format would be different depending on the library that you used to develop the classification engine. The above format is for the library that I am using - Natural. Few things to take Note: each word in the array is called _**features**_ and the result ("good", "bad") is called _**class variable**_ or the actual classification that you want to achieve.
4. **Start classifying the retrieved data** using the trained classification engine. This could be achieved by several means, some of them could be through scripts that can be configured to run the classification engine during certain time or a web interface that interacts with backend server or any other method. In my case, I developed a front-end interface that interacts with a backend server and pass certain command depending on the button that the user click.
5. You can format the classification output and play with it as much as you want. If you visit the front-end page of Twitelizer, it actually represent those results in graph. This could not be achieved through scripting as example; Hence I chose to build the overall application in Javascript because my end goal is to have an interface that interacts with the backend server and visualise the output nicely in a web page. 

### Demo
You could visit the backend page [here](http://twitelizer-env-f9m23teep2.elasticbeanstalk.com/) and frontend page [here](http://twitelizer-fe.kawi.me.s3-website-ap-southeast-1.amazonaws.com/). It is hosted at AWS EC2 and S3.

### Contact Me
Confused with the guide? Need clarification? or Would like to take this application further? You can drop me an email at kawi@kawi.me or you could visit my github profile here (@neoborn) to see what I have been doing lately. Thank you for visiting this page.

Cheers,
Kawi
