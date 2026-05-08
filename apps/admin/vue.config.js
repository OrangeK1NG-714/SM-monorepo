const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,

  //反向代理解决跨域问题
  devServer:{
    proxy:{
      "/api":{
        target:"http://localhost:7001",
        changeOrigin:true
      }
    },
     client: {
        overlay: {
          runtimeErrors: (error) => {
            const ignoreErrors = [
              'ResizeObserver',
              'hydration'
            ]
            return !ignoreErrors.some(pattern => error.message.includes(pattern))
          }
        }
      }
  }
})
