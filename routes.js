module.exports = function(router){
  require("./routes/index")(router);
  require("./routes/users")(router);
}