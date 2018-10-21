var userCommand = document.getElementById("usercommand");
var chestText = document.getElementById("chesttext");
var statusText = document.getElementById("statustext");


userCommand.addEventListener("keyup", runCommand)

var textarea = document.getElementById("adventuretext")

var chest = [] // this is your inventory of things!

var commandHistory = [""];
var currentCommand = 0;
/****** Helper functions *******/

// var commandShortcut = {n: "north", s: "south",}; 

window.addEventListener('keydown', function(e) {
  if(e.keyCode == 32 && e.target == document.body) {
    e.preventDefault();
  }
});

function remove(array, element) {
    var index = array.indexOf(element);
    array.splice(index, 1);
}

function findElementInArray(array, property, val) {
  return array.find( thing => thing[property] === val )
}

// This is a specific function that apply to exactly one scenario.
function checkForDirection(object, property, val) {
  for(var direction in object){
    var something = object[direction][property].toLowerCase();
    var somethingArray = something.split(" ");
    while(somethingArray.length > 1){
      somethingArray[0] = somethingArray[0].concat(somethingArray[1]);
      somethingArray.splice(1, 1);  
    }
    //console.log(somethingArray[0])  
    if(somethingArray[0] == val){
      return direction;  
    }  
  }  
}

function showInventory() {
  var tempString = "<ul>"
  for (var i of chest) {
    tempString += "<li>" + i.name + "</li>"
  }
  tempString += "</ul>"
  //console.log(tempString)
  chestText.innerHTML = tempString
}

showStatus();
function showStatus() {
  var tempString = "<ul><li>Hit Point: " + orpheus.hp + "</li><li>Armor Class: " + orpheus.ac + "</li></ul>"
  //console.log(tempString)
  statusText.innerHTML = tempString
}

function showCommand(command) {
  textarea.innerHTML += "<span class='commandtext'>>> " + command + "</span><br>"
  
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/****** Game interaction *******/

function runCommand(e) {  
  if(e.keyCode == 38) { // Up Arrow
    currentCommand -= 1;
    if(currentCommand < 0) {
      currentCommand = 0;  
    }  
    userCommand.value = commandHistory[currentCommand];  
  }
  else if(e.keyCode == 40) { // Down Arrow
    currentCommand += 1;
    if(currentCommand > (commandHistory.length-1)) {
      currentCommand = commandHistory.length-1;  
    }  
    userCommand.value = commandHistory[currentCommand];
      
  }
  else if (e.keyCode == 13) { // checks if the "return" key has been pressed

    // gets the user's input and then sets text field to blank
    var userinput = userCommand.value.toLowerCase().trim();
    userCommand.value = "";
    if(userinput != "" && orpheus.status != "dead"){
      if(userinput != commandHistory[commandHistory.length-2]){    
        commandHistory[commandHistory.length-1] = userinput;
        commandHistory.push(""); 
      }
      currentCommand = commandHistory.length-1;  
      showCommand(userinput);
    }
      
    userinputEdited = userinput.replace("at ", "").replace("with ", "").replace("to ", "").replace("/  /g", " ");
    var inputArray = userinputEdited.split(" ");
        
    var firstWord = inputArray[0];
    if (userinput == "") {
      firstWord = "";
    }

    if (firstWord == "restart"){
      restart();  
      firstWord = "";  
    }  
    
    else if (orpheus.status == "dead") {
      //textarea.innerHTML += "Sorry for the inconvenience. orpheus.EXE is not responding. Please type 'restart' to reboot the program.<br>";
      //  
      firstWord = "";  
    }  
      
    else if (typeof masterQuestion == "object"){
      var questionAnswered = false;  
      for(var x of masterQuestion.responses){
        if(!questionAnswered && userinput == x.answer){
          masterQuestion.resolve(x);
          questionAnswered = true;
        }  
      }
      if(!questionAnswered){
        masterQuestion.idleText();  
      }
      firstWord = "";  
    }  
      
    if (firstWord == "description") {
      currentRoom.showDescription()
    }

    else if (userinput == "things") {
      currentRoom.showThings()
    }

    else if (userinput == "exits") {
      currentRoom.showExits()
    }

    else if (firstWord == "go" || firstWord == "head" || firstWord == "advance" || firstWord == "venture") {
      if (inputArray.length > 1) {
        if(inputArray[1] == 'south' || inputArray[1] == 'north' ||
          inputArray[1] == 'east' || inputArray[1] == 'west' ||
          inputArray[1] == 'southeast' || inputArray[1] == 'southwest' ||
          inputArray[1] == 'northeast' || inputArray[1] == 'northwest') {
          var currentDirection = inputArray[1];  
        } 
          
        else{
          while(inputArray.length > 2){
            inputArray[1] = inputArray[1].concat(inputArray[2]);
            inputArray.splice(2, 1);  
          }  
          var currentDirection = checkForDirection(currentRoom.exits, "location", inputArray[1]);
          //console.log(currentDirection);
        }
            
        var directionIsValid = false;
        for(var x in currentRoom.exits){
          if(currentDirection == x){
            directionIsValid = true; 
            var requirementFound = true;  
          }  
        }  
        if(directionIsValid && currentRoom.exits[currentDirection].requirement != null){ 
          var requirementNeeded = currentRoom.exits[currentDirection].requirement;  
          var requirementFound = false; 
          if(requirementNeeded.includes("||")){ 
            var requirementArray = requirementNeeded.split("||");
            for(var x of requirementArray){
              if(x.charAt(0) == "!"){
                var notFound = true;  
                for(var y of milestone){
                  if(x == ("!"+ y)) {  
                    notFound = false;  
                  }
                }
                if(notFound){
                  requirementFound = true;  
                }  
              }
              else{  
                for(var y of milestone){
                  if(x == y) {  
                    requirementFound = true;  
                  }
                }
              }
            }
          }
          else if(requirementNeeded.includes("&&")){  
            var requirementArray = requirementNeeded.split("&&");
            for(var x of requirementArray){
              if(x.charAt(0) == "!"){   
                var notFound = true;  
                for(var y of milestone){
                  if(x == ("!" + y)) {  
                    notFound = false;  
                  }
                }
                if(notFound){
                  y = true;  
                }  
              }
              else{    
                for(var y of milestone){
                  if(x == y) {  
                    y = true;
                  }
                }
              }
              var testForFalse = true;  
              for(var y of requirementArray){
                if(!y) {  
                  testForFalse = false;
                }
              }
              if(testForFalse){  
                requirementFound = true;  
              }
            }
          }
          else{  
            if(requirementNeeded.charAt(0) == "!"){
              requirementFound = true;  
              for(var x of milestone){     
                if(requirementNeeded == ("!" + x)){
                  requirementFound = false; 
                }  
              }
            }
            else{ 
              for(var x of milestone){ 
                if(x == requirementNeeded){
                  requirementFound = true;  
                }
              }
            }
          }
        }
        if(directionIsValid && requirementFound){  
          var result = findElementInArray(rooms, 'name', currentRoom.exits[currentDirection].location);
          if (result != null) {
            //currentRoom.exits[currentDirection].explored = true;  
            explored[currentRoom.exits[currentDirection].location] = true;  
            currentRoom = result;  
            //console.log(result)  
            currentRoom.showLocationName();
            currentRoom.showDescription();
            currentRoom.showThings();
            currentRoom.showExits();
            if(currentRoom.specialEffect != null){
              currentRoom.specialEffect();  
            }  
          }
        }
        else if (directionIsValid) {
           textarea.innerHTML += currentRoom.exits[currentDirection].requirementText + "<br>"; 
            
        }
        else {
          textarea.innerHTML += "Orpheus scratch his head in confusion. He seem to be travelling in an invalid direction.<br>Orpheus shamefully returns to his initial location. <br>";
            
        }  
      }
      else {
        textarea.innerHTML += "Orpheus scratch his head in confusion. He seem to be travelling in an invalid direction.<br>Orpheus shamefully returns to his initial location. <br>";
          
      }
    }

    else if (firstWord == "look" || firstWord == "inspect") {
      if (inputArray.length > 1) {
        var result = [findElementInArray(currentRoom.things, 'name', inputArray[1]), findElementInArray(currentRoom.npcs, 'name', inputArray[1]), findElementInArray(chest, 'name', inputArray[1])];  
        if (result[0] != null) {
          result[0].showDescription()
        }  
        else if (result[1] != null) {
          result[1].showDescription()
        }
        else if (result[2] != null) {
          result[2].showDescription()
        }
        else{
            textarea.innerHTML += "Orpheus tries to look at " + inputArray[1] + ". He blinks twice.<br>"
            
        }
      }
      else {
        textarea.innerHTML += "Orpheus tries to look at an undefined object. He blinks twice.<br>"
        
      }
    }

    else if (firstWord == "take" || firstWord =="get") {
      if (inputArray.length > 1) {  
        var result = findElementInArray(currentRoom.things, 'name', inputArray[1])
        if (result != null && result.takeAble) {
          chest.push(result)
          remove(currentRoom.things, result)
          showInventory()
          textarea.innerHTML += "Orpheus added the " + result.name + " to his inventory.<br>"
          if(result.takeQuestion){  
            result.takeQuestion.ask();  
          }
          
        }
        else {
          textarea.innerHTML += "Orpheus tries to take " + inputArray[1] + ". His hand grasps the flailing air.<br>"
          
        }
      }
      else {
        textarea.innerHTML += "Orpheus tries to take an undefined object. His hand grasps the flailing air.<br>"
        
      }
    }

    else if (firstWord == "use" || firstWord == "play") {
      if (inputArray.length > 1) {
        var result = findElementInArray(chest, 'name', inputArray[1])
        if (result != null) {
          result.use()
        }
        else {
          textarea.innerHTML += "Orpheus tries to use " + inputArray[1] + ". He plays his lyre in disgrace.<br>"
          
        }
      }
      else {
        textarea.innerHTML += "Orpheus cannot use an undefined object. He plays his lyre in disgrace.<br>"
        
      }
    }

    else if (firstWord == "talk" || firstWord == "speak" || firstWord == "converse") {
      if (inputArray.length > 1) {  
        var result = findElementInArray(currentRoom.npcs, 'name', inputArray[1])
        if (result != null) {
          result.talk(); 
          
        }
        else {
          textarea.innerHTML += "Orpheus tries to talk to " + inputArray[1] + ". His voice echoes throughout the chasm.<br>"
          
        }
      }
      else {
        textarea.innerHTML += "Orpheus tries to talk to an undefined object. Upon realizing his foolishness, Orpheus hangs his head in disgrace.<br>"
        
      }
    }

    else if (firstWord == "give") {
      if (inputArray.length > 2) {  
        var thing = findElementInArray(chest, 'name', inputArray[1]);
        var npc = findElementInArray(currentRoom.npcs, 'name', inputArray[2]);
        //console.log(thing)  
        //console.log(npc)  
          
        if (thing != null && npc != null) {
          var result = findElementInArray(npc.responseToGifts, 'trigger', thing.name);
          //console.log(result)  
          if(result != null){
            result.give(thing);   
          } 
          else{
            textarea.innerHTML += "Orpheus tries to give " + inputArray[1] + " to " + inputArray[2] + ".<br>";
            textarea.innerHTML += "<span style='color: " + npc.textColor + ";'>[" + npc.name + "]</span>&ensp;" + npc.dialogue.declineGift + "<br>";    
            
          }  
          
        }
        else {
          textarea.innerHTML += "Orpheus tries to give " + inputArray[1] + " to " + inputArray[2] + ". He whirls around to hide his apparent shame.<br>"
          
        }
      }
      else {
        textarea.innerHTML += "Orpheus tries to give an undefined object to an undefined object. He whirls around to hide his apparent shame.<br>"
        
      }
    }
      
    // Preferably, I will update it later to use the roll commands to determine hit and damage. That way the player will feel in control.
    else if (firstWord == "attack" || firstWord == "fight" || firstWord == "battle") {
      if (inputArray.length > 1) {  
        var enemy = findElementInArray(currentRoom.npcs, 'name', inputArray[1])
        if (enemy != null && enemy.status != "dead") {
          attack(enemy);  
        }
        else {
          textarea.innerHTML += "Orpheus tries to attack " + inputArray[1] + ". An anonymous soul watches in silence and slowly tiptoes to the far end of the room.<br>"
          
        }
      }
      else {
        textarea.innerHTML += "Orpheus tries to attack an undefined object. An anonymous soul watches in silence and slowly tiptoes to the far end of the room.<br>"
        
      }  
    }
      
    else if(masterQuestion == "" && firstWord != ""){
      textarea.innerHTML += "<span style='color: " + orpheus.textColor + ";'>[" + capitalize(orpheus.name) + "]</span>&ensp;What is " + userinput + "?<br>"      
    }
    scrollSmoothToBottom();  
  }
}

function attack(enemy) {   
  enemy.status = "hostile";  
  var tempString = "";  
  var charmedText = "charmed" + capitalize(enemy.name);  
  for(var i=0, length=milestone.length; i<length; i++){
    if(milestone[i] == charmedText){
      milestone.splice(i, 1);
      i=length;  
    }  
  }  
  //Orpheus attack
    
  //One way to make an attack object for Orpheus is to have thing add an attack method to Orpheus. Then, have a property called priority to check which one will be executed. However, this game is pretty short, so that will just take more space than necessary.
  var weapon = [findElementInArray(chest, 'name', "sword"), findElementInArray(chest, 'name', "rock"),];  
  var attackMethod = "fist";
  if(weapon[0] != undefined){
    attackMethod = "sword";  
  }  
  else if(weapon[1] != undefined){
    attackMethod = "rock";  
  }  
  var chosenAttack = orpheus.attacks[attackMethod];  
  //console.log(attackMethod)
  tempString += chosenAttack.text.initiation + "&nbsp;" + capitalize(enemy.name) + ". Roll to determine hit.";  
  var hitRoll = Math.floor(Math.random()*20)+1;
  tempString += "&ensp;(" + hitRoll + ")<br>";
    
  if(hitRoll == 20){
    tempString += chosenAttack.text.criticalHit; 
    if(typeof chosenAttack.damage == "string"){  
      var damageRoll = Number(chosenAttack.damage.replace("d", ""));  
    }
    else{
      var damageRoll = chosenAttack.damage;  
    }  
    tempString += "&ensp;(" + damageRoll + ")<br>";
  }  
  else if(hitRoll == 1){
    tempString += chosenAttack.text.criticalFailure + "<br>";
    tempString += "Orpheus takes 1 damage.<br>";
    orpheus.hp -= 1;  
  }  
  else if(hitRoll >= enemy.ac){ 
    tempString += chosenAttack.text.hit + "&nbsp;Roll for damage.";
    if(typeof chosenAttack.damage == "string"){  
      var damageRoll = Math.floor(Math.random()*Number(chosenAttack.damage.replace("d", "")))+1;  
    }
    else{
      var damageRoll = chosenAttack.damage;  
    }
    enemy.hp -= damageRoll;  
    tempString += "&ensp;(" + damageRoll + ")<br>";
    tempString += "The attack costed the damaged foe " + damageRoll + " hit points.<br>";
  }  
  else{ 
    tempString += chosenAttack.text.miss + "<br>";
  }
  
  if(enemy.hp <= 0){
    textarea.innerHTML += tempString;
    enemy.status = "defeated";  
    enemy.talk("defeated");        
    if(enemy.respawn != null){
      enemy.hp = enemy.respawn;
      tempString = "The necromantic power of Hades respawned " + capitalize(enemy.name) + " from the whirling dust.<br>"  
    }  
    else{  
      tempString = "The enemy slained, Orpheus prays for the departed spirit as the body crumpled to dust and is swept away.<br>";
      milestone.push("killed" + capitalize(enemy.name));  
      enemy.status = "dead";   
      //remove(currentRoom.npcs, enemy);
    }
  }         
  if(orpheus.hp <= 0){
    orpheus.status = "dead";
    orpheus.hp = 0;
    textarea.innerHTML += tempString;
    tempString = "";  
    textarea.innerHTML += "<span style='color: " + orpheus.textColor + ";'>[" + capitalize(orpheus.name) + "]</span>&ensp;I am sorry Eurydice! I will soon accompany you in Elysium!<br>"
    gameOverText("battle");  
  }
            
  // Enemy attacks 
  if(enemy.status == "hostile" && orpheus.status == "alive"){  
    var chosenAttack = enemy.attacks[Math.floor(Math.random()*enemy.attacks.length)];  
    //console.log(chosenAttack)
    tempString += chosenAttack.text.initiation;
        
    if(chosenAttack.whoRollDice == "enemy"){  
      var hitRoll = Math.floor(Math.random()*20)+1;
      tempString += "&ensp;(" + hitRoll + ")<br>";
      if(hitRoll == 20){
        tempString += chosenAttack.text.criticalHit + "<br>"; 
        if(typeof chosenAttack.damage == "string"){  
          var damageRoll = Number(chosenAttack.damage.replace("d", ""));  
        } 
        else {  
          var damageRoll = chosenAttack.damage;  
        }
        tempString += "Orpheus takes " + damageRoll + " damages.<br>";  
        orpheus.hp -= damageRoll;  
      }  
      else if(hitRoll == 1){
        tempString += chosenAttack.text.criticalFailure + "<br>";  
        tempString += capitalize(enemy.name) + " takes 1 damage.<br>";  
        enemy.hp -= 1;  
      }  
      else if(hitRoll >= orpheus.ac){
        tempString += chosenAttack.text.hit;
        if(typeof chosenAttack.damage == "string"){  
          var damageRoll = Math.floor(Math.random()*Number(chosenAttack.damage.replace("d", "")))+1;  
        } 
        else {  
          var damageRoll = chosenAttack.damage;  
        }
        orpheus.hp -= damageRoll;  
        tempString += "&ensp;(" + damageRoll + ")<br>";
        tempString += "The wound costed Orpheus " + damageRoll + " precious hit points.<br>";
      }  
      else {
        tempString += chosenAttack.text.miss + "<br>";
      }
    }
              
    else if(chosenAttack.whoRollDice == "Orpheus"){  
      var savingRoll = Math.floor(Math.random()*20)+1;
      tempString += " Roll Orpheus's saving throw.&ensp;(" + savingRoll + ")<br>";
               
      if(savingRoll >= chosenAttack.DC){
        tempString += chosenAttack.text.miss + "<br>";
      }  
      else {
        if(typeof chosenAttack.damage == "string"){  
          var damageRoll = Math.floor(Math.random()*Number(chosenAttack.damage.replace("d", "")))+1; 
        } 
        else {  
          var damageRoll = chosenAttack.damage;  
        }
        orpheus.hp -= damageRoll;  
        tempString += chosenAttack.text.hit;
        tempString += "&ensp;(" + damageRoll + ")<br>";
        tempString += "The attack costed Orpheus " + damageRoll + " precious hit points.<br>";
      }
    }
        
    if(enemy.hp <= 0){
      textarea.innerHTML += tempString;
      enemy.status = "defeated";  
      enemy.talk("defeated");    
      if(enemy.respawn != null){
        enemy.hp = enemy.respawn;
        tempString = "The necromantic power of Hades respawned " + capitalize(enemy.name) + " from the whirling dust.<br>"  
      }  
      else{  
        tempString = "The enemy slained, Orpheus prays for the departed spirit as the body crumpled to dust and is swept away.<br>";
        milestone.push("killed" + capitalize(enemy.name));  
        enemy.status = "dead";   
        //remove(currentRoom.npcs, enemy);
      }
    }         
    if(orpheus.hp <= 0){
      orpheus.status = "dead";
      orpheus.hp = 0;
      textarea.innerHTML += tempString;
      tempString = "";  
      textarea.innerHTML += "<span style='color: " + orpheus.textColor + ";'>[" + capitalize(orpheus.name) + "]</span>&ensp;I am sorry Eurydice! I will soon arrives to where you are!<br>"
      gameOverText("battle");  
    }
  }    
  textarea.innerHTML += tempString;
  showStatus();  
  
}

function restart(){
  rooms = [];  
  chest = [];
  explored = {};  
  milestone = [];
  var orpheus = { 
    name: "orpheus",
    textColor: "#8DB600",
    hp: 100,
    ac: 12, 
    status: "alive",
    attacks: {},
    addAttack: function(name, attack){
      this.attacks[name] = attack;
    }, 
  };
  orpheus.addAttack("fist", new Attack(orpheus, "fist", "orpheus", 10, "d4", "Orpheus clenchs his fist and charges at", "It is a critical hit! The fist bruised the astonished foe.", "It is a critical failure! Orpheus sprained his arm in attempt to land a devastating punch.", "By sheer luck, the fist misses it marks. The enemy grins, the counterattack begins.", "The fist strucks its mark."));
  orpheus.addAttack("rock", new Attack(orpheus, "rock", "orpheus", 10, "d8", "Orpheus grips his obsidian rock and charges at", "It is a critical hit! The rock bruised the astonished foe.", "It is a critical failure! Orpheus stumbled and smacked himself with the rock.", "By sheer luck, the rock misses it marks. The enemy grins, the counterattack begins.", "The rock strucks its mark."));
  orpheus.addAttack("sword", new Attack(orpheus, "sword", "orpheus", 10, "d20", "Orpheus grips his sword and charges at", "It is a critical hit! The gleaming blade sliced the astonished foe.", "It is a critical failure! Orpheus stumbled on a conveniently placed rock and stubbed his toe.", "By sheer luck, the sword misses it marks. The enemy grins, the counterattack begins.", "The blade strucks its mark."));

  masterQuestion = "";
  textarea.innerHTML = "";
  
  makeRooms();
  currentRoom = rooms[0];
  gameBackground();
  currentRoom.showLocationName();
  currentRoom.showDescription();
  currentRoom.showThings(); 
  currentRoom.showExits(); 
  showStatus();
  showInventory();  
  //scrollSmoothToTop();  
}

function gameOverText(cause){
  if (cause == "battle") {
      
  } 
  else if (cause == "pomegrante") {
      
  } 
  else if (cause == "river") {
      
  } 
  else if (cause == "cave") {
      
  } 
  else if (cause == "lostEurydice") {
      
  } 
  else if (cause == "finishedGame") {
      
  } 
  textarea.innerHTML += "<br><center><span style='color: white; text-shadow: -3px 3px black; font-size: 48px; font-family: Italianno;'>The End</span></center>";  
    
}
