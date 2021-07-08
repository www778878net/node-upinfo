
const Util = require('util');
import 'node-date78';

 
export default class UpInfo {
    //一次配置后不变
    cidguest: string = "";//测试帐套
    cidmy: string = "";//管理员帐套
    sidguest: string = "";//guest用户的id
    sidadmin: string = "";//管理员用户的id

    //数据获取非必填字段
    getstart: number = 0;//sql分页 limit getstart,getnumber
    getnumber: number = 1000;//sql分页 limit getstart,getnumber
    mid: string="";//行id

    order: string = "idpk desc";//sql order by 
    bcid: string = "";  //调用其它帐套资料  
    pars: string[]  = [];//上传参数列表
    cols: string[] = [];//上传列名列表
    jsonbase64: boolean=true;//JSON化后再BASE64
    jsonp: boolean=false;//是否跨域访问
    upid: string="";//请求号

    //调试 监控用
    debug: boolean = false;//跟踪某用户
    pcid: string = "";//机器码
    pcname: string = "";//电脑名
    source: string = "web";//软件来源 web python c#
    v: number = 17;//api版本号 （新旧兼容 根据不同的版本号实现不同的逻辑)
    cache: string = "";//防重放攻击(垃圾360 垃圾腾迅 跟踪用户请求)

    //自动获取或服务器生成
    ip: string = "";//客户端IP
    ctx: any;//ctx暂存
    method: string = "";//调用方法

    apiv: string = "";//调用API版本（用于日志）
    apisys: string = "";//调用API目录（用于日志）
    apiobj: string = "";//调用API对象（用于日志）
    uptime: Date = new Date();//上传时间 
    utime: string = this.uptime.format()//简化文本的日期
    errmessage: string = "";//返回错误信息

    //上传临时存 验证后再用
    cidn: string = "";//未验证的cid
    parsn: string = "";//未验证的cid
    colsn: string = "";//列名列表未验证

    //需数据库读取验证
    sid: string = "";//会话ID
    cid: string = "";//先存临时验证后转 防忘记
    uid: string = "";//用户ID
    coname: string = '测试帐套';//帐套名
    uname: string ="";//用户名

    pwd: string = "";//不限制多地登录的场合
    weixin: string = "";//需要权限的要绑定微信 
    idceo: string = "";//管理员UID 有些功能只能帐套管理员操作的
    truename: string = "";//真实姓名   
    mobile: string = "";//手机号码 
    idpk: number = 0;//用户编号idpk

    //返回用
    res: number = 0;//错误码
    errmsg: string = "";//出错信息
    backtype: string = "json";//返回类型 默认json 可为string


    



    constructor(ctx: any) {
        
        if (ctx == null)
            return;
        this.upid = this.getNewid();//请求号
        this.ctx = ctx;
        let req = ctx.request;

        this.apisys = ctx.params.msys;
        this.apiobj = ctx.params.apiobj;


        let pars: any = null;
        if (req.method == "GET") {
            pars = req.query;

        } else if (req.method == "POST") {
            pars = req.fields;
            if (pars == undefined)
                pars = req.body;
        } else if (req.method == "SOCK") {
            pars = req.fields;
        }

        this.method = req.path;

        if (pars == undefined) return;

        this.bcid = pars["bcid"] || this.cidmy;
        this.v = req.header['v'] || pars["v"] || 17;//api版本号
        this.getstart = +pars["getstart"] || 0;
        this.parsn = pars["pars[]"] || pars["pars"] || "";
        this.source = req.header['source'] || pars["source"] || 'no';
        this.uname = req.header['uname'] || pars["uname"] || 'guest';
        this.pwd = req.header['pwd'] || pars["pwd"] || '';//不限制多地登录
        this.sid = req.header['sid'] || pars["sid"] || '';
        this.mid = pars["mid"] || this.getNewid();
        this.getnumber = +pars["getnumber"] || 1000;
        this.pcid = req.header['pcid'] || pars["pcid"] || '';//机器码
        this.pcname = req.header['pcname'] || pars["pcname"] || '';//机器码
        this.ip = req.header['x-forwarded-for'] || ctx.req.connection.remoteAddress || "";//这里NGINX已经处理了
        let i = this.ip.indexOf("ffff");
        if (i >= 0) {//::ffff:
            this.ip = this.ip.substring(i + 5, this.ip.length);
        }
        this.colsn = pars["cols[]"] || pars["cols"] || '["all"]';

        this.order = pars["order"] || 'idpk';
 
        this.jsonp = pars["jsonp"] || false;//支持跨域
        this.backtype = pars["backtype"] || "json";
        this.cache = req.header['cache'] || pars["cache"] || '';//随机码 防重放攻击

        if (typeof this.colsn === 'string')
            this.cols = JSON.parse(this.colsn);




        if (this.v >= 17.01) {
            this.jsonbase64 = pars["jsonbase64"] || true;//下版默认为真         
            //pcname uname改base64编码了
            this.uname = new Buffer(this.uname.replace(/\*/g, "+").replace(/-/g, "/").replace(/\./g, "="), 'base64').toString();
            if (this.pcname != "") {
                this.pcname = new Buffer(this.pcname.replace(/\*/g, "+").replace(/-/g, "/").replace(/\./g, "="), 'base64').toString();
            }
        } else if (this.v == 17) { //下版删除           
            this.jsonbase64 = pars["jsonbase64"] || false;//下版默认为真

            this.cidn = pars["cid"] || "";//下版删除 不用上传直接获取 
        }



        if (this.parsn == "") {
            this.pars = [];
            return;
        }
       
        if (this.jsonbase64) {
            try {
               
                 let partmp= new Buffer(this.parsn.replace(/\*/g, "+").replace(/-/g, "/").replace(/\./g, "="), 'base64').toString();

                if (partmp != "null")
                    this.pars = JSON.parse(partmp);
                else this.pars = [];
               
            } catch (e) {
                console.log("jsonbase eval err:" + Util.inspect(e));
                console.log(this.method + Util.inspect(this.colsn) + "jsonbase eval err:" + Util.inspect(this.pars));
            }
        } 



    }


    //直接获取管理员用户 通常是测试
    getMaster(): UpInfo {
        let up2 = new UpInfo(null);
        up2.sid = this.sidadmin;
        up2.cid = this.cidmy;
        up2.bcid = this.cidmy;
        up2.mid = this.getNewid();
        up2.uname = 'sysservices';
        up2.pars = [];
        up2.getstart = 0;
        up2.ip = "127.0.0.1";
        return up2;
    };

    //获取guest用户信息 通常是测试
    getGuest(): UpInfo {
        let up2 = new UpInfo(null);
        up2.sid = this.sidguest;
        up2.cid = this.cidguest;
        up2.bcid = this.cidmy;
        up2.mid = this.getNewid();
        up2.uname = 'guest';
        up2.pars = [];
        up2.getstart = 0;
        up2.ip = "127.0.0.1";
        return up2;
    };

    //UUID
    getNewid(): string {
        function s4(): string {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16).substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }


    //是否在数组中
    inArray(o: string, cols: string[]): boolean {
        for (var i = 0; i < cols.length; i++) {
            if (o === cols[i])
                return true;
        }
        return false;
    }

    //验证cols是否合法
    checkCols(cols): boolean {

        if (this.cols.length === 1 && (this.cols[0] === 'all' || this.cols[0] === 'idpk')) {
            return true;
        }
        var isback = true;
        try {
            this.cols.forEach((item) => {
                if (!this.inArray(item, cols))
                    isback = false;
            });
        } catch (e) {
            console.log("checkCols err" + e);
            return false;
        }

        return isback;
    };
    //验证ORDER是否合法
    inOrder(cols: string[]): boolean {
        var isin = true;

        var orders = this.order.split(",");
        for (var i = 0; i < orders.length; i++) {
            var o = orders[i];
            //如果有desc
            var ll = o.indexOf(" desc");
            if (ll >= 0 && ll === o.length - 5)
                o = o.substr(0, ll);
            if (o === 'id' || o === 'idpk' || o === 'uptime' || o === 'upby')
                continue;

            if (o !== 'id' && o !== 'idpk' && !this.inArray(o, cols)) {
                return false;
            }
        }
        return isin;
    };



}