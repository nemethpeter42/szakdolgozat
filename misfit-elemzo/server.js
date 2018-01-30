var express = require('express')
var app = express()

var path = require('path')
app.use('/public',express.static(path.join(__dirname, 'public')))

var OAuth2Misfit = require('./oauth2_misfit').OAuth2Misfit

var cfg = require('./cfg')

var session = require('express-session')
app.use(session({
   secret: "skjghskdjfhbqigohqdiouk",
	resave: true,
   saveUninitialized: false,
	cookie:{maxAge: 365 * 24 * 60 * 60 * 1000,emails:[],},
}))

var fs = require('fs')

var hbs = require('hbs')

var dataHandler = require('./modules/dataHandler')

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

var cookieParser = require('cookie-parser')
app.use(cookieParser())

var morgan = require('morgan')
app.use(morgan('combined'))

var errorhandler = require('errorhandler')
app.use(errorhandler({ dumpExceptions: true, showStack: true }))

var Handlebars = require('hbs')
Handlebars.registerHelper('json', obj => JSON.stringify(obj))
Handlebars.registerHelper('email2id', text => text.split('@').join('-at-').split('.').join('-dot-'))
Handlebars.registerHelper('breaklines', text => {
    text = Handlebars.Utils.escapeExpression(text)
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>')
    return new Handlebars.SafeString(text)
})
Handlebars.registerHelper('newline_escape', text => text.replace(/(\r\n|\n|\r)/gm, '\\n'))
app.set('view engine', 'hbs')
app.set('views',__dirname+'/views')

app.use(function (req, res, next) {
	req.oa_misfit = new OAuth2Misfit(
		cfg.misfit.client_id,
		cfg.misfit.client_secret,
		cfg.misfit.idmURL,
		'/auth/dialog/authorize',
		'/auth/tokens/exchange',
		cfg.misfit.callbackURL
	)
	req.cfg=cfg
	next()
})


app.get('/', function(req, res){
    if(req.session.cookie.emails.length==0) {
        res.redirect('/account/signin');
    } else {
		res.locals.loggedIn = true;
		res.redirect('/statistics/selectable');
    }
})

var account = require('./controllers/account')
app.use('/account', account)
var comments = require('./controllers/comments')
app.use('/comments', comments)
var download = require('./controllers/download')
app.use('/download', download)
var profile = require('./controllers/profile')
app.use('/profile', profile)
var statistics = require('./controllers/statistics')
app.use('/statistics', statistics)

console.log('Server is listening on port 28888.');
app.listen(28888);
