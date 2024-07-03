## Modules

<dl>
<dt><a href="#module_KeepAlive">KeepAlive</a></dt>
<dd><p>定义KeepAlive组件</p>
</dd>
<dt><a href="#module_WebAPI">WebAPI</a></dt>
<dd><p>定义渲染器平台的API集合</p>
</dd>
<dt><a href="#module_diff">diff</a></dt>
<dd><p>定义diff算法</p>
</dd>
<dt><a href="#module_renderer">renderer</a></dt>
<dd><p>定义入口文件</p>
</dd>
<dt><a href="#module_lifeCycleHooks">lifeCycleHooks</a></dt>
<dd><p>定义生命周期方法的添加函数</p>
</dd>
<dt><a href="#module_patch">patch</a></dt>
<dd><p>定义核心的patch方法</p>
</dd>
<dt><a href="#module_unmount">unmount</a></dt>
<dd><p>定义卸载方法</p>
</dd>
</dl>

<a name="module_KeepAlive"></a>

## KeepAlive
定义KeepAlive组件

<a name="module_KeepAlive..KeepAlive"></a>

### KeepAlive~KeepAlive
**Kind**: inner constant of [<code>KeepAlive</code>](#module_KeepAlive)  
**Title**: KeepAlive组件
### KeepAlive组件实现
1. 子组件作为slots存在, 是默认的slot
2. 缓存子组件节点: cache[vnode.type] = vnode; 使用组件选项对象作为key来缓存，但这种方式只能支持不同组件类型,
同一组件类型无法缓存多个实例，如下例所示
```html
<KeepAlive>
  <count v-if="true" />
  <count else />
</KeepAlive>
```
Vue中除了用选项对象来作为key，还使用了vnode.key, 源码`key = vnode.key == null ? comp : vnode.key`;
像上述例子，编译器会自动给每个count添加key，而且是从0开始递增的key，除非手动添加key标识  
<a name="module_WebAPI"></a>

## WebAPI
定义渲染器平台的API集合


* [WebAPI](#module_WebAPI)
    * [~normalizeClass(value)](#module_WebAPI..normalizeClass)
    * [~normalizeStyle(value)](#module_WebAPI..normalizeStyle) ⇒ <code>object</code>

<a name="module_WebAPI..normalizeClass"></a>

### WebAPI~normalizeClass(value)
将class的值归一化为字符串

**Kind**: inner method of [<code>WebAPI</code>](#module_WebAPI)  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> \| <code>object</code> \| <code>Array.&lt;(string\|object)&gt;</code> | class属性值 A@returns {string} 归一化后的字符串值 |

<a name="module_WebAPI..normalizeStyle"></a>

### WebAPI~normalizeStyle(value) ⇒ <code>object</code>
归一化style属性值

**Kind**: inner method of [<code>WebAPI</code>](#module_WebAPI)  
**Returns**: <code>object</code> - 归一化后的style属性值  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>Array.&lt;object&gt;</code> \| <code>object</code> | 配置的style属性值 |

<a name="module_diff"></a>

## diff
定义diff算法


* [diff](#module_diff)
    * _static_
        * [.diffWithoutKey(n1, n2)](#module_diff.diffWithoutKey)
        * [.singleEndDiffWithKey()](#module_diff.singleEndDiffWithKey)
    * _inner_
        * [~isReusable(oldNode, newNode)](#module_diff..isReusable) ⇒ <code>boolean</code>

<a name="module_diff.diffWithoutKey"></a>

### diff.diffWithoutKey(n1, n2)
### 不使用key来标记节点时的diff算法
核心思想: 因为没有key的帮助，无法识别新旧节点列表中，究竟哪些节点是可以复用的，所以依次按照顺序对比patch

**Kind**: static method of [<code>diff</code>](#module_diff)  

| Param | Type | Description |
| --- | --- | --- |
| n1 | <code>\*</code> | 旧的父节点 |
| n2 | <code>\*</code> | 新的父节点 |

<a name="module_diff.singleEndDiffWithKey"></a>

### diff.singleEndDiffWithKey()
### 使用key标记节点时的单端diff算法
核心思想: 通过key可以在新旧子节点列表中，找到可以复用的节点，从而不必卸载和挂载，通过移动可复用节点即可

**Kind**: static method of [<code>diff</code>](#module_diff)  
<a name="module_diff..isReusable"></a>

### diff~isReusable(oldNode, newNode) ⇒ <code>boolean</code>
根据key值和node.type来判断两个节点是否可以复用

**Kind**: inner method of [<code>diff</code>](#module_diff)  
**Returns**: <code>boolean</code> - 新旧节点是否可以复用  

| Param | Type | Description |
| --- | --- | --- |
| oldNode | <code>\*</code> | 旧节点 |
| newNode | <code>\*</code> | 新节点 |

<a name="module_renderer"></a>

## renderer
定义入口文件

<a name="module_renderer.createRenderer"></a>

### renderer.createRenderer(renderOptions) ⇒ <code>object</code>
根据传入的平台渲染API，创建一个平台渲染器，不传的话默认是web平台渲染器

**Kind**: static method of [<code>renderer</code>](#module_renderer)  
**Returns**: <code>object</code> - 渲染器对象

### 渲染器对象
包含render方法
```js
render(vnode, container);
```  

| Param | Type | Description |
| --- | --- | --- |
| renderOptions | <code>object</code> | 平台渲染的API集合 |

<a name="module_lifeCycleHooks"></a>

## lifeCycleHooks
定义生命周期方法的添加函数

<a name="module_lifeCycleHooks.setCurrentInstance"></a>

### lifeCycleHooks.setCurrentInstance(instance)
将传入的实例赋值给当前实例，在组件setup函数调用前，将组件实例传入作为当前实例，这样在setup中注册的生命周期函数会添加到组件实例上，setup调用后释放

**Kind**: static method of [<code>lifeCycleHooks</code>](#module_lifeCycleHooks)  

| Param | Type |
| --- | --- |
| instance | <code>\*</code> | 

<a name="module_patch"></a>

## patch
定义核心的patch方法


* [patch](#module_patch)
    * [module.exports(n1, n2, container, anchor, renderOptions)](#exp_module_patch--module.exports) ⇒ <code>undefined</code> ⏏
        * [~mountElement(vnode, container, anchor, renderOptions)](#module_patch--module.exports..mountElement) ⇒ <code>undefined</code>
        * [~patchElement(n1, n2, renderOptions)](#module_patch--module.exports..patchElement)
        * [~patchChildren(n1, n2, el, renderOptions)](#module_patch--module.exports..patchChildren)
        * [~mountComponent(vnode, container, anchor, renderOptions)](#module_patch--module.exports..mountComponent)
        * [~patchComponent(n1, n2)](#module_patch--module.exports..patchComponent) ⇒ <code>undefined</code>
        * [~resolveProps(options, propsData)](#module_patch--module.exports..resolveProps) ⇒ <code>Array</code>
        * [~propsHasChanged(prevProps, nextProps)](#module_patch--module.exports..propsHasChanged) ⇒ <code>boolean</code>
        * [~shallowReadOnly(data)](#module_patch--module.exports..shallowReadOnly) ⇒ <code>object</code>
        * [~getAnchor(vnode)](#module_patch--module.exports..getAnchor) ⇒ <code>DOMNode</code>

<a name="exp_module_patch--module.exports"></a>

### module.exports(n1, n2, container, anchor, renderOptions) ⇒ <code>undefined</code> ⏏
挂载/更新节点

**Kind**: Exported function  

| Param | Type | Description |
| --- | --- | --- |
| n1 | <code>\*</code> | 旧节点 |
| n2 | <code>\*</code> | 新节点 |
| container | <code>\*</code> | 容器 |
| anchor | <code>\*</code> | 挂载锚点 |
| renderOptions | <code>\*</code> | 渲染器平台API集合 |

<a name="module_patch--module.exports..mountElement"></a>

#### module.exports~mountElement(vnode, container, anchor, renderOptions) ⇒ <code>undefined</code>
挂载DOM元素类型的节点

**Kind**: inner method of [<code>module.exports</code>](#exp_module_patch--module.exports)  

| Param | Type | Description |
| --- | --- | --- |
| vnode | <code>\*</code> | 节点 |
| container | <code>\*</code> | 容器 |
| anchor | <code>\*</code> | 锚点 |
| renderOptions | <code>\*</code> | 渲染器平台 |

<a name="module_patch--module.exports..patchElement"></a>

#### module.exports~patchElement(n1, n2, renderOptions)
更新元素类型的节点

**Kind**: inner method of [<code>module.exports</code>](#exp_module_patch--module.exports)  

| Param | Type | Description |
| --- | --- | --- |
| n1 | <code>\*</code> | 旧节点 |
| n2 | <code>\*</code> | 新节点 |
| renderOptions | <code>\*</code> | 渲染器API |

<a name="module_patch--module.exports..patchChildren"></a>

#### module.exports~patchChildren(n1, n2, el, renderOptions)
更新新旧节点的子节点

**Kind**: inner method of [<code>module.exports</code>](#exp_module_patch--module.exports)  

| Param | Type | Description |
| --- | --- | --- |
| n1 | <code>\*</code> | 旧节点 |
| n2 | <code>\*</code> | 新节点 |
| el | <code>\*</code> | 容器 |
| renderOptions | <code>\*</code> | 渲染器API |

<a name="module_patch--module.exports..mountComponent"></a>

#### module.exports~mountComponent(vnode, container, anchor, renderOptions)
组件挂载

**Kind**: inner method of [<code>module.exports</code>](#exp_module_patch--module.exports)  

| Param | Type | Description |
| --- | --- | --- |
| vnode | <code>\*</code> | 组件节点 |
| container | <code>\*</code> | 容器 |
| anchor | <code>\*</code> | 锚点 |
| renderOptions | <code>\*</code> | 渲染器API |

<a name="module_patch--module.exports..patchComponent"></a>

#### module.exports~patchComponent(n1, n2) ⇒ <code>undefined</code>
更新组件

**Kind**: inner method of [<code>module.exports</code>](#exp_module_patch--module.exports)  

| Param | Type | Description |
| --- | --- | --- |
| n1 | <code>\*</code> | 新节点 |
| n2 | <code>\*</code> | 旧节点 |

<a name="module_patch--module.exports..resolveProps"></a>

#### module.exports~resolveProps(options, propsData) ⇒ <code>Array</code>
根据组件声明的props，解析实际传入的props值，返回解析后的props和attrs

**Kind**: inner method of [<code>module.exports</code>](#exp_module_patch--module.exports)  
**Returns**: <code>Array</code> - 返回解析后的props和attrs  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | 组件的选项对象声明的props |
| propsData | <code>object</code> | 实际传入的props |

<a name="module_patch--module.exports..propsHasChanged"></a>

#### module.exports~propsHasChanged(prevProps, nextProps) ⇒ <code>boolean</code>
浅层比较prevProps与nextProps

**Kind**: inner method of [<code>module.exports</code>](#exp_module_patch--module.exports)  
**Returns**: <code>boolean</code> - prevProps与nextProps浅层比较的结果  

| Param | Type |
| --- | --- |
| prevProps | <code>object</code> | 
| nextProps | <code>object</code> | 

<a name="module_patch--module.exports..shallowReadOnly"></a>

#### module.exports~shallowReadOnly(data) ⇒ <code>object</code>
浅层冻结数据

**Kind**: inner method of [<code>module.exports</code>](#exp_module_patch--module.exports)  

| Param | Type |
| --- | --- |
| data | <code>object</code> | 

<a name="module_patch--module.exports..getAnchor"></a>

#### module.exports~getAnchor(vnode) ⇒ <code>DOMNode</code>
获取当前vnode的锚点（insertBefore的anchor锚点）

**Kind**: inner method of [<code>module.exports</code>](#exp_module_patch--module.exports)  
**Returns**: <code>DOMNode</code> - 返回DOMNode类型  

| Param | Type |
| --- | --- |
| vnode | <code>\*</code> | 

<a name="module_unmount"></a>

## unmount
定义卸载方法

<a name="exp_module_unmount--module.exports"></a>

### module.exports(vnode, renderOptions) ⇒ <code>undefined</code> ⏏
卸载节点（组件）

**Kind**: Exported function  

| Param | Type |
| --- | --- |
| vnode | <code>\*</code> | 
| renderOptions | <code>\*</code> | 

