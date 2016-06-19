
var LZString = require('../public/javascripts/lz-string.js')
var request = require('request')
var sqlite3 = require('sqlite3').verbose()
var fs = require("fs");
var interpolate = require('interpolate');
var config = require('../config');
var db = null
var sqliteFile = null
var isWaiting  = false;
index_controller = {
  index: function(req, res, next) {

    var url = interpolate(
        '<%_host%>?type=<%_type%>',
        {_host: config.host,
        _type: "getMainTopics"
        },
        {delimiter: '<%%>'}
    )

    console.log(url)

    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var jsonData = JSON.parse(body)["topics"]
        var topics = []

        for(var index in jsonData) {
            var jsonObject = jsonData[index] 
            topics.push({id: jsonObject["id"], name: jsonObject["name"]})
        }

        console.log(topics)

        res.render('index', { topicIds: topics})
      }else{
          res.send("Cannot get all topic" + error)
      }
    })
  },
    
  export_data: function(req, res, next) {
    if(!isWaiting){
      console.log("aswdadsdsfasfa")
      var topicId = req.query.topicId
      var fileName = req.query.fileName
          
      sqliteFile = fileName + ".sqlite"
      db = new sqlite3.Database(sqliteFile);

      getTopic(req, res, next, topicId)

      console.log("12frergergrgrtg")
      isWaiting = true;

      setTimeout(function() {
       db.close(function(){
            console.log("xxxxxxxxxx close")
            returnFile(req, res, next, sqliteFile)
        });

      }, 100*1000)

    }
  }
}

function getTopic(req, res, next, topicId) {
    var url = interpolate(
        '<%_host%>?type=<%_type%>&topicId=<%_topicId%>',
        {_host: config.host,
        _type: "getTopics",
        _topicId: topicId
        },
        {delimiter: '<%%>'}
    )
      
    console.log("url: " + url)

    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var jsonData = JSON.parse(body)
        var topics = jsonData["topics"]
        var cardDatas = jsonData["cardDatas"]

        exportTopicTable(topics)
        exportCardIdDataTable(cardDatas)

        for(var index in topics) {
            var topic = topics[index]
            var categoryIds = topic["childrentIds"]

            console.log("categoryIds--------------- : " + categoryIds)

            if(categoryIds != ""){
                getCards("["+categoryIds+"]")
            }
        }

      }else{
          removeFile(req, res, next, sqliteFile)
          res.send("Cannot get data of this topic id (Error or internet is down)" + error)
      }
    })
}

function getCards(categoryIds) {
    var url = interpolate(
        '<%_host%>?type=<%_type%>&categoryids=<%_categoryids%>',
        {_host: config.host,
        _type: "getCards",
        _categoryids: categoryIds
        },
        {delimiter: '<%%>'}
    )

    console.log(url)

    request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var jsonData = JSON.parse(body)
        var cards = jsonData["cards"]
        console.log("-------------- get Card OK" +  cards.length)
        exportCardTable(cards)

      }else{
          res.send("Cannot get all topic" + error)
      }
    })

}

function returnFile(req, res, next, filePath) {
	res.download(filePath, filePath, function(error){
		if (error) {
		  console.log("download ng")
		} else {        
		  console.log("download ok")
		  removeFile(req, res, next, filePath)
		}
	});
}

function removeFile(req, res, next, filePath) {
	fs.unlink(filePath, function(err){
		if (err) {
		    console.log("remove ng")
		}
		else {
		    console.log("remove ok")
		}
        isWaiting = false;
  });
}

sqliteHelper = {
	create: function(tableName, properties) {
		db.serialize(function() {
			console.log("create")
			var command = interpolate(
				'CREATE TABLE if not exists <%_tableName%> (<%_properties%>)',
			  {_tableName: tableName,
			   _properties: properties.join()
			  },
			  {delimiter: '<%%>'}
			)
			
			db.run(command);
		});

	},
	
	insert: function(tableName, properties, datas) {
		db.serialize(function() {
			console.log("insert")
			var command = interpolate(
				'INSERT OR REPLACE INTO <%_tableName%> VALUES (<%_properties%>)',
				 {_tableName: tableName,
				  _properties: properties.join()
				 },
				 {delimiter: '<%%>'}
			)

			var stmt = db.prepare(command);
			for(var index in datas) {
			    stmt.run(datas[index]);
			}
			
			stmt.finalize();
	    });
	}
}

function exportTopicTable(jsonData) {
    var topicTableName = "Topic"
	var properties_field = [
        "id text PRIMARY KEY NOT NULL UNIQUE", "userId text", "userName text", "parentId text", "type integer",
        "lastUpdate text", "level integer", "status integer", "price integer", "priority integer",
        "totalCardNum integer","name text", "description text", "avatar text", "childrentIds text"
    ]
    
    var properties_value = []
    var datas = [];
    
    for(i =0; i< properties_field.length; i++){
        properties_value.push("?")
    }
	
	for(var index in jsonData) {
		var jsonObject = jsonData[index]
		var data = [
			JSON.stringify(jsonObject["id"]),
			jsonObject["userId"], jsonObject["userName"], JSON.stringify(jsonObject["parentId"]),
			jsonObject["type"], JSON.stringify(jsonObject["lastUpdate"]), jsonObject["level"],
			jsonObject["status"], jsonObject["price"], jsonObject["priority"],
			jsonObject["totalCardNum"], jsonObject["name"], jsonObject["description"],
			jsonObject["avatar"], JSON.stringify(jsonObject["childrentIds"])
		]

		datas.push(data)
	}
    
    sqliteHelper.create(topicTableName, properties_field)
    sqliteHelper.insert(topicTableName, properties_value, datas)
}

function exportCardTable(json) {
    var cardTableName = "Card"
	var properties_field =[
        "id text PRIMARY KEY NOT NULL UNIQUE", "orderIndex integer", "parentId text", "userId text",
        "difficultyLevel integer", "status integer", "type integer", "hasChild integer", "frontText text",
        "frontImage text", "frontSound text", "frontVideo text", "frontHint text", "frontLanguage integer",
        "backText text", "backImage text", "backSound text", "backVideo text", "backHint text",
        "backLanguage integer", "lastUpdate text", "backTexts text", "multiChoices text"
    ]
	
	var properties_value = []
    var datas = [];
    
    for(i =0; i< properties_field.length; i++){
        properties_value.push("?")
    }
	
	for(var index in json) {
		var jsonObject = json[index]

        var fontText = jsonObject["frontText"]
        var multiChoices = jsonObject["multiChoices"]
        var backTexts = jsonObject["backTexts"]
        var backText = jsonObject["backText"]
        var backTextEncript = ""
        var fontTextEncript = ""
        var multiChoicesEncript = []
        var backTextsEncript = []
        var pre_test = "@cp@"

        if(fontText != null && fontText != ""){
            fontTextEncript = pre_test + LZString.compressToBase64(fontText);
        }

        if(backText != null && backText != ""){
            backTextEncript = pre_test + LZString.compressToBase64(backText);
        }

        if(multiChoices != null && multiChoices.length > 0){
            for(var index in multiChoices) {
                var multiChoice = pre_test + LZString.compressToBase64(multiChoices[index]);
                multiChoicesEncript.push(multiChoice)
            }
        }

        if(backTexts != null && backTexts.length > 0){
            for(var index in backTexts) {
                var backtext = pre_test + LZString.compressToBase64(backTexts[index]);
                backTextsEncript.push(backtext)
            }
        }
        
		var data = [
			JSON.stringify(jsonObject["id"]),jsonObject["orderIndex"],
            JSON.stringify(jsonObject["parentId"]), jsonObject["userId"],
			jsonObject["difficultyLevel"], jsonObject["status"], jsonObject["type"],
			jsonObject["hasChild"], fontTextEncript, jsonObject["frontImage"],
			jsonObject["frontSound"], jsonObject["frontVideo"], jsonObject["frontHint"],
			jsonObject["frontLanguage"], backTextEncript, jsonObject["backImage"],
            jsonObject["backSound"], jsonObject["backVideo"], jsonObject["backHint"],
            jsonObject["backLanguage"], JSON.stringify(jsonObject["lastUpdate"]),
            JSON.stringify(backTextsEncript), JSON.stringify(multiChoicesEncript)
		]

		datas.push(data)
	}
    
    sqliteHelper.create(cardTableName, properties_field)
    sqliteHelper.insert(cardTableName, properties_value, datas)
}

function exportCardIdDataTable(json) {
    var cardIdDataTableName = "CardIdData"
	var properties_field =[
        "id text PRIMARY KEY NOT NULL UNIQUE", "parentId text",
        "cardIds text", "lastUpdate text", "status integer"
    ]
	
	var properties_value = []
	var datas = []
    
    for(i =0; i< properties_field.length; i++){
        properties_value.push("?")
    }
	
	for(var index in json) {
		var jsonObject = json[index]
		var data = [
			JSON.stringify(jsonObject["id"]), JSON.stringify(jsonObject["parentId"]),
            JSON.stringify(jsonObject["cardIds"]),
            JSON.stringify(jsonObject["lastUpdate"]), jsonObject["status"]
		]

		datas.push(data)
	}
    
    sqliteHelper.create(cardIdDataTableName, properties_field)
    sqliteHelper.insert(cardIdDataTableName, properties_value, datas)
}

module.exports = index_controller
