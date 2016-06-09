var request = require('request');

index_controller = {
  index: function(req, res, next) {
    res.render('index', { title: 'Express' });
  },
    
  export_data: function(req, res, next) {
      var host = "http://127.0.0.1:8888/export"
      var topicId = req.query.topicId
      var fileName = req.query.fileName
      var url = host + "?" + "topicId=" + topicId + "&" + "fileName=" + fileName
      
      console.log("topicId :" + topicId + " fileName: " + fileName)
      
      request(url, function (error, response, body) {
          if (!error && response.statusCode == 200) {
              var jsonData = JSON.parse(body)
			  console.log(jsonData)
              res.send(jsonData["cards"][0]);
          }
      })
  }
}

module.exports = index_controller;
