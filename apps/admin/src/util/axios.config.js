import axios from "axios";

// 添加请求拦截器
axios.interceptors.request.use(
    function (config) {
        //请求发送前获取token值
        const token = localStorage.getItem("token");
        //添加token令牌
        config.headers.Authorization = `${token}`
        // console.log(config);
        
        return config;
    },
    function (error) {
        // 对请求错误做些什么
        return Promise.reject(error);
    }
);

// 添加响应拦截器
axios.interceptors.response.use(
    function (response) {
        // 对响应数据做些什么
        // console.log('响应拦截器 - 响应到达前', response);
        // console.log(response.headers);
        // console.log(123);
        
        // console.log(response.headers);
        
        const { authorization } = response.headers;
        // console.log(authorization);
        
        authorization && localStorage.setItem("token", authorization)
        // 例如：只返回响应数据
        return response;
    },
    function (error) {
        console.log(error);
        
        // 对响应错误做些什么
        // console.log('响应拦截器 - 响应错误', error);
        // 例如：处理 HTTP 错误状态码
        // const {status} =error.response
        // if (status === 401) {
        //     localStorage.removeItem("token")
        //     window.location.href="#/login"
        // }
        console.log("测试");
        
        return Promise.reject(error);
    }
);