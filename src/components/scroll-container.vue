<template>
  <div>
    <div
      id="mainPage"
      ref="mainPage"
      class="mainPage slide-page page2"
      :class="{'noScroll': isPause}"
      @touchmove.stop
      @scroll="handleScroll"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script>
  import { EventBus } from '../event-bus.js'
  function throttle (fn, delay) {
    let pre = 0
    return function (...args) {
      const context = this
      let now = Date.now()
      if (now - pre >= delay) {
        fn.apply(context, args)
        pre = Date.now()
      }
    }
  }

  function round (num, lenth = 10000) {
    return Math.round(num * lenth) / lenth
  }

  function getRound (num) {
    if (num < 0) {
      return 0
    }
    if (num > 1) {
      return 1
    }
    return num
  }

  export default {
    name: 'ScrollVue',
    props: ['hooks', ''],
    data () {
      return {
        noScroll: false,
        distanceList: [],
        // 滚动的距离 占比
        scrollPer: 0,
        // 滚动距离 绝对值
        scrollTop: 0,
        // 向下（正向）滚动 1 向上(反向)滚动 0
        direction: 1,
        // 累加的滚动距离
        moveDistance: 0,
        isPause: false,
        page1Height: 0,
      }
    },
    mounted () {
      this.distanceList = this.getChildPosition(this.hooks)
    },
    methods: {
      getChildPosition (selector) {
        let arr = document.querySelectorAll(selector)
        let list = []
        for (let i = 0; i < arr.length; i++) {
          let item = arr[i]
          let top = item.getClientRects()[0].top + (window.pageYOffset || document.documentElement.scrollTop || 0) - (document.documentElement.clientTop || 0)
          let scrollHeight = this.$refs.mainPage.scrollHeight
          let start = round((top / scrollHeight))
          list.push({
            during: Number(item.dataset.during) || 1000,
            start,
            pass: -1,
          })
        }
        return list
      },
      setBodyFixed (isFixed) {
        if (isFixed) {
          document.getElementsByTagName('body')[0].setAttribute('style', 'overflow:hidden;position: fixed')
          document.getElementsByTagName('html')[0].setAttribute('style', 'overflow:hidden;position: fixed')
        } else {
          document.getElementsByTagName('body')[0].setAttribute('style', '')
          document.getElementsByTagName('html')[0].setAttribute('style', '')
        }
      },
      emitEvent (name, data) {
        EventBus.$emit(name, data)
      },
      setMoveDistance (i) {
        // 这块是只会执行一遍的
        let that = this
        let startY = 0
        let moveY = 0
        let moveDistance = 0
        // 如果是 正向的，则moveDistance 是累加[0, during], 如果是反向，则 allDistance 是递减[during, 0]
        let allDistance = this.direction > 0 ? 0 : this.distanceList[i].during

        function touchStart (e) {
          startY = round(e.touches[0].pageY)
          moveY = 0
        }
        function touchMove (e) {
          if (!startY) {
            startY = round(e.touches[0].pageY)
          }
          moveY = round(e.touches[0].pageY)
          // that.direction 是不会在 move 阶段被改变的

          if (that.direction > 0) {
            // 本次滚动的距离 如果是正向，则应该是正数
            moveDistance = round(startY - moveY)

            // 本次滚动的距离 累加起来，如果是正向，则会逐渐从 0 累加~during
            allDistance = moveDistance + allDistance

            that.emitEvent('scroll_pause', {
              percent: getRound(allDistance / that.distanceList[i].during),
            })
            // 如果小于 [0, during], 则是反向滚动 马上退出
            if (allDistance < 0) {
              cancel()
            } else if (allDistance > that.distanceList[i].during) {
              that.distanceList[i].pass = 1
              cancel()
            }

          } else if (that.direction < 0) {
            // 本次滚动的距离 如果是反向，则应该是负数
            moveDistance = round(startY - moveY)

            // 本次滚动的距离 累加起来，如果是反向，则会逐渐递减 [during, 0]
            allDistance = moveDistance + allDistance

            that.emitEvent('scroll_pause', {
              percent: getRound(allDistance / that.distanceList[i].during),
            })

            // 正向move 马上退出
            if (allDistance > that.distanceList[i].during) {
              cancel()
            } else if (allDistance < 0) {
              // pass 1 正向通过
              that.distanceList[i].pass = -1
              cancel()
            }
          }
        }
        function touchEnd (e) {
          startY = 0
        }

        function cancel () {
          // 获取点击开始的坐标
          that.$refs.mainPage.removeEventListener('touchstart', touchStart)
          that.$refs.mainPage.removeEventListener('touchmove', throttleTouchMove)
          that.$refs.mainPage.removeEventListener('touchend', touchEnd)

          // 信号量
          that.isPause = false
          that.setBodyFixed(false)
          allDistance = 0
        }

        let throttleTouchMove = throttle(touchMove, 100)
        // 获取点击开始的坐标
        that.$refs.mainPage.addEventListener('touchstart', touchStart)
        that.$refs.mainPage.addEventListener('touchmove', throttleTouchMove)
        that.$refs.mainPage.addEventListener('touchend', touchEnd)

      },
      handleScroll (e) {
        throttle(this.handleScrollNoThrottle, 500)()
      },
      handleScrollNoThrottle () {
        let page1 = document.getElementById('page1')
        this.page1Height = page1 && page1.scrollHeight || 0
        let mainPage = this.$refs.mainPage
        let scrollHight = mainPage.scrollHeight

        // 判断方向
        if (mainPage.scrollTop >  this.scrollTop) {
          // 向下滚动
          this.direction = 1
        } else {
          this.direction = -1
        }
        // this.scrollTop 赋值, 滚动了多少
        this.scrollTop = mainPage.scrollTop
        // this.scrollPer 滚动的占比
        this.scrollPer = round((this.scrollTop / (scrollHight - this.page1Height)), 1000000)

        // 一个一个判断
        for (let i = 0; i < this.distanceList.length; i++) {
          let item = this.distanceList[i]

          // 正向滚动
          if (this.direction > 0) {
            // pass 1 正向通过
            if (this.scrollPer > item.start && item.pass < 0) {
              // 避免重复绑定
              if (!this.isPause) {
                this.setBodyFixed(true)
                this.isPause = true
                this.setMoveDistance(i)
              }
            }
          } else if (this.direction < 0) {
            //	反向滚动
            // pass 1 正向通过
            if (this.scrollPer <= item.start && item.pass > 0) {
              // 避免重复绑定
              if (!this.isPause) {
                this.setBodyFixed(true)
                this.isPause = true
                this.setMoveDistance(i)
              }
            }
          }
        }
      },
    },
  }
</script>

<style scoped>
  .mainPage {
    width: 100vw;
    height: 100vh;
    overflow-x: hidden;
    overflow-y: scroll;
    -webkit-overflow-scrolling:touch;
  }

  .scrollPer {
    position: fixed;
    left: 0;
    top: 30px;
    z-index: 100;
    color: cadetblue;
  }
  .noScroll {
    overflow-x: hidden!important;
    overflow-y: hidden!important;
  }
</style>
