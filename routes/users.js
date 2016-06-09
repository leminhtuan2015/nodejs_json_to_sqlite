var users_controller = require('../controllers/users_controller');

module.exports = function(router){
  router.get('/users', function(req, res, next) {
    users_controller.index(req, res, next)
  });
}
