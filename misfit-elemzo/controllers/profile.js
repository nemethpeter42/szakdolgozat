var LoginMisfit = require('../login_misfit.js')
var cfg = require('../cfg')
var express = require('express')
var router = express.Router()
var dh = require('../modules/dataHandler.js')
var DataBase = dh.DataBase

router.all('/*',function(req, res,next){
	if(req.session.cookie.emails.length==0) {
        res.redirect('/account/signin')
	}else{
		res.locals.loggedIn = true
		next()
	}
})

router.get('/', function(req, res){
	var profiles=[]
	var db = new DataBase('dbCloud.txt')
	var rekurziv=function(i){
		if(i<req.session.cookie.emails.length){
			var email=req.session.cookie.emails[i]['email']
			var userData = db.getUser(email)
			LoginMisfit.login(email, userData.password.misfit, function(e,results, sid) {
				if (e) {
					res.render('network-error')
					return
				} else {
					var user = undefined
					var device = undefined
					var endPoints = [
						{
							'url': cfg.misfit.profileURL,
							'fn': (raw) => {
								user = raw
							},
						},
						{
							'url': cfg.misfit.deviceURL,
							'fn': (raw) => {
								device = raw
							},
						},
					]
					var retryLimit = 5
					var retryCnt = 0
					var endPointsNr = 0
					var endPointsStep = () => {
						if(endPointsNr < endPoints.length && retryCnt < retryLimit ){
							console.log('EMAIL: ' + email)
							console.log('ENDPOINT: ' + endPoints[endPointsNr].url)
							console.log('NUMBER OF TRIES (out of '+retryLimit+') : ' + (retryCnt+1))
							req.oa_misfit.get(endPoints[endPointsNr].url, results.access_token, (e, res) => {
								if (res!==undefined){
									var raw = JSON.parse(res)
									endPoints[endPointsNr].fn(raw)
									retryCnt = 0
									++endPointsNr
								} else {
									++retryCnt
								}
								endPointsStep()
							})
						} else {
							if(retryCnt >= retryLimit){
								console.log('NUMBER OF ALLOWED RETRIES (which is '+retryLimit+') EXCEEDED')
								res.render('network-error')
								return
							}
							var weight = Math.round((user.weightUnit=='pounds'?0.45359237*user.weight:user.weight)*100)/100 //pound->kg
							var height = Math.round((user.heightUnit=='inches'?2.54*user.height:user.height)*100)/100 //inch->cm
							profiles.push({
								email:email,
								subdata:{
									'MisFit':{
										'ID':user.userId,
										'Születésnap':user.birthday,
										'Nem':(user.gender=='female'?'nő':(user.gender=='male'?'férfi':'')),
										'E-mail':user.email,
										'Súly':weight+' kg',
										'Magasság':height+' cm',
										'Készülék típusa':device.deviceType,
										'Készülék sorozatszáma':device.serialNumber,
										'Készülék firmware verzió':device.firmwareVersion,
										'Készülék töltöttsége':device.batteryLevel+'%',
										'Készülék utolsó szinkronizálása':(new Date(device.lastSyncTime*1000)).toUTCString(),
									},
								},
							})
							req.oa_misfit.get(cfg.misfit.signoutURL, results.access_token, function (e, response) {
								rekurziv(i+1)
							})
						}
					}
					endPointsStep()
					/*
					req.oa_misfit.get(cfg.misfit.profileURL, results.access_token, function (e1, responseProfile) {
						req.oa_misfit.get(cfg.misfit.deviceURL, results.access_token, function (e2, responseDevice) {
							var user = JSON.parse(responseProfile)
							var device = JSON.parse(responseDevice)
							
						})
					})
					*/
				}
			})
		}else{
			res.render('profile',{data:profiles})
		}
	}
	rekurziv(0)
})

module.exports = router