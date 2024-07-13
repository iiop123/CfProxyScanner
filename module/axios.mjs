import axios from "axios"

// 最大并发请求数
const MAX_CONCURRENT_REQUESTS = 200; 

// 请求队列
const requestQueue = []; 

// 当前正在进行中的请求数
let activeRequests = 0; 

/**
 * 处理请求队列中的请求
 */
function processQueue() {
  // 如果当前进行中的请求数没达到最大并发数 && 请求队列不为空
  if (activeRequests < MAX_CONCURRENT_REQUESTS && requestQueue.length > 0) { 
    // 从请求队列中取出队头的请求
    const { url, config, resolve, reject } = requestQueue.shift(); 
    // 进行中的请求数 +1
    activeRequests++; 
    // 通过 Axios 发送请求
    axios(url, config) 
    .then((response) => { 
       // 请求成功，将外层 Promise 的状态更新为fulfilled，并返回请求结果
       resolve(response); 
     }) 
    .catch((error) => { 
       // 请求失败，将外层 Promise 的状态更新为rejected，并返回错误信息
       reject(error); 
     }) 
    .finally(() => { 
       // 不论成功还是失败都会执行 finally，表示本次请求结束，将进行中的请求数 -1
       activeRequests--; 
       // 再处理请求队列中的下一个请求
       processQueue(); 
     }); 
  }
}

/**
 * 并发请求方法
 * @param {string} url 请求的 url
 * @param {AxiosRequestConfig} config Axios 的请求配置
 */
function limitConcurrentRequests(url, config) { 
  // 将用户发起的每个请求都变成一个 Promise，而 Promise 的状态会在 processQueue 中根据 Axios 的执行结果来更新
  return new Promise((resolve, reject) => { 
    // 将请求的配置信息和更新 Promise 状态的两个方法变成一个对象推入请求队列中
    requestQueue.push({ url, config, resolve, reject }); 
    // 执行 processQueue 方法处理请求队列中的每个请求
    processQueue(); 
  });
}


export {limitConcurrentRequests}