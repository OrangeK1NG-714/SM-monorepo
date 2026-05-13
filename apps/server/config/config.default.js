/* eslint valid-jsdoc: "off" */

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1751160937705_7579';

  // add your middleware config here
  config.middleware = [];
 // 配置 multipart
  config.multipart = {
    mode: 'file',
    fileSize: '50mb', // 设置文件大小限制
    whitelist: ['.pdf', '.doc', '.docx', '.jpg', '.png'], // 允许的文件类型
  };
  //异常处理
  config.onerror = {
    accepts() {
      return 'json'
    },
    json(err, ctx) {
      console.log(err);
      //自定义错误时的响应体
      if (err.status === 422) {
        if (err.errors[0].message == 'required') {
          ctx.body = {
            msg: '缺少必传参数',
            field: err.errors[0].field
          }
          ctx.status = 400
        } else {
          console.log('else');
          ctx.body = {
            msg: err.errors[0].message,
            field: err.errors[0].field
          }
          ctx.status = 422
        }
      } else {
        ctx.body = {
          msg: err.message,
          ...(err.errors && { errors: err.errors })
        }
        ctx.status = err.status
      }

    }
  }
  // 部署时需修改：加认证 mongodb://用户名:密码@127.0.0.1:27017/ms-da-projects
  config.mongoose = {
    url: 'mongodb://root:123456@127.0.0.1:27017/ms-da-projects?authSource=admin',
  }
  //取消安全威胁csrf的防范
  config.security = {
    csrf: {
      enable: false
    }
  }
  //配置校验
  config.validate = {
    convert: true
  }
  // 微信小程序配置
  config.wxMiniApp = {
    appid: 'wx2ef7a7980c58d250',
    secret: '624be97a30fedcec017fd39606d54680',
    subscribeTemplateId: 'eLfrwx8SgoCSv3vXzAQNUhdCXr69xg5mhMio_xFHd3U',
  }

  // 部署时需修改：换一个更复杂的随机字符串
  config.jwt = {
    secret: 'Linchao0714',
    expiresIn: 60 * 60 * 24 * 3
  }
  // 部署时需修改：origin 改为实际域名如 'https://richardq.tech'
  config.cors = {
    origin:'*',
    allowMethods:'GET,HEAD,PUT,POST,DELETE,PATCH',
    exposeHeaders: ['Authorization']
  }
  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
