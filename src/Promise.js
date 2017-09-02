class _Promise {
      constructor(cbs) {
        //初始化成功和失败的参数
        this.succArgs = this.failArgs = undefined;
        //初始化成功失败的函数队列
        this.succCbs = [];
        this.failCbs = [];
        //状态映射值
        this.STATUS = {
             PENDING : 1,
             RESOLVE : 2,
             REJECT : 3
        } 
        //内部状态
        this._status = this.STATUS.PENDING;
        this._exec(cbs)
      }
      isFunction(arg) {
          return Object.prototype.toString.call(arg).indexOf('Function') > -1;
      }
      _exec(cbs) {
          //如果允诺对象传入的是一个函数，我们就执行，不是直接resolve
          if(this.isFunction(cbs)) {
              cbs((...args) => {
                 //成功回调，更新状态
                 this._status = this.STATUS.RESOLVE;
                 //获取传入参数转换为数组
                 this.succArgs = [...args];
                 //调取内部_resolve方法
                 this._resolve.apply(this,this.succArgs);
              },(...args) => {
                 //失败回调
                 this._status = this.STATUS.REJECT;
                 //获取传入参数转换为数组
                 this.failArgs = [...args];
                 //调取内部_reject方法
                 this._reject.apply(this,this.failArgs);                         
              })
          } 
      }
      _resolve() {
           //获取队列
           let callback = this.succCbs.shift();
           //判断状态以及队列中是否存在
           if(this._status === this.STATUS.RESOLVE && callback) {
              let _p = callback.apply(this,this.succArgs);
              //查看then方法的返回值是否是promise对象
              if(_p instanceof _Promise) {
                //是允诺对象 并且值为PENDINF状态，我们要给他重新赋值resolve回调函数;
                if(_p._status === this.STATUS.PENDING) {
                    _p.succCbs = this.succCbs.slice();
                    return;
                }
              }
              //不是允诺对象,保留返回值
              let nextInstance = _p;
              //调用下一轮Promise
              _p = new _Promise((resolve) => {
                   setTimeout(() => {
                      //这一步延迟器非常重要，它确保新允诺对象不是会立即执行resolve
                      //新的允诺对象初始化succCbs为空
                      //在异步延迟器的作用下，会先执行下面的方法，保留了成功回调的队列
                      resolve(nextInstance)
                   })
              })
              //获取新的成功回调函数队列。为保证统一转换为数组
              _p.succCbs = this.succCbs.slice()
           }
      }
      _reject() {
           //获取队列
           let callback = this.failCbs.shift();
           //判断状态以及队列中是否存在
           if(this._status === this.STATUS.REJECT && callback) {
              let _p = callback.apply(this,this.failArgs);
              //查看then方法的返回值是否是promise对象
              if(_p instanceof _Promise) {
                //是允诺对象 并且值为PENDINF状态，我们要给他重新赋值reject回调函数;
                if(_p._status === this.STATUS.PENDING) {
                    _p.failCbs = this.failCbs.slice();
                    return;
                }
              }
              //不是允诺对象,保留返回值
              let nextInstance = _p;
              //调用下一轮Promise
              _p = new _Promise((resolve) => {
                   setTimeout(() => {
                      //这一步延迟器非常重要，它确保新允诺对象不是会立即执行reject
                      //新的允诺对象初始化succCbs为空
                      //在异步延迟器的作用下，会先执行下面的方法，保留了失败回调的队列
                      reject(nextInstance)
                   })
              })
              //获取新的成功回调函数队列。为保证统一转换为数组
              _p.failCbs = this.failCbs.slice()
           }
      }
      then(success,fail) {
          //调用resolve后执行sucess，reject执行fail
          this.done(success);
          this.fail(fail);
          //返回this
          return this
      }
      done(args) {
         //执行条件
         if(this.isFunction(args)) {
              //判断状态,如果是成功状态直接执行，不是放入队列
              if(this._status === this.STATUS.RESOLVE) {
                  args.apply(this,this.succArgs);
              }else {
                  this.succCbs.push(args);
              }
         } 
         return this;
      }
      fail(args) {
         //执行条件
         if(this.isFunction(args)) {
              //判断状态,如果是成功状态直接执行，不是放入队列
              if(this._status === this.STATUS.REJECT) {
                  args.apply(this,this.failArgs);
              }else {
                  this.failCbs.push(args);
              }
         } 
         return this;                
      }
 }