var index_controller = require('../controllers/index_controller');

/* GET home page. */

module.exports = function(router){
  router.get('/', function(req, res, next) {
    index_controller.index(req, res, next)
  });
    
  router.get('export_data', function(req, res, next) {
    index_controller.export(req, res, next)
  });
}
