var dh= {}

var LoginMisfit = require('../login_misfit.js')
var cfg = require('../cfg.js')
var fs = require('fs')

Date.prototype.sameOrEarlierDayThan = function(d) {
	if (this.getFullYear() < d.getFullYear()){
		return true
	}
	if (this.getFullYear() === d.getFullYear()){
		if(this.getMonth() < d.getMonth()){
			return true
		}
	}
	if (this.getFullYear() === d.getFullYear()){
		if(this.getMonth() === d.getMonth()){
			if(this.getDate() <= d.getDate()){
				return true
			}
		}
	}
	return false
}

Date.prototype.sameOrLaterDayThan = function(d) {
	if (this.getFullYear() > d.getFullYear()){
		return true
	}
	if (this.getFullYear() === d.getFullYear()){
		if(this.getMonth() > d.getMonth()){
			return true
		}
	}
	if (this.getFullYear() === d.getFullYear()){
		if(this.getMonth() === d.getMonth()){
			if(this.getDate() >= d.getDate()){
				return true
			}
		}
	}
	return false
}

Date.prototype.sameDay = function(d) {
	return this.getFullYear() === d.getFullYear()
	&& this.getDate() === d.getDate()
	&& this.getMonth() === d.getMonth()
}

var tstamp2inputFormat  = function(date){
	function pad(n) {
		return (n < 10) ? ('0' + n) : n
	}
	return (pad(date.getMonth()+1)) +'/'+pad(date.getDate())+'/'+date.getFullYear()
}

var tstamp2datestr = function(date){
	var dateString = date.getFullYear() +'-'+(date.getMonth()+1) +'-'+date.getDate()
	return dateString
}
dh.tstamp2datestr=tstamp2datestr

var datestr2tstamp = function(s){
	var slices = s.split('-')
	var month = parseInt(slices[1])
	var day = parseInt(slices[2])
	var year = parseInt(slices[0])
	var timeStamp = new Date(month+'/'+day+'/'+year)
	return timeStamp
}
dh.datestr2tstamp = datestr2tstamp

var oneDayUnit=24*3600*1000

dh.DataBase=function(fn){
	
	/* locks database if detects problem while reading in the memory or writing out */
	this._working=false
	this._data={}
	try{
		if (!fs.existsSync(fn)) {
			var obj ={}
			fs.writeFileSync(fn, JSON.stringify(obj), 'utf8')
		}
		_data=JSON.parse(fs.readFileSync(fn,'utf-8'))
		_working=true
	}catch(err){
		_working=false
		console.log('Adatbazis Hiba inicializalasnal!\n'+err)
	}
	
	this.get=function(email,type,table,row){//ORDER CHANGED
		if (!_data[email][type]){
			return undefined
		}
		if (!_data[email][type][table]){
			return undefined
		}
		return _data[email][type][table][row]
	}
	
	this.getUser=function(email){
		if (_data[email]){
			return {
				password:_data[email].password,
				type:_data[email].type
			}
		} else {
			return undefined
		}
	}
	
	this.setUser=function(email,password,type){
		try{
			if (_working===true){
				if (_data[email]===undefined){
					_data[email]={}
				}
				if (!_data[email].password){
					_data[email].password={}
				}
				Object.keys(password).forEach(key => {
					_data[email].password[key]=password[key]
				})
				if (!_data[email].type){
					_data[email].type=[]
				}
				type.forEach(e => {
					if (!_data[email].type.includes(e)){
						_data[email].type.push(e)
					}
				})
				fs.writeFileSync(fn, JSON.stringify(_data), 'utf8')
			}	
		} catch(err) {
			_working=false
			console.log('Adatbazis Hiba felhasznalo letrehozasanal!\n'+err)
		}
	}
	
	this.addComment = (email,datestr,content) => {
		var idx
		try{
			if (_working===true){
				if (_data[email].comments===undefined){
					_data[email].comments={}
				}
				if (_data[email].comments[datestr]===undefined){
					_data[email].comments[datestr]=[]
				}
				_data[email].comments[datestr].push(content)
				idx = _data[email].comments[datestr].length - 1
				fs.writeFileSync(fn, JSON.stringify(_data), 'utf8')
			}
		} catch(err) {
			_working=false
			console.log('Adatbazis Hiba komment letrehozasanal!\n'+err)
			return {
				err:'Adatbazis Hiba komment letrehozasanal!\n'+err,
			}
		}
		return {
			idx:idx,
		}
	}
	
	this.editComment = (email,datestr,idx,content) => {
		try{
			if (_working===true){
				_data[email].comments[datestr][idx]=content
				fs.writeFileSync(fn, JSON.stringify(_data), 'utf8')
			}
		} catch(err) {
			_working=false
			console.log('Adatbazis Hiba komment szerkesztesenel!\n'+err)
			return {
				err:'Adatbazis Hiba komment letrehozasanal!\n'+err,
			}
		}
		return {}
	}
	
	this.removeComment = (email,datestr,idx) => {
		try{
			if (_working===true){
				_data[email].comments[datestr].splice(idx,1)
				fs.writeFileSync(fn, JSON.stringify(_data), 'utf8')
			}
		}catch(err){
			_working=false
			console.log('Adatbazis Hiba komment torlesenel!\n'+err)
			return {
				err:'Adatbazis Hiba komment letrehozasanal!\n'+err,
			}
		}
		return {}
	}
	
	this.getComments = (email,ts1,ts2) => {
		if (!_data[email].comments){
			return []
		}
		arr=[]
		Object.keys(_data[email].comments).forEach(day => {
			var ts = new Date(day)
			if (ts.sameOrLaterDayThan(ts1)&&ts.sameOrEarlierDayThan(ts2)){
				_data[email].comments[day].forEach((content,idx) => {
					arr.push({
						email:email,
						date:day,
						idx:idx,
						content:content,
					})
				})
			}
		})
		return arr
	}
	
	this.update = function(inputData,email,ts1,ts2){
		try{
			if (_working===true){
				if (this.getUser(email).type.includes('misfit')){
					if(!_data[email].misfit){
						_data[email].misfit={
							sessions:{},
							summary :{},
							sleeps  :{},
						}
					}
					
					var ts= new Date(ts1.getTime())
					
					while(ts.sameOrEarlierDayThan(ts2)){
						var d = tstamp2datestr(new Date(ts))
						//only writes in an empty date entry
						if(!_data[email].misfit.sessions[d]){
							_data[email].misfit.sessions[d]=[]
							inputData.misfit.sessions.filter(function(e){//TODO check function that call Database.update
								var e_ts = new Date(e.timestamp1)
								return e_ts.sameDay(ts)
							}).forEach(function(elem){
								var d = tstamp2datestr(new Date(elem.timestamp1))
								_data[email].misfit.sessions[d].push(elem)
							}.bind(this))
							// bind(this) inject scope of this inside forEach
						}	
						if(!_data[email].misfit.summary[d]){
							_data[email].misfit.summary[d]=[]
							inputData.misfit.summary.filter(function(e){
								var e_ts = new Date(e.timestamp1)
								return e_ts.sameDay(ts)
							}).forEach(function(elem){
								var d = tstamp2datestr(new Date(elem.timestamp1))
								_data[email].misfit.summary[d].push(elem)
							}.bind(this))
						}
						if(!_data[email].misfit.sleeps[d]){
							_data[email].misfit.sleeps[d]=[]
							inputData.misfit.sleeps.filter(function(e){
								var e_ts = new Date(e.timestamp1)
								return e_ts.sameDay(ts)
							}).forEach(function(elem){
								var d = tstamp2datestr(new Date(elem.timestamp1))
								_data[email].misfit.sleeps[d].push(elem)
							}.bind(this))
						}
						ts.setDate(ts.getDate()+1)
					}
				}
				//if everything went well, the database handler writes out data
				fs.writeFileSync(fn, JSON.stringify(_data), 'utf8')
			}
		}catch(err){
			_workin=false
			console.log('Adatbazis Hiba frissitesnel!\n'+err)
		}
	}
}

dh.addComment = (email,datestr,content) => {
	var db = new dh.DataBase('dbCloud.txt')
	return db.addComment(email,datestr,content)
}

dh.editComment = (email,datestr,idx,content) => {
	var db = new dh.DataBase('dbCloud.txt')
	return db.editComment(email,datestr,idx,content)
}

dh.removeComment = (email,datestr,idx) => {
	var db = new dh.DataBase('dbCloud.txt')
	return db.removeComment(email,datestr,idx)
}

dh.getData=function(ts1,ts2,emails,oa,callback){
	var db = new dh.DataBase('dbCloud.txt')
	var getDataFromMisfitCloud = (ts1,ts2,email,callback) => {
		var sessions = []
		var summary = []
		var sleeps = []
		
		var sessionsByOneEmail = []
		var summaryByOneEmail = []
		var sleepsByOneEmail = []
		
		var i=-1
		var iterate = function(){
			var datumok = []
			var ts=new Date(ts1.getTime())
			while((ts2-(ts.getTime()+30*oneDayUnit))/(oneDayUnit)>0){
				datumok.push({
					'start_date':tstamp2datestr(ts),
					'end_date':tstamp2datestr(new Date (ts.getTime() + 30 * oneDayUnit)),
				})
				ts.setDate(ts.getDate()+31)	
			}
			datumok.push({'start_date':tstamp2datestr(ts),'end_date':tstamp2datestr(ts2)})
			var acquire = (email,token) => {
				if (datumok.length>0){
					var akt = datumok[datumok.length-1]
					console.log(akt)
					var endPoints = [
						{
							'url': cfg.misfit.sessionsURL(akt.start_date,akt.end_date),
							'fn': (raw) => {
								/*
								'sessions':[
									{
										'id':'51a4189acf12e53f82000001',
										'activityType':'Cycling',
										'startTime':'2014-05-19T10:26:54-04:00',
										'duration':900,
										'points':210.8,
										'steps':1406,
										'calories':25.7325,
										'distance':0.5125
									},
									...
								]
								*/
								raw.sessions.forEach( function(e) {
									var timestamp1 = new Date(e.startTime).toJSON()
									var timestamp2 = new Date(new Date(e.startTime).getTime() + 1000*e.duration).toJSON()
									sessionsByOneEmail.push({
										timestamp1:timestamp1,
										timestamp2:timestamp2,
										points:e.points,
										steps:e.steps,
										calories:e.calories,
										distance:e.distance*1.609344,
										email:email,
										activity:e.activityType.toLowerCase(),
									})
								})
							},
						},	
						{
							'url': cfg.misfit.summaryURL(akt.start_date,akt.end_date),
							'fn': (raw) => {
								/*
								'summary': [
									{
										'date': '2013-11-05',
										'points': 394.4,
										'steps': 3650,
										'calories': 1687.4735,
										'activityCalories': 412.3124,
										'distance': 1.18
									},
									...
								]
								*/
								raw.summary.forEach( function(e) {
									var timestamp1 = new Date(e.date).toJSON()
									var timestamp2 = new Date(new Date(e.date).getTime() + 1000*3600*24).toJSON()
									summaryByOneEmail.push({
										timestamp1:timestamp1,
										timestamp2:timestamp2,
										points:e.points,
										steps:e.steps,
										calories:e.calories,
										activityCalories:e.activityCalories,
										distance:e.distance*1.609344,
										email:email,
									})
								})
							},
						},
						{
							'url': cfg.misfit.sleepsURL(akt.start_date,akt.end_date),
							'fn': (raw) => {
								/*'sleeps':[
									{ 
										'id':'51a4189acf12e53f80000003',
										'autoDetected': false,
										'startTime':'2014-05-19T23:26:54+07:00',
										'duration': 0,
										'sleepDetails':[
										  {
											 'datetime':'2014-05-19T23:26:54+07:00',
											 'value':2
										  },
										  {
											 'datetime':'2014-05-19T23:59:22+07:00',
											 'value':1
											},
											...
										]
									},
									...
								]
								*/
								raw.sleeps.forEach( e => {
									// duration is not always correct, sometimes the calculated endpoint comes
									// earlier than the last timestamp in the sleepDetails array,
									// and i can only guess the reason
									// on other api endpoints (sessions, summary) the duration clearly works
									var totalEnd =  new Date(new Date(e.startTime).getTime()+1000*e.duration).toJSON()
									e.sleepDetails.forEach( (f,i) => {
										var timestamp1 = new Date(new Date(f.datetime).getTime()).toJSON()
										if (i<e.sleepDetails.length-1){
											var nxt = e.sleepDetails[i+1]
											var timestamp2 = new Date(new Date(nxt.datetime).getTime()).toJSON()
										} else {
											var timestamp2 = totalEnd
										}
										var newItem = {
											timestamp1: timestamp1,
											timestamp2: timestamp2,
											val: f['value'],
											email: email,
										}
										sleepsByOneEmail.push(newItem)
									})
								})
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
							oa.get(endPoints[endPointsNr].url, token, (e, res) => {
								if (res!==undefined&&!e){
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
								callback ({
									err: true,
								})
								return
							}
							var akarmi=datumok.pop()
							console.log(akarmi)
							acquire(email,token)
						}
					}
					endPointsStep()
				} else {
					var updateParam = {
						misfit: {
							sessions:	sessionsByOneEmail,
							summary:		summaryByOneEmail,
							sleeps:		sleepsByOneEmail,
						}
					}
					db.update(updateParam,email,ts1,ts2)
					sessionsByOneEmail.forEach(e => {
						sessions.push(e)
					})
					summaryByOneEmail.forEach(e => {
						summary.push(e)
					})
					sleepsByOneEmail.forEach(e => {
						sleeps.push(e)
					})
					sessionsByOneEmail = []
					summaryByOneEmail = []
					sleepsByOneEmail = []
					oa.get(cfg.misfit.signoutURL, token, (e, response) => {
						iterate()
					})
				}
			}
			i++//első használatkor nulla lesz
			if(i<1){
				var pwMisfit = db.getUser(email).password.misfit
				LoginMisfit.login(email, pwMisfit, (err,results, sid) => {
					if (err) {
						console.log(err)
						callback ({
							err: true,
						})
					} else {
						acquire(email,results.access_token)
					}
				})
			} else {
				callback ({
					sessions : sessions,
					summary : summary,
					sleeps : sleeps,
				})
			}
		}
		iterate()
	}

	var difference = Math.ceil((ts2-ts1) / oneDayUnit)
	
	var start_date = ts1.getFullYear() + '-' + (ts1.getMonth() + 1) + '-' + ts1.getDate()
	var   end_date = ts2.getFullYear() + '-' + (ts2.getMonth() + 1) + '-' + ts2.getDate()
	var tomorrow = function(date){
		return new Date(date.getFullYear(),date.getMonth(),date.getDate()+1)
	}
	var ts=new Date(ts1.getTime())
	var dates = []
	var queryPairs=[]
	var misfitData={
		sessions:[],
		summary:[],
		sleeps:[],
	}
	var comments= []
	for(var i = 0; i <= difference; ++i){
		dates.push(tstamp2datestr(ts))
		ts.setDate(ts.getDate()+1)
	}
	emails.forEach(e => {
		var cmt = db.getComments(e.email,ts1,ts2)
		cmt.forEach(function(elem){
			comments.push(elem)
		})
		var missingDates = []
		dates.forEach(function(date){
			var ses = db.get(e.email,'misfit','sessions',date)
			var sum = db.get(e.email,'misfit','summary',date)
			var slp = db.get(e.email,'misfit','sleeps',date)
			if(ses&&sum&&slp){
				ses.forEach(function(elem){
					misfitData.sessions.push(elem)
				})
				sum.forEach(function(elem){
					misfitData.summary.push(elem)
				})
				slp.forEach(function(elem){
					misfitData.sleeps.push(elem)
				})
			}else{
				missingDates.push(date)
			}
		})
		for(var i = 0; i < missingDates.length; ++i){
			var pair = {
				email: e.email,
				day1:  datestr2tstamp(missingDates[i]),
				day2:  datestr2tstamp(missingDates[i]),
				type:  'misfit',
			}
			for(var j = i + 1; j < missingDates.length; ++j){
				var day = datestr2tstamp(missingDates[j])
				if(day.sameDay(tomorrow(pair.day2))){
					pair.day2 = day
					if (j + 1 === missingDates.length){
						i = j
					}
				}else{
					i = j - 1
					break
				}
			}
			queryPairs.push(pair)
		}
	})
	var i = 0
	var recursiveIterate = () => {
		if(i<queryPairs.length){
			var day1=queryPairs[i]['day1']
			var day2=queryPairs[i]['day2']
			var email=queryPairs[i]['email']
			if (queryPairs[i].type==='misfit'){
				getDataFromMisfitCloud(day1,day2,email,(data) => {
					if (data.err===true){
						callback({networkError:true})
						return
					}
					data.sessions.forEach(function(elem){
						misfitData.sessions.push(elem)
					})
					data.summary.forEach(function(elem){
						misfitData.summary.push(elem)
					})
					data.sleeps.forEach(function(elem){
						misfitData.sleeps.push(elem)
					})
					++i
					recursiveIterate()
				})
			}
		} else {
			callback({
				misfitData:JSON.stringify(misfitData),
				comments:comments,
				start_date : tstamp2inputFormat(datestr2tstamp(start_date)), 
				end_date : tstamp2inputFormat(datestr2tstamp(end_date)),
				selectedEmail:emails[0].email,
				sendFile:false,
				misfit:true,
			})
		}
	}
	recursiveIterate()
}

module.exports = dh
