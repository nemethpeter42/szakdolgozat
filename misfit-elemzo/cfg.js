var cfg = {}

cfg.misfit={}

//BASIC
cfg.misfit.idmURL = 'https://api.misfitwearables.com'
cfg.misfit.client_id = '****************'
cfg.misfit.client_secret = '********************************'
cfg.misfit.callbackURL = 'http://127.0.0.1:28888/signin/callback'
cfg.misfit.getSessionURL = cfg.misfit.idmURL + '/auth/users/session'
//MISC
cfg.misfit.profileURL = cfg.misfit.idmURL + '/move/resource/v1/user/me/profile'
cfg.misfit.deviceURL = cfg.misfit.idmURL + '/move/resource/v1/user/me/device'
cfg.misfit.sessionsURL = (start_date,end_date) => cfg.misfit.idmURL + '/move/resource/v1/user/me/activity/sessions?start_date=' + start_date+'&end_date=' + end_date
cfg.misfit.summaryURL = (start_date,end_date) => cfg.misfit.idmURL + '/move/resource/v1/user/me/activity/summary?start_date=' + start_date+'&end_date=' + end_date + '&detail=true'
cfg.misfit.sleepsURL = (start_date,end_date) => cfg.misfit.idmURL + '/move/resource/v1/user/me/activity/sleeps?start_date=' + start_date+'&end_date=' + end_date + '&detail=true'
cfg.misfit.signoutURL = cfg.misfit.idmURL +'/auth/logout'

module.exports = cfg;
