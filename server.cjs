const http=require("http"),fs=require("fs"),path=require("path"),https=require("https"),url=require("url");
const root=__dirname,port=9090;
const b64="ODY1Njg1MTg3MjpBQUg0TGhaYUpOZ1pRT29hdFBOcTl3NC1RU0QzS3loRTJDWQ==";
const token=process.env.TELEGRAM_BOT_TOKEN||Buffer.from(b64,"base64").toString("utf-8");
const types={".html":"text/html;charset=utf-8",".css":"text/css",".js":"text/javascript",".png":"image/png",".jpg":"image/jpeg",".svg":"image/svg+xml",".json":"application/json"};

function apiTelegram(method,params,res,cb){
    const body=JSON.stringify(params);
    const opts={
        hostname:"api.telegram.org",
        path:`/bot${token}/${method}`,
        method:"POST",
        headers:{"Content-Type":"application/json","Content-Length":Buffer.byteLength(body)}
    };
    const req=https.request(opts,r=>{
        let data="";
        r.on("data",c=>data+=c);
        r.on("end",()=>{
            if(cb)return cb(JSON.parse(data));
            res.setHeader("Access-Control-Allow-Origin","*");
            res.setHeader("Content-Type","application/json");
            res.end(data);
        });
    });
    req.on("error",e=>{
        if(cb)return cb({ok:false,description:e.message});
        res.setHeader("Access-Control-Allow-Origin","*");
        res.end(JSON.stringify({ok:false,description:e.message}));
    });
    req.write(body);
    req.end();
}

http.createServer((req,res)=>{
    const parsed=url.parse(req.url,true);
    const pathname=parsed.pathname;

    // CORS preflight
    if(req.method==="OPTIONS"){
        res.writeHead(204,{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"});
        return res.end();
    }

    // API proxy
    if(pathname==="/api/telegram"){
        const {method,raw,...params}=parsed.query;
        if(raw){
            // Serve file from Telegram
            const filePath=`/file/bot${token}/${raw}`;
            const opts={hostname:"api.telegram.org",path:filePath,method:"GET"};
            const proxy=https.request(opts,r=>{
                res.writeHead(r.statusCode,{"Access-Control-Allow-Origin":"*","Cache-Control":"public, max-age=86400","Content-Type":r.headers["content-type"]||"image/jpeg"});
                r.pipe(res);
            });
            proxy.on("error",e=>{res.writeHead(500);res.end()});
            proxy.end();
        }else if(method){
            apiTelegram(method,params,res);
        }else{
            res.writeHead(400,{"Content-Type":"application/json"});
            res.end(JSON.stringify({ok:false,description:"Missing method"}));
        }
        return;
    }

    // Static files
    let file=path.join(root,pathname==="/"?"/camera.html":pathname);
    if(!fs.existsSync(file)){
        res.writeHead(404);
        res.end();
        return;
    }
    const ext=path.extname(file);
    res.writeHead(200,{"Content-Type":types[ext]||"text/plain","Access-Control-Allow-Origin":"*"});
    fs.createReadStream(file).pipe(res);
}).listen(port,"0.0.0.0",()=>console.log("http://0.0.0.0:"+port+"/camera.html"));
