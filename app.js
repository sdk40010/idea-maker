var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');
var session = require('express-session');
var passport = require('passport');

//モデルの読み込み
var User = require('./models/user');
var Word = require('./models/word');
var Combination = require('./models/combination');
var Favorite = require('./models/favorite');
var Comment = require('./models/comment');
User.sync().then(() => {
  Combination.sync();
  Word.belongsTo(User, { foreignKey: 'createdBy' });
  Word.sync();
  Favorite.belongsTo(User, { foreignKey: 'userId' });
  Favorite.sync();
  Comment.belongsTo(User, { foreignKey: 'createdBy' });
  Comment.sync();
});


var GitHubStrategy = require('passport-github2').Strategy;
var GITHUB_CLIENT_ID = '2c3921de2800c6d45712';
var GITHUB_CLIENT_SECRET = 'c967b38a835e33a1ddae8320310a9aea6b5406fd';

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:8000/auth/github/callback'
},
  function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      User.upsert({
        userId: profile.id,
        username: profile.username
      }).then(() => {
        done(null, profile);
      });
    });
  }
));

var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var logoutRouter = require('./routes/logout');
var wordsRouter = require('./routes/word');
var favoritesRouter = require('./routes/favorite');
var combinationsRouter = require('./routes/combinaton');
var commentsRouter = require('./routes/comment');
var usersRouter = require('./routes/user');

var app = express();
app.use(helmet());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: '1885b8bb7c7b37a5', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/words', wordsRouter);
app.use('/users', favoritesRouter);
app.use('/combinations', combinationsRouter);
app.use('/combinations', commentsRouter);
app.use('/users', usersRouter);

app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
  function (req, res) {
    
  }
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
  }
);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
