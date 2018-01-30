var express = require('express')
var router = express.Router()
var cfg = require('../cfg.js')
var dh = require('../modules/dataHandler.js')
router.use('/public',express.static(__dirname + '/../public'))

router.all('/*',function(req, res,next){
	if(req.session.cookie.emails.length==0) {
        res.redirect('/account/signin')
	}else{
		res.locals.loggedIn = true
		next()
	}
});

router.post('/selectable', function(req, res){
	var emails = [{email:req.body.email}]
	var data = dh.getData(new Date(req.body.start_date),new Date(req.body.end_date),emails,req.oa_misfit,data => {
		if (data.networkError===true){
			res.render ('network-error')
			return
		}
		data.selectable=true
		data.emails=req.session.cookie.emails.map(e => e.email)
		res.render('statistics',data)
	})
})

router.get('/selectable', function(req, res){
	var data = dh.getData(new Date('8/15/2016'),new Date('8/25/2016'),[req.session.cookie.emails[0]],req.oa_misfit,data => {
		if (data.networkError===true){
			res.render ('network-error')
			return
		}
		data.selectable=true
		data.emails=req.session.cookie.emails.map(e => e.email)
		res.render('statistics',data)
	})
})

router.post('/complex', function(req, res){
	var data = dh.getData(new Date(req.body.start_date),new Date(req.body.end_date),req.session.cookie.emails,req.oa_misfit,data => {
		if (data.networkError===true){
			res.render ('network-error')
			return
		}
		res.render('statistics',data)
	})
})

router.get('/complex', function(req, res){
	var data = dh.getData(new Date('8/15/2016'),new Date('8/20/2016'),req.session.cookie.emails,req.oa_misfit,data => {
		if (data.networkError===true){
			res.render ('network-error')
			return
		}
		res.render('statistics',data)
	})
})

module.exports = router;