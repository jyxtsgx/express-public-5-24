let http = require('http');
let url = require('url');
function createApplication() {
  let app = (req, res) => {
    let m = req.method.toLowerCase();
    let { pathname } = url.parse(req.url, true);
    // 通过next方法进行迭代
    let index = 0;
    function next() {
      // 如果数组全部迭代完成还没有找到 说明路径不存在
      if(index === app.routes.length) return res.end(`Cannot ${m} ${pathname}`);
      let { method, path, handler } = app.routes[index++]; // 每次调用next就应该取下一个layer
      if (method === 'middle') { // 处理中间件
        if(path === '/' || path === pathname || pathname.startsWith(path+'/')){
          handler(req,res,next);
        }else{
          next(); // 如果这个中间件没有匹配到 那么继续走下一个层匹配
        }
      } else { // 处理路由
        if ((method === m || method === 'all') && (path === pathname || path === '*')) {
          handler(req, res);
        }else{
          next();
        }
      }
    }
    next(); // 中间件中的next方法
  }
  app.routes = [];
  app.use = function (path, handler) {
    if (typeof handler !== 'function') {
      handler = path;
      path = '/';
    }
    let layer = {
      method: 'middle', // method是middle我们就表示他是一个中间件
      path,
      handler
    }
    app.routes.push(layer); // 将中间件放到容器内
  }
  app.all = function (path, handler) {
    let layer = {
      method: 'all',
      path,
      handler
    }
    app.routes.push(layer);
  }
  http.METHODS.forEach(method => {
    method = method.toLocaleLowerCase();
    app[method] = function (path, handler) {
      let layer = {
        method,
        path,
        handler
      }
      app.routes.push(layer);
    }
  })

  app.listen = function () {
    let server = http.createServer(app);
    server.listen(...arguments);
  }
  return app;
}
module.exports = createApplication;