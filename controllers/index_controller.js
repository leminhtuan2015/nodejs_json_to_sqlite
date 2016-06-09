var request = require('request')
var sqlite3 = require('sqlite3').verbose()
var fs = require("fs");
var interpolate = require('interpolate');
var config = require('../config');
var db = null
var sqliteFile = null

index_controller = {
  index: function(req, res, next) {
    res.render('index', { title: 'Express' })
  },
    
  export_data: function(req, res, next) {
      var host = config.host
      var topicId = req.query.topicId
      var fileName = req.query.fileName
      var url = interpolate(
		  '<%_host%>?topicId=<%_topicId%>&fileName=<%_fileName%>',
	      {_host: host,
		   _topicId: topicId,
		   _fileName: fileName
		  },
		  {delimiter: '<%%>'}
	  )
      
	  console.log("url: " + url)
      console.log("topicId :" + topicId + " fileName: " + fileName)
	  
	  if(topicId == ""){
          res.send("Come back and enter the topic id (topic id nil)")
          return
      }
		 
	  if(fileName == "")
		  fileName = "export"
		  
	  sqliteFile = fileName + ".sqlite"
	  db = new sqlite3.Database(sqliteFile);
      
      request(url, function (error, response, body) {
          if (!error && response.statusCode == 200) {
              var jsonData = JSON.parse(body)
			  exportTopicTable(jsonData["topics"])
			  exportCardIdDataTable(jsonData["cardDatas"])
			  exportCardTable(jsonData["cards"])
              
            db.close(function(){
                returnFile(req, res, next, sqliteFile)
            });
          }else{
              removeFile(req, res, next, sqliteFile)
              res.send("Cannot get data of this topic id (Error or internet is down)" + error)
          }
      })
  }
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
				'INSERT INTO <%_tableName%> VALUES (<%_properties%>)',
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
			jsonObject["userId"], jsonObject["userName"], jsonObject["parentId"],
			jsonObject["type"], jsonObject["lastUpdate"], jsonObject["level"],
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
		var data = [
			JSON.stringify(jsonObject["id"]),jsonObject["orderIndex"],
            JSON.stringify(jsonObject["parentId"]), jsonObject["userId"],
			jsonObject["difficultyLevel"], jsonObject["status"], jsonObject["type"],
			jsonObject["hasChild"], jsonObject["frontText"], jsonObject["frontImage"],
			jsonObject["frontSound"], jsonObject["frontVideo"], jsonObject["frontHint"],
			jsonObject["frontLanguage"], jsonObject["backText"], jsonObject["backImage"],
            jsonObject["backSound"], jsonObject["backVideo"], jsonObject["backHint"],
            jsonObject["backLanguage"], JSON.stringify(jsonObject["lastUpdate"]),
            jsonObject["backTexts"], jsonObject["multiChoices"]
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
			JSON.stringify(jsonObject["id"]), jsonObject["parentId"],
            JSON.stringify(jsonObject["cardIds"]),
            JSON.stringify(jsonObject["lastUpdate"]), jsonObject["status"]
		]

		datas.push(data)
	}
    
    sqliteHelper.create(cardIdDataTableName, properties_field)
    sqliteHelper.insert(cardIdDataTableName, properties_value, datas)
}

module.exports = index_controller
