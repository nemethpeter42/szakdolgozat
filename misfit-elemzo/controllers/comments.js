var express = require('express')
var router = express.Router()
var dh = require('../modules/dataHandler.js')

router.all('/*',function(req, res,next){
	if(req.session.cookie.emails.length==0) {
        res.redirect('/account/signin')
	}else{
		res.locals.loggedIn = true
		next()
	}
})

router.post('/new', function(req, res){
	var result = dh.addComment(req.body.email,req.body.date,req.body.content)
	if(result.err){
		res.send({
			success:false,
			err:result.err,
		})
	} else {
		res.send({
			idx:result.idx,
			success:true,
		})
	}
})

router.post('/edit', function(req, res){
	var result = dh.editComment(req.body.email,req.body.date,req.body.idx,req.body.content)
	if(result.err){
		res.send({
			success:false,
			err:result.err,
		})
	} else {
		res.send({
			success:true,
		})
	}
})

router.post('/remove', function(req, res){
	var result = dh.removeComment(req.body.email,req.body.date,req.body.idx)
	if(result.err){
		res.send({
			success:false,
			err:result.err,
		})
	} else {
		res.send({
			success:true,
		})
	}
})

module.exports = router