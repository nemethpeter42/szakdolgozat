var dh = require('../modules/dataHandler.js')
var DataBase = dh.DataBase
var express = require('express')
var router = express.Router()
var loginMisfit = require('../login_misfit.js')
var cfg = require('../cfg.js')
router.use('/public',express.static(__dirname + '/../public'))

router.all('/*',function(req, res, next){
	if(req.session.cookie.emails.length!=0) {
		res.locals.loggedIn = true;
    }
	next()
})

router.all('/signout',function(req, res, next){
	if(req.session.cookie.emails.length==0) {
        res.redirect('/account/signin')
	}else{
		res.locals.loggedIn = true;
		next()
	}
})

router.get('/signin', function(req, res){
	res.render('signin');
})

router.post('/signin', function(req, res){
	var login = function (email,password){
		var db = new DataBase('dbCloud.txt')
		if (db.getUser(email)===undefined){
			return false
		} else {
			return true
		}
	}
	if (req.body.mode==='normal'){
		if (req.session.cookie.emails.map(function(e){return e.email;}).includes(req.body.email)){
			res.render('signin',{already:true,email:req.body.email});
		} else {
			var succ = login(req.body.email) 
			if (!succ) {
				res.render('signin',{accountNotFound:true});
			} else {
				req.session.cookie.emails.push({'email':req.body.email});
				res.redirect('/');
			}	
		}
	} else if (req.body.mode==='json'){//TODO fix it after embedding fitbit
		try{
			var o = JSON.parse(req.body.json)
		}catch(e){
			res.render('signin',{badCommand:true})
			return
		}
		if (o.users===undefined||
			o.users[0].email===undefined||
			o.users[0].password===undefined||
			o.users[0].password.misfit===undefined||
			o.start_date===undefined||
			o.end_date===undefined)
		{
			res.render('signin',{badCommand:true})
			return
		}
		var i =-1
		var iterate = function(){
			++i;
			if(i<o.users.length){
				var data= {	
					email:o.users[i].email,
					password:o.users[i].password,	//FORMAT CHANGED
					type:Object.keys(o.users[i].password),			//FORMAT CHANGED
				}
				register(req,res,data,function(){iterate()},function(){res.render('signin',{wrongPassword:true})})
			}else{
				dh.getData(
					dh.datestr2tstamp(o.start_date),
					dh.datestr2tstamp(o.end_date),
					o.users,
					req.oa_misfit,
					function(data){
						data.sendFile=true
						res.render('signin',data)//PLEASE UPDATE HBS
					}
				)
			}
		}
		iterate()
	}
})

var cbSuccess=function(req,res){
	res.render('reg',{success:true})
}

var cbError=function(res,page,errorDetails){
	res.render(page,errorDetails)
}

var cbNothingChanged=function(req,res){
	res.render('reg',{nothingChanged:true})
}

router.get('/reg', function(req, res){
	res.render('reg');
})

router.post('/reg', function(req, res){
	var reqBody = req.body
	reqBody.password= JSON.parse(reqBody.password)
	reqBody.type    = JSON.parse(reqBody.type    )
	register(req,res,reqBody,cbSuccess,cbError,cbNothingChanged)
})

var register = (req,res,formData,cbSuccess,cbError,cbNothingChanged=cbSuccess) => {	
	var db = new DataBase('dbCloud.txt')
	var dbUser = db.getUser(formData.email)
	var anyPasswordChanged = false
	if (dbUser){
		Object.keys(formData.password).forEach(key => {
			if (formData.password[key]!==dbUser.password[key]){
				anyPasswordChanged = true
			}
		})
	}
	if(!dbUser || anyPasswordChanged){
		if (formData.type.includes('misfit')){
			loginMisfit.login(formData.email, formData.password.misfit, (e,results, sid) => {
				if (e) {
					console.log(e);
					cbError(res,'reg',{wrongPassword:true})
				} else {
					db.setUser(formData.email, {misfit:formData.password.misfit},['misfit'])
					req.oa_misfit.get(cfg.misfit.signoutURL, results.access_token, (e, response) => {
						cbSuccess(req,res)
					})
				}	
			})
		}
	}else{
		cbNothingChanged(req,res)
	}		
}

router.get('/signout', function(req, res){
	res.locals.loggedIn = true;
	res.render('signout',{emails : req.session.cookie.emails});
})

router.post('/signout', function(req, res){
	req.session.cookie.emails.forEach(function (item,index,object){
		if (item['email']==req.body.email) {
			req.session.cookie.emails.splice(index,1)
		}
	})
	res.redirect('/')
})

module.exports = router