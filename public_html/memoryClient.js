/**
 * Akhil Dalal
 * 100855466
 * 11th November 2016
 *
 * Client side script - This contains all the game logic.
 */

var attempts = 0; // tracks the number of matches made.
var firstCard = ""; // tracks the first card flipped
var firstNum = -1;
var flipped = 0; // tracks active cards (those flipped and are in play).
var secondCard = ""; 
var secondNum = -1;
var totalCards; // total number of cards, tracks how many left till game won.
var user; // current user. 

// Getting user name when dom loads. 
$(document).ready(function(){
	user = window.prompt("What is your name?", "default");
	
	while (user.length == 0) {
		user = window.prompt("Username cannot be empty,\nplease enter a valid username, or press ok to get a default name.", "default");
	}
	
	$.ajax({
		method: "GET",
		url: "/memory/intro",
		data: {"username": user},
		success: displayGame,
		dataType: 'json'
	});
});

// Callback for user registration ajax
// Initialize the total cards on the gameboard.
// Create the gameboard of size n by n, with the appropriate n.
function displayGame(data){
	totalCards = data.level * data.level;
	
	// create the gameboard
	$("#gameboard").empty();
	
	var row, cell;
	var div;
	var i, j;
	
	// create multiple rows using nested for loop
	for (i = 0; i < data.level; i++) {
		row = $("<tr></tr>");
		for (j = 0; j < data.level; j++) {
			cell = $("<td></td>"); // cell/table data to make positioning stable
			div = $("<div class='tile' data-row="+i+" data-col="+j+" data-isflipped=false></div>");
			div.append("<span></span>")
			div.on("click", chooseTile);
			cell.append(div);
			row.append(cell);
		}
		
		$("#gameboard").append(row);
	}
}

// Click handler for each card/tile.
function chooseTile() {
	var card = $(this); // Current clicked card. 
	
	// Check if it is the first card to be played in the turn.
	// Store it appropriately.
	if (flipped === 0 && firstCard === "" && card.data('isflipped') === false) {
		firstCard = card;
	} else if (flipped === 1 && card.data('isflipped') === false){
		secondCard = card;
	} 
	
	// If flipped is < 2, that means it's either 0 (at first card flip) 
	// or 1 (at second card flip).
	// flipped will be 2 when 2 cards have been flipped.
	// It will not let you flip another card till both cards have been "unflipped".
	if (flipped < 2 ){ //&& (firstCard.data('isflipped') === false || card.data('isflipped') === false) {
		$.ajax({
			method: "GET",
			url: "/memory/card",
			data: {"username": user, "row": card.data('row'), "col": card.data('col'), "gameOver": false},
			success: saveVals,
			dataType: 'text'
		});
	}
	
	
	// helper function to
	// - Save the number values for comparison later.
	// - Flip/Show the card.
	function saveVals(num) {
		if (firstNum === -1) {
			firstNum = num;
			flipped += 1;
			showCard(num);
		} else if (flipped < 2) {
			secondNum = num;
			flipped += 1;
			showCard(num);
		} 
		
		// If 2 cards flipped, check if they are the same.
		if (flipped === 2) {
			checkMatch();
		}
	} // end of saveVals
	
	
	// helper function to flip the card and show the value.
	// will flip the current card clicked.
	function showCard(num) {
		// remove click listener.
		card.off("click", chooseTile);
		card.attr("data-isflipped", "true");
		
		// start animation
		card.hide("blind", {direction: "vertical"});
		window.setTimeout(function(){
			card.attr("class", "tile flipped"); // add class to apply flip css.
			card.find('span').text(num);
			card.show("blind", {direction: "vertical"});
		}, 450);
		// end of animation
	} // end of showCard
	
	
	// helper function to hide/unflip the card.
	// will only be called if there is no match!
	function hideCards() {
		// apply animation to both cards.
		secondCard.hide("blind", {direction: "vertical"});
		firstCard.hide("blind", {direction: "vertical"});
		
		window.setTimeout(function(){
			secondCard.attr("class", "tile");
			firstCard.attr("class", "tile");
			
			firstCard.find('span').text("");
			secondCard.find('span').text("");
			
			secondCard.show("blind", {direction: "vertical"});
			firstCard.show("blind", {direction: "vertical"});
			
			// reset all variables
			firstCard = "";
			firstNum = -1;
			secondCard = "";
			secondNum = -1;
			flipped = 0;
		}, 450);
	} // end of hideCards
	
	
	// helper function to do card comparison.
	function checkMatch(){
		
		attempts += 1; // track match attempts made.
		
		// If both cards are the same, reset all values, and
		// subtract 2 cards from total cards as they are no longer
		// in play.
		// If they are different, add back the click listeners
		// and hide/flip them back.
		if (firstNum == secondNum) {
			firstCard = "";
			firstNum = -1;
			secondCard = "";
			secondNum = -1;
			
			// set active cards to 0 after a delay so user cannot choose third card.
			window.setTimeout(function() {flipped = 0;}, 1500);
			totalCards -= 2;
		} else {
			firstCard.on("click", chooseTile);
			firstCard.attr("data-isflipped", "false");
			secondCard.attr("data-isflipped", "false");
			secondCard.on("click", chooseTile);
			window.setTimeout(hideCards, 1500);	
		}
		
		// If the last two cards have been matched,
		// then totalCards = 0.
		// Tell the user they won, and initiate end game procedures.
		if (totalCards === 0) {
			window.setTimeout (function() {
				alert("You won! It took you " + attempts + " matching attempts.")
				gameOver();
			}, 1500);
		}
	} // end of checkMatch
	
	// helper function to get the next level from the server.
	function gameOver(){
		$.ajax({
			method: "GET",
			url: "/memory/card",
			data: {"username": user, "gameOver": true},
			success: displayGame,
			dataType: 'json'
		});
	}// end of gameOver
} // end of click handler.