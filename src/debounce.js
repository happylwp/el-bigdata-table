/**
 * 函数防抖
 * @param t
 * @param fn
 * @returns {Function}
 * @constructor
 */
export default function(t, fn) {
  const delay = t || 500
  let timer
  // console.log(fn)
  // console.log(typeof fn)
  return function() {
    const args = arguments
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, args)
    }, delay)
  }
}
