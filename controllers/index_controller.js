index_controller = {
  index: function(req, res, next) {
    res.render('index', { title: 'Express' });
  },
    
  export_data: function(req, res, next) {
    res.send('users zzz');
  }
}

module.exports = index_controller;
