import axios from "axios";
import { ElMessage } from "element-plus";

// 添加请求拦截器
axios.interceptors.request.use(
    function (config) {
        const token = localStorage.getItem("token");
        config.headers.Authorization = `${token}`
        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

// 添加响应拦截器
axios.interceptors.response.use(
    function (response) {
        const { authorization } = response.headers;
        authorization && localStorage.setItem("token", authorization)
        return response;
    },
    function (error) {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token")
            window.location.href = "#/login"
        } else if (error.response) {
            const msg = error.response.data?.msg || `请求失败 (${error.response.status})`
            ElMessage.error(msg)
        } else if (error.request) {
            ElMessage.error("网络连接失败，请检查网络后重试")
        }
        return Promise.reject(error);
    }
);