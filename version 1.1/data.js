// Each item and npc should have its own variable then, be added to the room later. This is to make it easily malleable elsewhere.
// The attack system should be arranged to make more function.
// Talk should have its own function to display text; this is useful because it can be called by the talk command, but also called manually by the coder.

var rooms = []; // index of rooms
var things = {}; // index of things
var npcs = {}; // index of npcs

var lyre;

var textarea = document.getElementById("adventuretext");
var chestText = document.getElementById("chesttext");
var statusText = document.getElementById("statustext");
var userCommand = document.getElementById("usercommand");

var currentRoom; // player's location
var chest = []; // inventory
var explored = {}; // index of explored locations
var milestone = []; // index of milestones

var commandHistory = [""]; // remember player inputs
var currentCommand = 0;

var masterQuestion = ""; // use for questions that require player's input

// define Orpheus
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

// list of attacks for Orpheus: fist, rock, sword
orpheus.addAttack("fist", new Attack(orpheus, "fist", "orpheus", 10, "d4", "Orpheus clenchs his fist and charges at", "It is a critical hit! The fist bruised the astonished foe.", "It is a critical failure! Orpheus sprained his arm in attempt to land a devastating punch.", "By sheer luck, the fist misses it marks. The enemy grins, the counterattack begins.", "The fist strucks its mark."));
orpheus.addAttack("rock", new Attack(orpheus, "rock", "orpheus", 10, "d8", "Orpheus grips his obsidian rock and charges at", "It is a critical hit! The rock bruised the astonished foe.", "It is a critical failure! Orpheus stumbled and smacked himself with the rock.", "By sheer luck, the rock misses it marks. The enemy grins, the counterattack begins.", "The rock strucks its mark."));
orpheus.addAttack("sword", new Attack(orpheus, "sword", "orpheus", 10, "d20", "Orpheus grips his sword and charges at", "It is a critical hit! The gleaming blade sliced the astonished foe.", "It is a critical failure! Orpheus stumbled on a conveniently placed rock and stubbed his toe.", "By sheer luck, the sword misses it marks. The enemy grins, the counterattack begins.", "The blade strucks its mark."));

function makeThings(){
    
// Charon //    -------------------------------------------------------------------------------
    
  things["charon"] = new Thing(null, "charon", "He is the ferryman of the Styx. Charon is a loyal servant of Hades, though he does have a weakness for money. Currently, he is busy paddling away with a boatload of souls jumping to reach the afterlife.", 1, false);    
    
    
// Coin //    -------------------------------------------------------------------------------
    
  things["coin"] = new Thing(null, "coin", "It is a golden drachma, the staple currency of classical Greece. People were buried with a coin to paid Charon for the ferry's fare.", "infinity", true);
  var coin = things["coin"];
    coin.addUsage(new Usage(coin, "any", "Orpheus flips the coin. It lands on its side."));
      coin.usages[coin.usages.length-1].specialEffect = function(){
        if(Math.floor(Math.random()*2)+1 == 0){
          this.use = "Orpheus flips the coin. It is head.";  
        }  
        else{
          this.use = "Orpheus flips the coin. It is tail.";  
        }  
      };
  coin = null;

    
// Dice //    -------------------------------------------------------------------------------
    
  things["dice"] = new Thing(null, "dice", "It is a 20-sided dice of polished bone. It exudes an eerie vibe.", "infinity", true);
  var dice = things["dice"];
    dice.takeQuestion = new Question(dice, "narrator", "#FF7518", "The dice was cursed! Orpheus feels an insatiable desire to turn around and take his beloved by the hand.<br>Make a charisma saving throw with 'roll dice'.", "Fight against the curse of being sidetracked Orpheus!");
    var currentQuestion = dice.takeQuestion;
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "roll dice", "")); 
      currentQuestion.responses[currentQuestion.responses.length-1].specialEffect = function(){
        var savingRoll = Math.floor(Math.random()*20)+1;  
        var tempString = textarea.innerHTML;  
        var wordLocation = tempString.lastIndexOf("<br>");
        //console.log(wordLocation)
        tempString = tempString.slice(0, wordLocation) + tempString.slice(wordLocation).replace("<br>", "");
        //console.log(tempString);  
        tempString += "&ensp;(" + savingRoll + ")<br>";
        if(savingRoll >= 12){   
          tempString += "Orpheus exorcises the the curse with his willpower. As it dissipates into nothingness, Orpheus resumes his tread up to the promised land, Eurydice behind him.<br>"; 
          textarea.innerHTML = tempString;
        }
        else{
          for(var i=0, length=milestone.length; i<length; i++){
            if(milestone[i] == "retreivedEurydice"){
              milestone.splice(i, 1);
              i=length;  
            }  
          }
          remove(chest, things["spirit"]);
          showInventory();  
          orpheus.status = "dead";  
          milestone.push("lostEurydice");
          tempString += "The curse triumphed. Orpheus's last glimpse of his beloved Eurydice was a face twisted by horror and surpise. She dissipates and is no more. Saddened by this turns of event, Orpheus wepts as he treads alone vowing to be reunited by death.<br>";  
          gameOverText("lostEurydice");
          textarea.innerHTML = tempString; 
          gameOverText("lostEurydice"); 
        }    
      }
    dice.addUsage(new Usage(dice, "any", "Orpheus rolls the dice. It is " + (Math.floor(Math.random()*20)+1) + "."));
      dice.usages[dice.usages.length-1].specialEffect = function(){ 
        this.use = "Orpheus rolls the dice. It is " + (Math.floor(Math.random()*20)+1) + "."; 
      };
  dice = null;
    

// Lyre //    -------------------------------------------------------------------------------
    
  things["lyre"] = new Thing(null, "lyre", "It is a beautiful golden lyre given by Apollo to him. It had been a dear friend and his sole source of solace during this painful time. Because of his musical skill, Orpheus cans charm anyone: living, dead, or inanimated.", "infinity", true);
  var lyre = things["lyre"];  
    lyre.addUsage(new Usage(lyre, "The Main Gate", "Orpheus orchestrates a single sorrowful tune. It awes the observers. Cerberus howled along before settling down."));
      lyre.usages[lyre.usages.length-1].specialEffect = function(){
        for(var x of currentRoom.npcs){
          var diceRoll = Math.floor(Math.random()*20);  
          if(x.status == "neutral" || (x.status == "hostile" && diceRoll >= x.charmDC)){
            x.status = "friendly";
            textarea.innerHTML += capitalize(x.name) + " becomes friendly.<br>";  
            var newMilestone = "charmed" + capitalize(x.name);  
            var milestonefound = false;  
            for(var x of milestone){
              if(x == newMilestone){
                milestonefound = true;  
              }  
            }
            if(!milestonefound){
              milestone.push(newMilestone);  
            }  
          }
          else if(x.status == "hostile" && diceRoll < x.charmDC){
            textarea.innerHTML += capitalize(x.name) + " remains hostile.<br>"; 
          }  
        }  
      };
    lyre.addUsage(new Usage(lyre, "Training Ground", "Orpheus plays a short, but beautiful tune; however, the screeching symphony of the warriors drowns his lonely tune."));
    lyre.addUsage(new Usage(lyre, "The Field of Asphodel", "Orpheus plays a short, but beautiful tune. The gazes of a million absent-minded souls settled on him. Orpheus increases his pace slightly."));
      lyre.usages[lyre.usages.length-1].specialEffect = function(){
        for(var x of currentRoom.npcs){
          var diceRoll = Math.floor(Math.random()*20);  
          if(x.status == "neutral" || (x.status == "hostile" && diceRoll >= x.charmDC)){
            x.status = "friendly";
            textarea.innerHTML += capitalize(x.name) + " becomes friendly.<br>";
            var newMilestone = "charmed" + capitalize(x.name);  
            var milestonefound = false;  
            for(var x of milestone){
              if(x == newMilestone){
                milestonefound = true;  
              }  
            }
            if(!milestonefound){
              milestone.push(newMilestone);  
            }
          }  
          else if(x.status == "hostile" && diceRoll < x.charmDC){
            textarea.innerHTML += capitalize(x.name) + " remains hostile.<br>"; 
          }  
        }  
      };  
    lyre.addUsage(new Usage(lyre, "Hades's Palace", "Orpheus pours his heart, his soul, and his pain into a single sorrowful tune. It overwhelms the atmosphere. Although the gloomy god misted his eyes, his wife is a living fountains of tears."));
      lyre.usages[lyre.usages.length-1].specialEffect = function(){
        for(var x of currentRoom.npcs){
          var diceRoll = Math.floor(Math.random()*20);  
          if(x.status == "neutral" || (x.status == "hostile" && diceRoll >= x.charmDC)){
            x.status = "friendly";
            textarea.innerHTML += capitalize(x.name) + " becomes friendly.<br>";
            var newMilestone = "charmed" + capitalize(x.name);  
            var milestonefound = false;  
            for(var x of milestone){
              if(x == newMilestone){
                milestonefound = true;  
              }  
            }
            if(!milestonefound){
              milestone.push(newMilestone);  
            }  
          }  
          else if(x.status == "hostile" && diceRoll < x.charmDC){
            textarea.innerHTML += capitalize(x.name) + " remains hostile.<br>"; 
          }  
        }  
      };
    lyre.addUsage(new Usage(lyre, "Overworld's Tunnel", "Orpheus pours his heart and soul into a single joyous tune. He swells with pride knowing that Eurydice is in the audience."));
      lyre.usages[lyre.usages.length-1].specialEffect = function(){
        for(var x of currentRoom.npcs){
          var diceRoll = Math.floor(Math.random()*20);  
          if(x.status == "neutral" || (x.status == "hostile" && diceRoll >= x.charmDC)){
            x.status = "friendly";
            textarea.innerHTML += capitalize(x.name) + " becomes friendly.<br>";
            var newMilestone = "charmed" + capitalize(x.name);  
            var milestonefound = false;  
            for(var x of milestone){
              if(x == newMilestone){
                milestonefound = true;  
              }  
            }
            if(!milestonefound){
              milestone.push(newMilestone);  
            }  
          }  
          else if(x.status == "hostile" && diceRoll < x.charmDC){
            textarea.innerHTML += capitalize(x.name) + " remains hostile.<br>"; 
          }  
        }  
      };
    lyre.addUsage(new Usage(lyre, "any", "Orpheus plays a short, but beautiful tune. It awes all the onlooking observers to tears."));
      lyre.usages[lyre.usages.length-1].specialEffect = function(){
        for(var x of currentRoom.npcs){
          var diceRoll = Math.floor(Math.random()*20);  
          if(x.status == "neutral" || (x.status == "hostile" && diceRoll >= x.charmDC)){
            x.status = "friendly";
            textarea.innerHTML += capitalize(x.name) + " becomes friendly.<br>"; 
            var newMilestone = "charmed" + capitalize(x.name);  
            var milestonefound = false;  
            for(var x of milestone){
              if(x == newMilestone){
                milestonefound = true;  
              }  
            }
            if(!milestonefound){
              milestone.push(newMilestone);  
            }
          }  
          else if(x.status == "hostile" && diceRoll < x.charmDC){
            textarea.innerHTML += capitalize(x.name) + " remains hostile.<br>"; 
          }  
        }  
      };
  chest.push(lyre);
  lyre = null;  

  
// Pomegranate //    -------------------------------------------------------------------------------
    
  things["pomegranate"] = new Thing(null, "pomegranate", "It is a ripe and juicy pomegranate. The fruit is purple and seedy.", 1, false);
  var pomegranate = things["pomegranate"];
    pomegranate.addUsage(new Usage(pomegranate, "any", "Orpheus greedily inhaled the tempting fruit. It tasted sweet; however, Orpheus feels the same as before. Was the tale false?"));
      pomegranate.usages[pomegranate.usages.length-1].specialEffect = function(){    
        for(var i=0, length=milestone.length; i<length; i++){
          if(milestone[i] == "atePomegrante"){
            milestone.splice(i, 1);
            i -= 1;
            length -=1;  
          }  
        }  
        milestone.push("atePomegrante");  
        orpheus.hp += 10;
        if(orpheus.hp > 100){
          orpheus.hp = 100;  
        }
        showStatus();  
      };
  pomegranate = null;

    
// Rock //    -------------------------------------------------------------------------------

  things["rock"] = new Thing(null, "rock", "It is a plain obsidian rock. It feels cool when touched.", "infinity", true);
  var rock = things["rock"];
    rock.addUsage(new Usage(rock, "any", "Orpheus juggles the rock with his swift hand. Up and up it goes again."));
  rock = null;
    

// Spirit //    -------------------------------------------------------------------------------
    
  things["spirit"] = new Thing(null, "spirit", "It is the spirit of Eurydice! Orpheus is overcomed by joy and grief! It greatly sadden him that he could not look at his Eurydice right now.", "infinity", false);
  var spirit = things["spirit"];
    spirit.addUsage(new Usage(spirit, "any", "Orpheus daydreams about his future with Eurydice. His vitality is restored!"));
      spirit.usages[spirit.usages.length-1].specialEffect = function(){
        orpheus.hp = 100;  
        showStatus();  
      };
  spirit = null;

    
// Sword //    -------------------------------------------------------------------------------
    
  things["sword"] = new Thing(null, "sword", "It is a gilded obsidian sword. It is cold, but well-balanced for Orpheus's strong physique.", "infinity", true);
  var sword = things["sword"];
    sword.addUsage(new Usage(sword, "Training Ground", "Orpheus sheaths and unsheath his sword. He silently prays to Hades, gratified by the gift."));
    sword.addUsage(new Usage(sword, "Hades's Palace", "Orpheus tries to unsheathes his sword. Hades gazes intently at his left hand. On further re-evaluation, Orpheus let go of the sword."));
    sword.addUsage(new Usage(sword, "any", "Orpheus swings his mighty sword purposely. Pleased by his strokes, Orpheus sheathes the obsidian blade."));
  sword = null;
}

function makeNpcs(){

// Cave //    -------------------------------------------------------------------------------
    
    npcs["cave"] = new Npc(null, "cave", null, "#C2B280", 1000, 0, 0, "neutral");
      var cave = npcs["cave"];
      cave.respawn = {hp: 1000, text: "The cave collapsed, but its pull does not end. The rapid collisions from attracted debris create an improvised cave.<br>", };
    
      cave.description = new Question(cave, "narrator", "#FF7518", "Tartarus echoes the pains of its prisoners. Orpheus fights against the gravitational force that seems to pull him closer to prison.<br>Do you want to enter Tartarus?", "Please answers the question.");
        var currentQuestion = cave.description;
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus steps purposely into the cave before the floor abruptly shattered beneath his dangling feet. By the combined power of gravity and time, Orpheus reaches terminal velocity before crashing head first into the concrete and was prickled by the stalagmites that dotted the entire landscape. The chance of returning dismal, Orpheus grew conscious of the blackhole that is his stomach. Looking around, Orpheus sees only rocks, darkness, and a river of burning fire."));
        var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
        currentResponse.specialEffect = function(){
          orpheus.hp = -1;
          orpheus.status = "dead";  
          showStatus(); 
          gameOverText("cave");  
        }
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and backed away from the cave."));
      cave.addDialogue(new Dialogue(cave, "...", new Question(cave.dialogue, "narrator", "#FF7518", "Do you want to enter Tartarus?", "Please answers the question."), "...", "...", "...", "... [for some odd reason, Tartarus expelled the item]"));
        var currentQuestion = cave.dialogue.hostile;
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus steps purposely into the cave before the floor abruptly shattered beneath his dangling feet. By the combined power of gravity and time, Orpheus reaches terminal velocity before crashing head first into the concrete and was prickled by the stalagmites that dotted the entire landscape. The chance of returning dismal, Orpheus grew conscious of the blackhole that is his stomach. Looking around, Orpheus sees only rocks, darkness, and a river of burning fire."));
          var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
          currentResponse.specialEffect = function(){
            orpheus.hp = -1;
            orpheus.status = "dead";  
            showStatus(); 
            gameOverText("cave");  
          }
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and backed away from the cave."));      
      cave.addAttack(new Attack(cave, "attract", "enemy", "userAC", 0, "The cave attempts to draw Orpheus closer to the entrance.", "The attack launched Orpheus forward.", "The cave pushed a little harder than ususal A nearby rock smacked it in the canopy.", "The attack misses.", "Orpheus is damaged."));
      
      cave.addResponseToGifts(new ResponseToGift(cave, "rock", "..!", false, true));
        cave.responseToGifts[cave.responseToGifts.length-1].specialEffect = function(){  
          textarea.innerHTML += "The rock was sucked into the cave. Orpheus wonders where it went.<br>"  
        };
      cave.addResponseToGifts(new ResponseToGift(cave, "pomegranate", "..!", false, true));
        cave.responseToGifts[cave.responseToGifts.length-1].specialEffect = function(){  
          textarea.innerHTML += "The pomegranate was sucked into the cave. Orpheus wonders where it went.<br>"  
        };
      cave.addResponseToMilestones(new ResponseToMilestone(cave, "retreivedEurydice", "... [the gravitational force seems to tug at an existence behind Orpheus]", false));
  cave = null;
    
    
// Cerberus //    -------------------------------------------------------------------------------
    
  npcs["cerberus"] = new Npc(null, "cerberus", "It is a a colossal three-headed dog with black fur and a very large red tongue. The souls are struggling to pass around the massive beast.", "#C9A0DC", 50, 10, 6, "hostile");
  var cerberus = npcs["cerberus"];
    cerberus.deadEffect = function(){
      things["lyre"].usages[0].use = "Orpheus orchestrates a single sorrowful tune. It awes the observers.";
    };
    cerberus.addDialogue(new Dialogue(cerberus, "Ggrrrrr.", "Grrrrroowllll!!!", "Grr.. [Cerberus looks excited]", "Grrrrooowl....", "...", "Gr... [Cerberus is shaking his head]"));
    cerberus.addAttack(new Attack(cerberus, "bite", "enemy", "userAC", "d20", "Ceberus attempts to bite Orpheus.", "The attack slaughtered Orpheus.", "Cerberus stumbled trying to approach Orpheus. A few souls were caught in the aftermath.", "The attack misses.", "Orpheus is damaged."));
    cerberus.addAttack(new Attack(cerberus, "slash", "enemy", "userAC", "d20", "Ceberus attempts to swipe Orpheus with his paw.", "The attack sends Orpheus flying.", "A soul accidentally trips Cerberus to get to the Field of Asphodel.", "The attack misses.", "Orpheus is damaged."));
      
    cerberus.addResponseToGifts(new ResponseToGift(cerberus, "rock", "Grrowwll!!! [Cerberus's enthusiasm is overflowing]", false, true));
      cerberus.responseToGifts[cerberus.responseToGifts.length-1].specialEffect = function(){
        if(this.pathToParent.status == "friendly"){
          textarea.innerHTML += capitalize(this.pathToParent.name) + " is friendly.<br>";
        }
        else{
          textarea.innerHTML += capitalize(this.pathToParent.name) + " becomes friendly.<br>";
        }
        this.pathToParent.status = "friendly";
        milestone.push("charmedCerberus");  
        this.pathToParent.description = "Cerberus is playing with his rock. He seems happy to smell Orpheus.";  
      };
    cerberus.addResponseToMilestones(new ResponseToMilestone(cerberus, "retreivedEurydice", "Grrr.. [Cerberus seems to be looking at something behind Orpheus]", false));
  cerberus = null;
    

// Hades //    -------------------------------------------------------------------------------
    
  npcs["hades"] = new Npc(null, "hades", "As a god, Hades cans assume any form he desires. Currently, he is mid-aged man with dark hair, dark eyes, and dark skin. He exudes a gloomy atmosphere. Not much had happens in the Underworld to pique his interest.", "#B57EDC", 100, 12, 10, "neutral");
  var hades = npcs["hades"];
    hades.respawn = {hp: 100, text: "Although Hades seemed to be bleeding golden ichor, it faded away by a motion of Hades's hand. The illusion was dismissed.<br>", };
    
    hades.addDialogue(new Dialogue(hades, "Mortal, what do you seek?", "Insolence! You wishes to draw your blade against me?", "Remember your oath. Do not return!", "You made the wrong enemy Orpheus. A god cannot be felled by mortal hands.", "Quiet!", "I do not need this offering."));      
    hades.addAttack(new Attack(hades, "finger of death", "enemy", "userAC", "d50", "Hades gazes intensely at Orpheus.", "The attack assulted Orpheus.", "Hades gots dry eyes. He needs to rest them more often.", "The attack mgisses.", "Orpheus is damaged."));
    hades.addResponseToGifts(new ResponseToGift(hades, "pomegranate", "Orpheus, do you understand what you are holding in your hands?", true, false));
    hades.addResponseToMilestones(new ResponseToMilestone(hades, "charmedPersephone&&killedCerberus&&atePomegrante", "Orpheus! You enters my domain, kills my servants, and now demands my favor? Persephone had pleaded in your stead, but that is not enough. It is against the law of gods to temper with the dead. You will only recover your beloved under one condition: do not acknowledge her until you leave the Underworld, though she will accompany you along the way. Now, leave.", false));
      hades.responseToMilestones[hades.responseToMilestones.length-1].specialEffect = function(){  
        for(var i=0, length=milestone.length; i<length; i++){
          if(milestone[i] == "charmedHades"){
            milestone.splice(i, 1);
            i -= 1;
            length -= 1;
          }  
        }
        this.pathToParent.responseToMilestones = [];
        milestone.push("retreivedEurydice");  
        chest.push(things["spirit"]);  
        showInventory();
        milestone.push("angeredHades");  
        rooms[7].npcs[1].responseToMilestones = [];    
      };
    hades.addResponseToMilestones(new ResponseToMilestone(hades, "charmedPersephone&&killedCerberus", "Orpheus! You enters my domain, kills my servants, and now demands my favor? Persephone had pleaded in your stead, but that is not enough. It is against the law of gods to temper with the dead. You had send yourself on a fool's errand. Now, escorts yourself back. The Underworld shall not be swayed by one so arrogant.", false));
      hades.responseToMilestones[hades.responseToMilestones.length-1].specialEffect = function(){  
        for(var i=0, length=milestone.length; i<length; i++){
          if(milestone[i] == "charmedHades"){
            milestone.splice(i, 1);
            i -= 1;
            length -= 1;
          }  
        }
        this.pathToParent.responseToMilestones = [];  
        milestone.push("angeredHades");  
        rooms[7].npcs[1].responseToMilestones = [];  
      };
    
    hades.addResponseToMilestones(new ResponseToMilestone(hades, "charmedPersephone", "Sigh, Persephone had personally requested the release of Eurydice for your sake. Cherish it well for such an occasion shall not occur again. In exchange, you must swear before me to not look at Eurydice until both of you exit the Underworld. Farewell, Orpheus.", false));
      hades.responseToMilestones[hades.responseToMilestones.length-1].specialEffect = function(){
        milestone.push("retreivedEurydice");  
        chest.push(things["spirit"]);  
        showInventory();  
        this.pathToParent.responseToMilestones = [];
        rooms[7].npcs[1].responseToMilestones = [];  
        setTimeout(function(){
          rooms[7].npcs[0].addResponseToMilestones(cerberusSurvival); 
        }, 1000);
      };
    var cerberusSurvival = new ResponseToMilestone(hades, "killedCerberus", "Orpheus! I pitied you and granted you your desire, but you chose to mock me and kill my servants? You have nerves to return to me. An eye for an eye. What you took from me, I shall take from you. To atone for your crime, you shall be a dog. And a dog you shall be forevermore!", false);
      cerberusSurvival.specialEffect = function(){
        orpheus.hp = 100;
        orpheus.status = "dead";  
        showStatus(); 
        textarea.innerHTML += "The world went black. A sudden motion, barely recognizable as Hades's, grasps Orpheus by the head. Though he squirmed and struck with his arms, Orpheus cannot escape the frigidly tight palm. In a trance from close-suffocation, Orpheus experiences a massive growth, transforming into a quadrupedal colossus. His mind clouds with instincts as he struggles to retain his identity. Ferocity triumphs. The dog that was Orpheus shooks and growls, though it, too, fall unconscious. Dragged away by Hades, it was chained to a mighty gate by the field of poplar trees.<br>"; 
        textarea.innerHTML += characterDialogue(capitalize(orpheus.name), orpheus.textColor, "Grrowwl!");
        gameOverText("transformation");  
      };
  hades = null;
    

// Persephone //    -------------------------------------------------------------------------------

  npcs["persephone"] = new Npc(null, "persephone", "As a goddess, Persephone cans assume any form she desires. Currently, she is mid-aged woman with black hair, olive eyes, and stunnningly white skin.", "#f5deb3", 100, 12, 10, "neutral");
  var persephone = npcs["persephone"];
    persephone.respawn = {hp: 100, text: "Persephone sparkles with energy. It is a final attack! Orpheus closed his eyes due to the intensity. He is undamaged, but Persephone glows with health as if his struggle was a pre-meal warm-up exercise.<br>", };
    
    persephone.addDialogue(new Dialogue(persephone, "Mortal, why have you descended to this dreary place?", "How pathetic!", "Remember your oath Orpheus.", "You made the wrong enemy Orpheus. I alone can persuade Hades!", "Tone it down!", "I do not need this offering."));      
    persephone.addAttack(new Attack(persephone, "slap", "enemy", "userAC", "d50", "Persephone reaches out to slap Orpheus.", "The attack hurls Orpheus across the room.", "Persephone misjudges her force and overstepped Orpheus. She almost went sprawling on the floor, but save herself with godly grace.", "The attack misses.", "Orpheus is damaged."));
    persephone.addResponseToGifts(new ResponseToGift(persephone, "pomegranate", "Orpheus, do you understand what you are holding in your hands? Do not meet the same fate as I!", true, false));
    persephone.addResponseToMilestones(new ResponseToMilestone(persephone, "charmedPersephone", "Do not worry sweet Orpheus, I shall convince Hades in your stead; however, the laws of the Underworld must be obeyed. You shall not see her until both of you resurfaced.", false));
  persephone = null;
    

// River //    -------------------------------------------------------------------------------
    
  npcs["river"] = new Npc(null, "river", null, "#C2B280", 1000, 0, 0, "neutral");
  var river = npcs["river"];
    river.respawn = {hp: 1000, text: "Orpheus opens a chasm beneath the river, but it was soon patch up by sediment deposits.<br>", };
    
    river.description = new Question(river, "narrator", "#FF7518", "The River of Styx is running on its usual course - around the Underworld. Although it is a great natural landmark, the temptation to take a refreshing swim is suicidal.<br>Do you like to take a refreshing swim?", "Please answers the question.")
      var currentQuestion = river.description;
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus paddles into the river. Almost immediately, a million needles tingles his pain receptors, but the gods were on his side. Orpheus was blessed by a quick death and reunited with Eurydice."));
        var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
        currentResponse.specialEffect = function(){
          orpheus.hp = 0;
          orpheus.status = "dead";  
          showStatus(); 
          gameOverText("river");  
        }
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and did not swim in the river."));      
    river.addDialogue(new Dialogue(river, "...", new Question(river.dialogue, "narrator", "#FF7518", "Do you like to take a refreshing swim?", "Please answers the question."), "...", "...", "...", "... [the dropped item was washed ashore]"));
      var currentQuestion = river.dialogue.hostile;
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus dives into the river. Almost immediately, a million needles tingles his pain receptors, but the gods were on his side. Orpheus was blessed by a quick death and reunited with Eurydice in Elysium."));
        var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
        currentResponse.specialEffect = function(){
          orpheus.hp = 0;
          orpheus.status = "dead";  
          showStatus(); 
          gameOverText("river");  
        }
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and did not waddle into the river."));      
    river.addAttack(new Attack(river, "splash", "enemy", "userAC", 0, "The river splashes around on its normal course.", "The attack crippled Orpheus.", "The river splashes a little further than ususal.", "The attack misses.", "Orpheus is damaged."));
      
    river.addResponseToGifts(new ResponseToGift(river, "coin", "..!", false, true));
      river.responseToGifts[river.responseToGifts.length-1].specialEffect = function(){
        if(this.pathToParent.status == "friendly"){
          textarea.innerHTML += capitalize(this.pathToParent.name) + " is friendly.<br>";
        }
        else{
          textarea.innerHTML += capitalize(this.pathToParent.name) + " becomes friendly.<br>";
        }
        this.pathToParent.status = "friendly";  
        textarea.innerHTML += "The coin made ripples before sinking beneath the current. In the distance, Charon seemingly paddles a knot faster as he eyes the dropped drachma greedily.<br>"  
      };
    river.addResponseToGifts(new ResponseToGift(river, "rock", "..!", false, true));
      river.responseToGifts[river.responseToGifts.length-1].specialEffect = function(){
        if(this.pathToParent.status == "hostile"){
          textarea.innerHTML += capitalize(this.pathToParent.name) + " is hostile.<br>";
        }
        else{
          textarea.innerHTML += capitalize(this.pathToParent.name) + " becomes hostile.<br>";
        }
        this.pathToParent.status = "hostile";  
        textarea.innerHTML += "The rock made a big splash before sinking beneath the current. For some reason, the splash was mesmeric to watch.<br>"  
      };
    river.addResponseToGifts(new ResponseToGift(river, "pomegranate", "..!", true, false));
      river.responseToGifts[river.responseToGifts.length-1].specialEffect = function(){  
        textarea.innerHTML += "The pomegranate bloated on the surface and was washed ashore.<br>"  
      };
    river.addResponseToMilestones(new ResponseToMilestone(river, "retreivedEurydice", "... [a womanly shape seemed to be mirrored in the water]", false));
  river = null;  

// Skeleton //    -------------------------------------------------------------------------------
    
  npcs["skeleton"] =new Npc(null, "skeleton", "He is a living human corpse. Adorned with mail armor the skeleton is doing image training by himself. Where is his partner?", "#D9D6CF", 10, 12, 7, "neutral");
  var skeleton = npcs["skeleton"];
    skeleton.addDialogue(new Dialogue(skeleton, "... [the skeleton takes a fighting stance]", "... [the skeleton looks ready to return the next blow]", "... [the skeleton takes a fighting stance]", "..! [the skeleton grins]", "...", "... [the skeleton shakes his head slowly once]"));
    skeleton.addAttack(new Attack(skeleton, "slash", "enemy", "userAC", "d20", "The skeleton attempts to slash Orpheus with his sword.", "The attack devastated Orpheus.", "The skeleton was struck accidentally by a nearby colleague.", "The attack misses.", "Orpheus is damaged."));
    skeleton.respawn = {hp: 10, text: "The necromantic power of Hades respawned Skeleton from the whirling dust.<br>", };
      
    skeleton.addResponseToGifts(new ResponseToGift(skeleton, "sword", "... [the skeleton draws his own blade]", true, false));
    skeleton.addResponseToGifts(new ResponseToGift(skeleton, "pomegranate", "... [out of courtesy, the skeleton ate the pomegranate]", true, false));
      skeleton.responseToGifts[skeleton.responseToGifts.length-1].specialEffect = function(){  
        textarea.innerHTML += "Because the skeleton is hollow, it passed harmlessly through and down to the black earth. The skeleton grins, feigning ignorance.<br>";  
      };
    skeleton.addResponseToMilestones(new ResponseToMilestone(skeleton, "retreivedEurydice", "... [the skeleton gazes at a spot behind Orpheus]", false));
  skeleton = null;  
    
    
// Soul //    -------------------------------------------------------------------------------
    
  npcs["soul"] = new Npc(null, "soul", "He seems to have been middle-aged man on his death day. Was he assigned to valet duty by the judges?", "#D9D6CF", 10, 8, 4, "neutral");
  var soul = npcs["soul"];
    soul.addDialogue(new Dialogue(soul, "Welcome to the Underworld.", "<span style='font-size: 10px;'>Calm Howard. Do not be provoked.</span> Begone enemy of the gods!", new Question(soul.dialogue, soul.name, soul.textColor, "Do you like taking pointless detours on quests?", "Please refrain from being sidetracked."), "I will returns Orpheus. Your life will be haunted. Bewares of the night.", "You are annoying.", "Thank you, but I do not need this thing."));
      var currentQuestion = soul.dialogue.friendly;
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Go northeast to the river, attack it, then speak with it. Finally, response with yes."));
        currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "That is a shame."));      
        soul.addAttack(new Attack(soul, "life drain", "enemy", "userAC", "d20", "The soul attempts to drain the life force from Orpheus.", "The attack enfeebled Orpheus.", "The soul stumbled trying to approach Orpheus.", "The attack misses.", "Orpheus is damaged.")); 
    soul.addResponseToGifts(new ResponseToGift(soul, "rock", "Thank you kind sir, but a soul cannot entangles with inanimated objects", true, false));
      soul.responseToGifts[soul.responseToGifts.length-1].specialEffect = function(){
        if(this.pathToParent.status == "friendly"){
          textarea.innerHTML += capitalize(this.pathToParent.name) + " is friendly.<br>";
        }
        else{
          textarea.innerHTML += capitalize(this.pathToParent.name) + " becomes friendly.<br>";
        }
        this.pathToParent.status = "friendly";
        milestone.push("charmedSoul");
        this.pathToParent.description = "The busy soul is practicing his greeting lines. He looks happy to see Orpheus.";  
      };
    soul.addResponseToGifts(new ResponseToGift(soul, "coin", "Thank you kind sir, but a soul have no need for currency.", true, false));
      soul.responseToGifts[soul.responseToGifts.length-1].specialEffect = function(){
        if(this.pathToParent.status == "friendly"){
          textarea.innerHTML += capitalize(this.pathToParent.name) + " is friendly.<br>";
        }
        else{
          textarea.innerHTML += capitalize(this.pathToParent.name) + " becomes friendly.<br>";
        }
        this.pathToParent.status = "friendly";
        milestone.push("charmedSoul");
        this.pathToParent.description = "The busy soul is practicing his greeting lines. He looks happy to see Orpheus.";  
      };
    soul.addResponseToMilestones(new ResponseToMilestone(soul, "retreivedEurydice", "You found Eurydice? The gods must truly favored you. Now, return to where you came from. May Hermes, himself, grace you with quick passage.", false));
    soul.addResponseToMilestones(new ResponseToMilestone(soul, "angeredHades", "Why did you angered Hades! You cannot hide from the gods!", true));
  soul = null;
    
    
// Tree //    -------------------------------------------------------------------------------
    
  npcs["tree"] = new Npc(null, "tree", null, "#C2B280", 100, 0, 0, "neutral");      
  var tree = npcs["tree"];
    tree.respawn = {hp: 100, text: "The tree felled, but another one rose to replace its fallen brethen.<br>", };
    
    tree.description = new Question(tree, "narrator", "#FF7518", "The garden rustles with awareness, one branch heavied with pomegranates drifts closer to Orpheus.<br>Do you want to take a pomegranate?", "Please answers the question.")
    var currentQuestion = tree.description;
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus added the pomegranate to his inventory."));
      var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
      currentResponse.specialEffect = function(){
        chest.push(things["pomegranate"]);  
        showInventory();  
      }
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and did not take a pomegranate."));
    tree.addDialogue(new Dialogue(tree, "...", new Question(tree.dialogue, "narrator", "#FF7518", "Do you want to take a pomegranate?", "Please answers the question."), "...", "...", "...", "... [the tree silently slips the item into Orpheus's pocket]"));
    var currentQuestion = tree.dialogue.hostile;
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "yes", "Orpheus added the pomegranate to his inventory."));
      var currentResponse = currentQuestion.responses[currentQuestion.responses.length-1];
        currentResponse.specialEffect = function(){
          chest.push(things["pomegranate"]);  
          showInventory();  
        }
      currentQuestion.addResponse(new QuestionResponse(currentQuestion, "no", "Against his desires, Orpheus sided with his better judgment and did not take a pomegranate."));      
    tree.addAttack(new Attack(tree, "temptation", "enemy", "userAC", 0, "The grove shakes its fruit-laden branches.", "The attack drew Orpheus forward.", "The grove shakes too hard and one branch tears from its root.", "The attack misses.", "Orpheus is damaged."));
      
    tree.addResponseToGifts(new ResponseToGift(tree, "pomegranate", "..!", false, true));
      tree.responseToGifts[tree.responseToGifts.length-1].specialEffect = function(){  
        textarea.innerHTML += "The tree silently slipped the fruit into Orpheus's open pocket. For good measure, it slipped another one in the other to balance the weight.<br>";
        chest.push(things["pomegranate"]);  
        showInventory();    
      };
    tree.addResponseToMilestones(new ResponseToMilestone(tree, "retreivedEurydice", "... [a branch was brushed aside behind Orpheus]", false));
  tree = null;
}

function makeRooms(){
    
// Room[0] //    -------------------------------------------------------------------------------
    
  rooms[0] = new Room("The Underworld", "red", "Orpheus enters a wide chasm settled with crimson diamonds glittering from the high ceiling above. They reflects the numerous torches that brighten the area. A pale soul greeted Orpheus. He resembles a mid-aged man of aristocratic descend. The air is humid signifying a nearby source of water. To the north-east, indeed, Orpheus spots a gushing river. To the north, he noted Cerberus, gatekeeper of the Underworld. Further beyond is a palace of dark obsidian where Hades resides.");  
  var currentRoomCreation = rooms[0];  
    explored["The Underworld"] = true;
    currentRoomCreation.addExit("north", "The Main Gate", "Orpheus sees a big three-headed dog and a large gate. Souls can be seen pouring into the entrance.", null, null);
    currentRoomCreation.addExit("northeast", "The River of Styx", "Orpheus sees a wide river, only one ferryman can be found.", null, null);
    currentRoomCreation.addExit("south", "Overworld's Tunnel", "Orpheus sees a long winding cave upward to the light.", "retreivedEurydice", "Unless Eurydice cans accompany him, Orpheus vowed to not desert his own selfish cause.");
    currentRoomCreation.addExit("northeast", "The River of Styx", "Orpheus sees a wide river, only one ferryman can be found.", null, null);
    
    currentRoomCreation.addThing(things["rock"]);
      things["rock"].pathToParent = currentRoomCreation;
    
    currentRoomCreation.addNpc(npcs["soul"]);
      npcs["soul"].pathToParent = currentRoomCreation;

    
// Room[1] //    -------------------------------------------------------------------------------
  
  rooms[1] = new Room("The Main Gate", "red", "Orpheus stands before a grand entrance. Surrounding it are thick spiked fortifications. Gruesome skulls collected dust at the bottom. Meanwhile, hoards of souls, fresh from their passage across the River of Styx crowd the entrance. They are waiting to cross the Field of Asphodel and be judged by their accomplishments while alive and assigned to one of three afterlives: the Fields of Punishment for the wicked, Elysium for the nobled, and the Field of Asphodel for the insipid. Orpheus dreads to see his beloved cramped inside this tight horde. With eyes looking forward, he saw Cerberus, a fierce three-headed dog and loyal guard of Hades. Orpheus realized that he is the focus of Cerberus's intense gaze.");  
  var currentRoomCreation = rooms[1];  
    currentRoomCreation.addExit("north", "The Field of Asphodel", "Orpheus sees a wide plain brimming with souls. It will be troublesome to squish through.", "charmedCerberus||killedCerberus", "Cerberus growls alarmingly. It is unadvised to attempt to cross.");
    currentRoomCreation.addExit("south", "The Underworld", "Orpheus sees a wide rocky area. Near it is the tunnel from which he had descended.", null, null);
    
    currentRoomCreation.addThing(things["coin"]);
      things["coin"].pathToParent = currentRoomCreation;
    
    currentRoomCreation.addNpc(npcs["cerberus"]);
      npcs["cerberus"].pathToParent = currentRoomCreation;
    

// Room[2] //    -------------------------------------------------------------------------------
    
  rooms[2] = new Room("The River of Styx", "red", "Orpheus approaches a wide river of unknown depth. From old tales and experience, he knew that merely touching its water will bring extraordinary pain not replicable by any form of mortal torture techniques. In the distance, Charon is ferrying his way across with a boatload of the newly deads. The air is humid and damp. Orpheus cans travel no farther in this direction.");  
  var currentRoomCreation = rooms[2];  
    currentRoomCreation.addExit("southwest", "The Underworld", "Orpheus sees a wide rocky area. Near it is the tunnel from which he had descended.", null, null);
    
    currentRoomCreation.addThing(things["charon"]);
      things["charon"].pathToParent = currentRoomCreation;
    
    currentRoomCreation.addNpc(npcs["river"]);
      npcs["river"].pathToParent = currentRoomCreation;
    

// Room[3] //    -------------------------------------------------------------------------------
    
  rooms[3] = new Room("The Field of Asphodel", "red", "Orpheus enters a massive wasteland. The only thing green about this place is the black grass and the small poplar trees that dots the landscape; however, what it lacks in greenery, Asphodel makes up in the sheer amount of souls present. This is the fate for those who lives an insipid life. Far ahead, loomed Hades's Palace. To the northeast, a rich garden of pomegranate trees. To the northwest is a dark cave. Orpheus shuddered to think of what may lie in it.");  
  var currentRoomCreation = rooms[3];  
    currentRoomCreation.addExit("north", "Hades's Palace", "Orpheus sees a grand obsidian palace. Skeletons and zombies can be found patrolling", null, null);
    currentRoomCreation.addExit("northeast", "Persephone's Garden", "Orpheus sees a beautiful pomgrante garden. The air smells sweet from its fragrance.", null, null);
    currentRoomCreation.addExit("northwest", "Tartarus", "Orpheus feels a strong sense of fear from staring into a pitch black cave.", null, null);
    currentRoomCreation.addExit("south", "The Main Gate", "Orpheus sees a big three-headed dog besides a large gate. Souls can be seen passing from it.", "charmedCerberus||killedCerberus", "Cerberus growls alarmingly. It is unadvised to attempt to cross.");
    currentRoomCreation.addExit("west", "Training Ground", "Orpheus sees a military camp for skeletons. The air is dusty.", null, null);


// Room[4] //    -------------------------------------------------------------------------------
    
  rooms[4] = new Room("Training Ground", "red", "Orpheus approaches an open field cluttered with the undeads, each sparring another in organized pairs of two. Thousands of skeleton warriors hack at each others and dies. Although they crumpled to dust, the Underworld reanimates the bodies of these skeletons to prolong the haunting requiem. Orpheus fails to imagine what horrific battle they are preparing for. Turning his gaze to a nearby hut, Orpheus finds swords of every size to suit the preference of these warriors. One lone soldier stands by its side, training his mind mentally with an invisible foe. Here, conversations are nigh impossible beneath the clashing of swords.");  
  var currentRoomCreation = rooms[4];  
    currentRoomCreation.addExit("east", "The Field of Asphodel", "Orpheus sees a wide plain brimming with souls. It will be troublesome to squish through.", null, null);
    
    currentRoomCreation.addThing(things["sword"]);
      things["sword"].pathToParent = currentRoomCreation;
    
    currentRoomCreation.addNpc(npcs["skeleton"]);
      npcs["skeleton"].pathToParent = currentRoomCreation;


// Room[5] //    -------------------------------------------------------------------------------
    
  rooms[5] = new Room("Tartarus", "red", "Orpheus loomed before a titanic cavern. From within echoes dissonant whispers and screams of agony. Orpheus shuddered. From tales, he had heard of the Tartarus, the legendary prison of the Underworld from which there is no return. Its prisoners are said to be trapped in an indefinite cycle of gruesome torments. Even the gods, themselves, feared its power and imprisoned their worst foes here. Unlike the rest of the Underworld which is dimly-litted by torches, the Tartarus is a vortex of true darkness.");  
  var currentRoomCreation = rooms[5];  
    currentRoomCreation.addExit("southeast", "The Field of Asphodel", "Orpheus sees a wide plain brimming with souls. It will be troublesome to squish through.", null, null);
    
    currentRoomCreation.addNpc(npcs["cave"]);
      npcs["cave"].pathToParent = currentRoomCreation;
    

// Room[6] //    -------------------------------------------------------------------------------
    
  rooms[6] = new Room("Persephone's Garden", "red", "Orpheus enters a beautiful botanical garden humming with soft cricket sounds. On its trees hung glorious burgundy fruits called pomegranates. They are ripe and juicy. Though they exudes temptation, Orpheus knows better than to grasp the delicious treats. It is rumored that those who had once eaten the fruit of the Underworld shall be barred from re-entrance to the world of the living. Strangely enough, Persephone is nowhere to be found.");  
  var currentRoomCreation = rooms[6];  
    currentRoomCreation.addExit("southwest", "The Field of Asphodel", "Orpheus sees a wide plain brimming with souls. It will be troublesome to squish through.", null, null);
    currentRoomCreation.addExit("west", "Hades's Palace", "Orpheus sees a grand obsidian palace. Skeletons and zombies can be found patrolling", null, null);
    
    currentRoomCreation.addThing(things["pomegranate"]);
      things["pomegranate"].pathToParent = currentRoomCreation;
    
    currentRoomCreation.addNpc(npcs["tree"]);
      npcs["tree"].pathToParent = currentRoomCreation;
        

// Room[7] //    -------------------------------------------------------------------------------
    
  rooms[7] = new Room("Hades's Palace", "red", "Orpheus settled into an obsidian palace of unmatched grandoise. From his first step to the last, Orpheus was watched. Undead servants of every ranks observe him with intense gazes as he pass by. Uneccesary motions will be reckless and suicidal. Ahead towered Hades above his throne of skulls. To his side is the fair Persephone, his wife and the goddess of spring. If one cans bring back the dead, it can only be the god of the Underworld, Hades.");  
  var currentRoomCreation = rooms[7];  
    currentRoomCreation.addExit("south", "The Field of Asphodel", "Orpheus sees a wide plain brimming with souls. It will be troublesome to squish through.", null, null);
    currentRoomCreation.addExit("east", "Persephone's Garden", "Orpheus sees a beautiful pomgrante garden. The air smells sweet from its fragrance.", null, null);    
    
    currentRoomCreation.addNpc(npcs["hades"]);
      npcs["hades"].pathToParent = currentRoomCreation;
    
    currentRoomCreation.addNpc(npcs["persephone"]);
      npcs["persephone"].pathToParent = currentRoomCreation;
        

// Room[8] //    -------------------------------------------------------------------------------
    
  rooms[8] = new Room("Overworld's Tunnel", "red", "Orpheus ascends through a long narrow tunnel. It is dirty, it is dusty, and it is dry. He held sole responsiblity for its creation, having carved it with his music. Strangely, there is a 20-sided dice on the floor. Treading up, Orpheus is reminded of the pains he felt, but he smiles. The shackle is off! Looking ahead he saw the shining light, signifying the end of his quest and the beginning of his reward.");  
  var currentRoomCreation = rooms[8];  
    currentRoomCreation.addExit("north", "The Underworld", "Orpheus sees a wide rocky area. It is dark.", null, null);
    currentRoomCreation.addExit("south", "Ancient Greece", "Orpheus sees a beautiful meadow with butterflies and blooming flowers.", "!atePomegrante", "The words echo in his ears. Those who eat the fruits of the Underworld cans no longer returns to the world of light.");  
    
    currentRoomCreation.addThing(things["dice"]);
      things["dice"].pathToParent = currentRoomCreation;

// Room[9] //    -------------------------------------------------------------------------------
    
  rooms[9] = new Room("Ancient Greece", "red", "Orpheus resurfaces to the meadow of old. The sun dawns on a distinct day, but the butterflies still flutter and the flowers bloom in vivid golds the way he remembered. The air smell sweet with the fragrance of honey and pollen. In the far distance, Orpheus observed an approaching presence. He noted it with Eurydice, but made no further remarks. Is it a bird? A god? No. It is the credit sequence! The quest concludes as Orpheus and Eurydice frolic beneath the shining sun, giver of life.");  
  var currentRoomCreation = rooms[9];  
    currentRoomCreation.addExit("north", "Overworld's Tunnel", "Orpheus sees a long winding cave downward into the darkness.", null, null);  
    currentRoomCreation.specialEffect = function(){
      orpheus.status = "dead";  
      gameOverText("finishedGame");  
    }
   
}

function gameBackground(){
  textarea.innerHTML += "<span style='color: blue;; text-shadow: -0.5px 0.5px 1px black;'>Prelogue</span><br>";
  textarea.innerHTML += "Long ago, there was a man by the name of Orpheus. He was a master of the lyre and was gifted even among the mythological heroes of Greece. He have, but one love: the fair Eurydice. On one sunlit day, darkness abruptly stormed above the star-crossed couples. As Eurydice danced across a blooming meadow with Orpheus playing his signature lyre, a malicious snake sent Eurydice to her swift death with a decisive bite to the ankle. Devastated, Orpheus wills the door to the Underworld with his music, tainted by sorrow. Down he goes, and thus, the story goes.<br>";  
}


/******* Call the Game Initiation **********/

makeThings();
makeNpcs();
makeRooms();
gameBackground();
currentRoom = rooms[0];
currentRoom.showLocationName();
currentRoom.showDescription();
currentRoom.showThings();
currentRoom.showExits();

//scrollSmoothToTop();
