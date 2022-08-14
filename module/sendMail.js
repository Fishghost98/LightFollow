// 1. 导入nodemailer
const nodeMailer = require("nodemailer")

// 定义一个生成验证码的函数
function getCode() {
    return Math.random().toString(16).slice(2, 6).toUpperCase()
}

//创建一个传送器
const transporter = nodeMailer.createTransport({
    host: "smtp.qq.com", //邮件发送的域名，我们这里使用的是QQ的服务
    port: 587,    // SMTP端口号
    secure: false,   //secure:true for port 465, secure:false for port 587
    auth: {
        user: "yuhaobo98@qq.com",  //邮件发送方的邮箱
        pass: "ttmaorqewlxdgcge"    //我们开启POP服务生成的授权码
    }
})

exports.sendMail = function (email, message) {
    //配置发件箱和收件箱的信息
    const mailOptions = {
        from: "yuhaobo98@qq.com",  //发件箱
        to: email,     //收件箱地址
        subject: "用电告警",    //邮件的标题
        html: message
    }
    // 发送邮件：
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(":邮件发送失败！");
            return
        }
        console.log(":邮件发送成功！")
    })

}

