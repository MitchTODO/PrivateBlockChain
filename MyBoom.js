
// basic error handling for api 
class Error
{

    badRequest(res, message){
        res.status(400);
        res.setHeader('Content-Type','text/json',);
        res.json(message);
        res.end();
    };
    unauthorized(res, message){
        res.status(401);
        res.setHeader('Content-Type','text/json',);
        res.json(message);
        res.end();
    };
    notFound(res,message){
        res.status(404)
        res.setHeader('Content-Type','text/json',);
        res.json(message);
        res.end();
    };
    conflict(res, message){
        res.status(409)
        res.setHeader('Content-Type','text/json',);
        res.json(message);
        res.end();
    };

    resourceGone(res, message){
        res.status(410);
        res.setHeader('Content-Type','text/json',);
        res.json(message);
        res.end();
    };

    badImplementation(res, message){
        res.status(500);
        res.setHeader('Content-Type','text/json',);
        res.json(message);
        res.end();
    };
}

module.exports.Error = Error;