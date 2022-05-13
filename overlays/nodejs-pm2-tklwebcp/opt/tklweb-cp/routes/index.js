exports.index = function(req, res){
  res.render('index', 
    { 
      title: 'TurnKey Node.js',
      httphost: req.headers.host
    })
};
