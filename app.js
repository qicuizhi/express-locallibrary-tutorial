const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
//Import routes for "catalog" area of site
const catalogRouter = require("./routes/catalog"); 
// 导入压缩中间件
var compression = require('compression');
// 导入避免被常见漏洞侵袭中间件包
var helmet = require('helmet');


const app = express();

// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = 'mongodb+srv://q:1@cluster0.m3lstsu.mongodb.net/locallibrary';

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

if(process.env.NODE_ENV === 'production') {
  console.log('We are running in production mode')
} else {
  console.log('We are running in development mode')
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(helmet());
app.use(compression()); //Compress all routes
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
// Add catalog routes to middleware chain.
app.use("/catalog", catalogRouter);


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
