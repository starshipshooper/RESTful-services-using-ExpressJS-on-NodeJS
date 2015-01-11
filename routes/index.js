var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Movie = require('../models/movie');
var Bing = require('node-bing-api')({ accKey: "BING KEY" });
var Youtube = require("youtube-api");
Youtube.authenticate({
  type: "key"
  , key: "YOUTUBE KEY"
});
var request = require('request');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Pinflicks', user: req.user });
});

router.get('/register', function(req, res) {
  res.render('register', { });
});


router.post('/register', function(req, res) {
  Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
    if (err) {
      return res.render('register', { account : account });
    }

    passport.authenticate('local')(req, res, function () {
      res.redirect('/');
    });
  });
});

router.get('/login', function(req, res) {
  res.render('login', { user : req.user });
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  res.redirect('/');
});

router.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

router.post('/movie',isLoggedIn, createMovie, findAllMovies, function (req, res) {
});


router.get('/api/movies/find', isLoggedIn, function (req, res) {
  if (req.query.title)  {
  request('http://www.omdbapi.com/?s='+req.query.title+'&type=movie&r=json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body); // Print the google web page.
        if (JSON.parse(body).Search) {
          //A result set with no Error (Not found) property has been returned. Give it to view:
          res.render('apiresultlist',{user: req.user, movielist: JSON.parse(body).Search});
        } else  {
          //Error property film not found has been returned. Pass whole body to view since no Search property is present
          res.render('apiresultlist',{user: req.user, notFound: JSON.parse(body), searched: req.query.title});
        }
  }
  });
}
else {   res.redirect('/');}
});

router.get('/api/movies/:movietitle', isLoggedIn, function (req, res) {
  if (req.movietitle)  {
    request('http://www.omdbapi.com/?t='+req.movietitle+'&type=movie&r=json', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        Youtube.search.list({"part": "id", "q": req.movietitle+' trailer', "type": "video", "maxResults": 1}, function (err,data) {
          console.log('Trailer '+ data.items[0].id.videoId);
          query = Movie.where({title:req.movietitle});
          query.findOne(function(err,movie) {
            if (movie!= null) {
              result = movie;
              console.log('You already have this movie pinned '+ result);
              res.render('apimovie',{user: req.user, movielist: JSON.parse(body), youtubeid: data.items[0].id.videoId, pinnedAlready: true });
            }
            else  {
              res.render('apimovie',{user: req.user, movielist: JSON.parse(body), youtubeid: data.items[0].id.videoId, pinnedAlready: false });

            }

          });
        });

      }
    });
  }
  else {res.redirect('/');}
  });

router.post('/pinlist/',isLoggedIn, createMovie, findAllMovies, function (req, res) {

});
router.get('/pinlist/',isLoggedIn,  findAllMovies, function (req, res) {

});

router.get('/movie/:movieid', isLoggedIn, findMovie, function (req, res) {

});
router.param('movieid', function (req, res, next, movieid) {
  req.movieid = movieid;
  next();
});
router.param('movietitle', function (req, res, next, movietitle) {
  req.movietitle = movietitle;
  console.log('Movie title'+req.movietitle);
  next();
});

function findMovie(req, res, next) {
  Movie.find({ _id: req.movieid}, function(err,movie) {
    result = movie;
    res.render('singlemovie',{user: req.user, title: result.title, movie: result});
    console.log(result);
  });
  return next();
}
function findAllMovies (req, res, next) {
  Movie.find({ownerid: req.user.id}, function(err,movie) {
    result = movie;
    res.render('movielist',{collection: Movie.prototype.collection.name, user: req.user, title: req.body.title, movies: result});
    console.log(result);
  });
  return next();
}

function createMovie(req,res,next) {
  Movie.create({title: req.body.title, ownerid: req.user.id, posterurl: req.body.poster, year: req.body.year}, function (err, movie) {
    if (err) { res.send('Error inserting into db');}
    return next();
  });
  console.log('successfully inserted into DB');
}

// route middleware to make sure a user is logged in. Use for every route that needs authentication
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated())
    return next();

    // if they aren't redirect them to the home page
    res.redirect('/notAllowed');
  }


module.exports = router;
