// Login steps:
// 1. curl -vvvv "https://api.misfitwearables.com/auth/dialog/authorize?response_type=code&client_id=auAJAvkgvuxjdW3Y&scope=public,birthday,email&redirect_uri=http://127.0.0.1:28888/signin/callback"
// 2. curl -vvvv -X POST --data "email=eltehealth1%40gmail.com&password=almafa83" -H "Cookie: connect.sid=s%3AI3dDAmmGDW9hnGz2heXZ7OGm.sF%2BpFwPkgtUTNzvtI4ZagqR%2BQZJ93nwmkEbHfsDYgFc"  "https://api.misfitwearables.com/auth/users/session"
// 3. curl -vvvv -H "Cookie: connect.sid=s%3AI3dDAmmGDW9hnGz2heXZ7OGm.sF%2BpFwPkgtUTNzvtI4ZagqR%2BQZJ93nwmkEbHfsDYgFc"  "https://api.misfitwearables.com/auth/dialog/authorize?response_type=code&client_id=auAJAvkgvuxjdW3Y&scope=public,birthday,email&redirect_uri=http://127.0.0.1:28888/signin/callback"


var OAuth2Misfit = require('./oauth2_misfit').OAuth2Misfit;
var cfg = require('./cfg');

// config data from cfg.js file
var client_id = cfg.misfit.client_id;
var client_secret = cfg.misfit.client_secret;
var idmURL = cfg.misfit.idmURL;
var callbackURL = cfg.misfit.callbackURL;

// Creates oauth library object with the config data
var oa = new OAuth2Misfit(	client_id,
									client_secret,
									idmURL,
									'/auth/dialog/authorize',
									'/auth/tokens/exchange',
									callbackURL )

exports.login = function(username, password, callback) {
	var path = oa.getAuthorizeUrl()
	oa.getSID( path, null, function(error, sid) {
		if (error) {
			console.log('E1: '+error)
			callback (error, undefined,undefined)
		}else {
			console.log('SID:'+sid)
			oa.getSession(cfg.misfit.getSessionURL, sid, username, password, function(error, c) {
				if (error) {
					console.log('E1: '+error);
					callback (error, undefined,undefined)
				} else {
					//this time it returns authorization code instead of session id
					oa.getSID( path, sid, function(error, code) {
						if (error) {
							console.log('E1: '+error);
							callback (error, undefined,undefined)
						}
						console.log('CODE:'+code);
						oa.getOAuthAccessToken(code, function(e2,r2) {
							callback(e2,r2,sid);//e,results,sid(session id)
						})
					})
				}
			})
		}
	})
}

