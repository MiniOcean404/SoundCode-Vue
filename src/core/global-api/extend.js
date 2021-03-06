/* @flow */

import {ASSET_TYPES} from 'shared/constants'
import {defineComputed, proxy} from '../instance/state'
import {extend, mergeOptions, validateComponentName} from '../util/index'

export function initExtend(Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}

    const Super = this
    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})

    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    // todo 获取构造器的name或者当前Vue的name
    const name = extendOptions.name || Super.options.name

    // todo 检查组件命名
    if (process.env.NODE_ENV !== 'production' && name) {
      validateComponentName(name)
    }

    // todo 初始化组件
    const Sub = function VueComponent(options) {
      this._init(options)
    }

    // todo 父类原型赋给子原型，子构造函数原型赋值为子
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    )
    Sub['super'] = Super

    // For props and computed properties, we define the proxy getters on   对于props和计算属性，我们在扩展原型的扩展时间在Vue实例上定义代理获取器。
    // the Vue instances at extension time, on the extended prototype. This 这样可以避免为每个创建的实例调用Object.defineProperty。
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps(Sub)
    }
    if (Sub.options.computed) {
      initComputed(Sub)
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use

    // create asset registers, so extended classes
    // can have their private assets too.
    // todo 注册资产以便后续使用 component directive filter
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // 启用递归自查找 enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }

    // 在扩展时间保留对超级选项的引用。稍后在实例化中，我们可以检查Super的选项是否已更新 keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    Sub.sealedOptions = extend({}, Sub.options)

    // cache constructor
    cachedCtors[SuperId] = Sub
    return Sub
  }
}

function initProps(Comp) {
  const props = Comp.options.props
  for (const key in props) {
    proxy(Comp.prototype, `_props`, key)
  }
}

function initComputed(Comp) {
  const computed = Comp.options.computed
  for (const key in computed) {
    defineComputed(Comp.prototype, key, computed[key])
  }
}
