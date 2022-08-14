var mqtt = require("mqtt");
var mysql = require("mysql");
var mail = require("./module/sendMail");

var pool = mysql.createPool({
  host: "124.223.212.144",
  user: "root",
  password: "8198",
  port: "3306",
  database: "work",
  connectionLimit: 100,
});

const routes = require("./module/routes");
const { url } = require("inspector");
const { all } = require("async");

var mqttUrl = "mqtt://124.223.212.144:61613";
var option = {
  username: "admin",
  password: "password",
  clientId: "lightFollow",
};

var app = require("http").createServer(handler),
  io = require("socket.io")(app),
  fs = require("fs");

function handler(req, res) {
  routes.static(req, res, "static");
  res.writeHead(200, { "Content-Type": 'text/html;charset="utf-8"' });
  res.end();
}

var client = mqtt.connect(mqttUrl, option);
//订阅的MQTT主题
client.subscribe("Mymqtt/follow/willMessage", { qos: 0 }); //设备一的状态信息
client.subscribe("Mymqtt/follow/dht11", { qos: 0 }); //用电信息
console.log("订阅成功");

global.willMessage1 = "客户端离线";
global.time = "2021.10.07";
global.json = "**";
global.electricity = "**";
var lasttime = new Date().getTime();

client.on("message", function (topic, message) {
  // console.log("主题：" + topic + "  消息：" + message.toString());
  if (topic == "Mymqtt/follow/willMessage") {
    willMessage1 = message.toString();
  } else if (topic == "Mymqtt/follow/dht11") {
    var json = JSON.parse(message.toString());
    nowTime = new Date().toLocaleTimeString("chinese", { hour12: false });
    if (time != nowTime) {
      //将温湿度信息插入到数据库中
      var addFollow = "INSERT INTO follow(temp, humi, rain, light) VALUES(?,?,?,?)";
      var temp = json.temp;
      var humi = json.humi;
      console.log(humi)
      var rain = json.rain;
      var light = json.light;

      var addSqlParams = [temp, humi, rain, light];

      pool.getConnection(function (err, connection) {
        if (err) throw err;
        connection.query(addFollow, addSqlParams, function (err, result) {
          if (err) {
            console.log("[INSERT ERROR] - ", err.message);
            return;
          }
          console.log("Insert successfully");
        });
        connection.release();
      });

      time = nowTime;
    }
  }
});

io.on("connection", function (socket) {

  //向前端发送从数据库中获取到的最近10条数据
  socket.on("getMessage", function (data) {
    let mydata = [];
    pool.getConnection(function (err, conn) {
      if (err) throw err;
      conn.query(
        "select * from follow order by date desc limit 200",
        function (err, results) {
          if (err) throw err;
          console.log("======start=====");
          let data = new Array();
          tenResults = results.slice(0, 10);
          for (let em of tenResults) {
            let eleData = {
              id: em["id"],
              temp: em["temp"],
              humi: em["humi"],
              rain: em["rain"],
              light: em["light"],
              date: RiQi(em["date"]),
            };
            mydata.push(eleData);
          }
          console.log("eleciricity data :" + JSON.stringify(mydata));
          console.log("======end=======");
          socket.emit("mychart", { msg: JSON.stringify(mydata) });
          console.log("emit successfully!");
        }
      );
      conn.release();

      // 取最近十分钟的用电数据
    });

    //当有客户端连接时，向客户端发送设备状态
    socket.emit("module1", { msg: willMessage1 });
    socket.emit("time", { msg: time });
  });

  //监听MQTT消息14
  client.on("message", function (topic, message) {
    console.log("主题：" + topic + "  消息：" + message.toString());
    if (topic == "Mymqtt/follow/willMessage") {
      nowtime = new Date().toLocaleTimeString("chinese", { hour12: false });
      t = nowtime - lasttime;
      if (t > 3000) {

      }
      socket.emit("module1", { msg: willMessage1 });
      socket.emit("time", { msg: nowtime });
      lasttime = nowtime;
    } else if (topic == "Mymqtt/follow/dht11") {
      var json = JSON.parse(message.toString());
      rainState = json.rain;

      socket.emit("electricity", { msg: json });
      socket.emit("SWITCH", { msg: rainState })
      nowTime = new Date().toLocaleTimeString("chinese", { hour12: false });
      if (time != nowTime) {

        //将温湿度信息插入到数据库中
        var addElectricity = "INSERT INTO follow(temp, humi, rain, light) VALUES(?,?,?,?)";
        var temp = json.temp;
        console.log("temp:"+temp)
        var humi = json.humi;
        var rain = json.rain;
        var light = json.light;
        var addSqlParams = [temp, humi, rain, light];

        pool.getConnection(function (err, connection) {
          if (err) throw err;
          connection.query(addElectricity, addSqlParams, function (err, result) {
            if (err) {
              console.log("[INSERT ERROR] - ", err.message);
              return;
            }
            console.log("Insert successfully");
          });
          connection.release();
        });

        time = nowTime;
      }
    }
  });

  //发送灯的控制指令
  socket.on("switchCMD", function (data) {
    var topic = "Mymqtt/module1/switchCMD";
    console.log("发送主题：" + topic + " 发送信息：" + data);
    client.publish(topic, data, { qos: 1, retain: false });
  });
});

//时间戳（UTC）转标准时间
function RiQi(sj) {
  var now = new Date(sj);
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  var date = now.getDate();
  var hour = now.getHours();
  var minute = now.getMinutes();
  var second = now.getSeconds();
  return now.toLocaleTimeString("chinese", { hour12: false });
}

//启动HTTP服务，绑定端口3000
app.listen(3000, function () {
  console.log("listening on *:3000");
});
