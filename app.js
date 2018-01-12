/**
 * Akhil Dalal
 * 100855466
 * 11th November 2016
 * Assignment 3 - Use jQuery and node.js to make an interactive game - Concentration.
 */
 
// modules
var http = require('http');
var url = require('url');
var mime = require('mime-types');
var fs = require('fs');
var board = require('./makeBoard');

var users = {};
const ROOT = "./public_html";
const MAX_LEVEL = 4;

// R1.1
var server = http.createServer(requestHandler);
server.listen(2406);
console.log("Server running on 2406...");

/*
 * Function - requestHandler
 * Purpose - Callback method to handle user requests
 * Parameters - req
				- the request
			  - res
 */
function requestHandler(req, res){
	// log the incoming request
	console.log(req.method + " request for " + req.url);
	
	// parse the url to get easy access to queries and pathname
	var urlObj = url.parse(req.url, true);
	var filename = ROOT + urlObj.pathname;
	
	/* 
	 * There are 2 special routes.
	 * R1.2 - /memory/intro - registers the user with a new game.
	 *
	 * R1.3 - /memory/card  - 1) BONUS - checks if user won game
									   - increases difficulty and sends new game.
							  2) If user is still playing, it sends the
							     number for the card that was clicked.
	 */
	if(urlObj.pathname === "/memory/intro") {
		
		// Create the game starting at level 1.
		/*
			Levels are -
				1 = 4x4, 2 = 6x6, 3 = 8x8, 4 = 10x10
				after level 4, we resest back to level 1 (one).
		 */
		var game = {level: 1};
		
		// for n by n tiles, n is (level + 1) * 2
		game.numbers = board.makeBoard((game.level+1) * 2);
		game.won = false; // track if user hsa won or not.
		
		users[urlObj.query.username] = game;
		
		// SHOWS THE ARRAY SO TESTING IS EASIER.
		console.log("- CHEAT -");
		console.log(urlObj.query.username + ": ");
		console.log(game);
		console.log("- END CHEAT -");
		
		respond(200, JSON.stringify({level:(game.level+1) * 2}));
	} else if (urlObj.pathname === "/memory/card"){
		
		var toSend = ""; // response.
		
		if(urlObj.query.gameOver === "true") {
			// create new game with incremented level.			
			var game = users[urlObj.query.username];
			
			// check if we are at MAX_LEVEL.
			if (game.level === MAX_LEVEL)
				game.level = 1;
			else 
				game.level += 1;
			
			game.numbers = board.makeBoard((game.level+1) * 2);
			game.won = false;
			
			users[urlObj.query.username] = game;
			
			console.log("- CHEAT -");
			console.log(urlObj.query.username + ": ");
			console.log(game);
			console.log("- END CHEAT -");
			
			toSend = JSON.stringify({level: (game.level+1) * 2});
		} else {
			// send the number at that card that the user clicked.
			toSend = "" + users[urlObj.query.username].numbers[urlObj.query.row][urlObj.query.col];
		}
		
		respond(200, toSend);
	} else {
		//the callback sequence for static serving...
		fs.stat(filename,function(err, stats){
			if(err){   //try and open the file and handle the error, handle the error
				respondErr(err);
			}else{
				if(stats.isDirectory())	filename+="/index.html";
			
				fs.readFile(filename,"utf8",function(err, data){
					if(err)respondErr(err);
					else respond(200,data);
				});
			}
		});			
	}
	
	//locally defined helper function
	//serves 404 files 
	function serve404(){
		fs.readFile(ROOT+"/404.html","utf8",function(err,data){ //async
			if(err)respond(500,err.message);
			else respond(404,data);
		});
	}
		
	//locally defined helper function
	//responds in error, and outputs to the console
	function respondErr(err){
		console.log("Handling error: ",err);
		if(err.code==="ENOENT"){
			serve404();
		}else{
			respond(500,err.message);
		}
	}
		
	//locally defined helper function
	//sends off the response message
	function respond(code, data){
		// content header
		res.writeHead(code, {'content-type': mime.lookup(filename)|| 'text/html'});
		// write message and signal communication is complete
		res.end(data);
	}	
} // end of requestHandler