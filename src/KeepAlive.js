import { currentInstance } from './lifeCycleHooks';

/**
 * @title KeepAlive组件
 * ### KeepAlive组件实现
 * 1. 子组件作为slots存在, 是默认的slot
 * 2. 缓存子组件节点: cache[vnode.type] = vnode; 使用组件选项对象作为key来缓存，但这种方式只能支持不同组件类型,
 * 同一组件类型无法缓存多个实例，如下例所示
 * ```html
 * <KeepAlive>
 *   <count v-if="true" />
 *   <count else />
 * </KeepAlive>
 * ```
 * Vue中除了用选项对象来作为key，还使用了vnode.key, 源码`key = vnode.key == null ? comp : vnode.key`;
 * 像上述例子，编译器会自动给每个count添加key，而且是从0开始递增的key，除非手动添加key标识
 */
const KeepAlive = {
	name: 'keep-alive',
	setup(props, { slots }) {
		const cache = new Map();
		// 在渲染KeepAlive时，会调用setup函数，在调用setup函数之前，将全局的currentInstance设置为当前组件实例
		// 这里在setup内部需要拿到当前组件的实例
		const instance = currentInstance;
		// 渲染器需要将keepAliveCtx上下文对象添加到KeepAlive组件实例上，上下文对象有渲染器暴露给实例的方法
		// 所以KeepAlive组件与渲染器结合得很紧密
		const { move, createElement } = instance.keepAliveCtx;

		// 创建一个隐藏容器，用来放置失活的DOM元素
		const hideContainer = createElement('div');
		// 激活时调用，将组件节点放入container中
		instance._activate = (vnode, container, anchor = null) => {
			move(vnode, container, anchor);
		};
		// 失活时调用，将vnode对应的DOM节点放入隐藏容器
		instance._deactivate = (vnode) => {
			move(vnode, hideContainer);
		};
		// 返回函数作为render函数
		return () => {
			// 通过默认插槽获取到子组件节点，但是要求只能有一个节点
			let rawVNode = slots.default();
			if (typeof rawVNode.type !== 'object') {
				// 非组件节点，直接返回
				return rawVNode;
			}
			const cachedVNode = cache.get(rawVNode.type);
			if (cachedVNode) {
				// 将缓存的子组件节点的组件实例赋值给新的子组件节点，保留了组件实例的状态
				rawVNode.component = cachedVNode.component;
				// 渲染器检查该属性，如果true，则表示渲染器不需要挂载，而是激活
				rawVNode.keptAlive = true;
			} else {
				// 没有缓存，则将当前的新节点缓存
				cache.set(rawVNode.type, rawVNode);
			}
			// 避免渲染器卸载组件，而是失活
			rawVNode.shouldKeepAlive = true;
			rawVNode.keepAliveInstance = instance;

			return rawVNode;
		};
	}
};

export default KeepAlive;
