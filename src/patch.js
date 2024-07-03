import unmount from './unmount';
import { Text, Comment, Fragment } from './nodeType';
import { shallowReactive, effect, enqueue } from '@mxydl2009/vue3-responsive';
import { setCurrentInstance } from './lifeCycleHooks';
import KeepAlive from './KeepAlive';
import { singleEndDiffWithKey } from './diff';

export default function patch(n1, n2, container, anchor, renderOptions) {
	if (n1 && n1.type !== n2.type) {
		// 说明n1和n2不是同种元素
		unmount(n1, renderOptions);
		n1 = null;
	}
	const { type } = n2;
	const { createTextNode, insert, setTextNodeValue } = renderOptions;
	if (typeof type === 'string') {
		// 说明是普通元素
		if (!n1) {
			// 挂载
			mountElement(n2, container, anchor, renderOptions);
		} else {
			// 普通元素patch, n1为old，n2为new
			patchElement(n1, n2, renderOptions);
		}
	} else if (type === Text) {
		if (!n1) {
			const textNode = createTextNode(n2.children);
			n2.el = textNode;
			insert(textNode, container);
		} else {
			// 用新文本内容替换旧文本内容
			const el = (n2.el = n1.el);
			if (n1.children !== n2.children) {
				setTextNodeValue(el, n2.children);
			}
		}
	} else if (type === Comment) {
		//
	} else if (type === Fragment) {
		// Fragment is not a real node, so just deal with it's children
		if (!n1) {
			n2.children &&
				n2.children.forEach((c) => {
					patch(null, c, container, null, renderOptions);
				});
		} else {
			patchChildren(n1, n2, container, renderOptions);
		}
	} else if (typeof type === 'object') {
		// 组件, 使用选项对象描述的类型
		if (!n1) {
			if (n2.keptAlive) {
				// 说明该组件被keepAlive了，不需要重新挂载，而是激活
				// keepAliveInstance是包含该组件的KeepAlive实例，_activate是激活方法
				const instance = n2.component;
				if (instance) {
					// 调用生命周期方法
					instance.activated && instance.activated.forEach((fn) => fn());
				}
				n2.keepAliveInstance._activate(n2, container, anchor);
			}
			mountComponent(n2, container, anchor, renderOptions);
		} else {
			patchComponent(n1, n2);
		}
	}
}

function mountElement(vnode, container, anchor, renderOptions) {
	const { createElement, setElementText, insert, patchProp } = renderOptions;
	const el = (vnode.el = createElement(vnode.type));
	// el.__vnode = vnode;
	if (vnode.props) {
		// 遍历props，将属性添加到元素上
		for (const key in vnode.props) {
			const value = vnode.props[key];
			patchProp(el, key, null, value);
		}
	}
	if (typeof vnode.children === 'string') {
		setElementText(el, vnode.children);
	} else if (Array.isArray(vnode.children)) {
		vnode.children.forEach((child) => {
			patch(null, child, el, anchor, renderOptions);
		});
	}

	insert(el, container, anchor);
	return container;
}

function patchElement(n1, n2, renderOptions) {
	const { patchProp } = renderOptions;
	const el = (n2.el = n1.el);
	// 类型相同，更新prop和children
	const prevProps = n1.props;
	const nextProps = n2.props;
	for (const key in nextProps) {
		if (nextProps[key] !== prevProps[key]) {
			patchProp(el, key, prevProps[key], nextProps[key]);
		}
	}
	for (const key in prevProps) {
		if (!(key in nextProps)) {
			patchProp(el, key, prevProps[key], null);
		}
	}
	patchChildren(n1, n2, el, renderOptions);
}

function patchChildren(n1, n2, el, renderOptions) {
	const { setElementText } = renderOptions;
	if (typeof n2.children === 'string') {
		// 文本子节点
		if (Array.isArray(n1.children)) {
			n1.children.forEach((c) => unmount(c, renderOptions));
		}
		setElementText(el, n2.children);
	} else if (Array.isArray(n2.children)) {
		if (Array.isArray(n1.children)) {
			// 新旧子节点都会一组节点，diff
			// n1.children.forEach((c) => unmount(c, renderOptions));
			// n2.children.forEach((c) => patch(null, c, el, anchor, renderOptions));
			singleEndDiffWithKey(n1, n2, el, renderOptions);
		} else {
			setElementText(el, '');
			// 将n2的子节点依次挂载
			n2.children.forEach((c) => patch(null, c, el, null, renderOptions));
		}
	} else {
		// n2没有子节点
		if (Array.isArray(n1.children)) {
			// 卸载旧的子节点
			n1.children.forEach((c) => unmount(c, renderOptions));
			// n2.children.forEach((c) => patch(null, c, el, anchor, renderOptions));
		} else {
			setElementText(el, '');
		}
	}
}

function mountComponent(vnode, container, anchor, renderOptions) {
	// 挂载组件
	const componentOption = vnode.type;
	let {
		render,
		data,
		props,
		methods,
		// setup函数，要么返回一个函数（render函数），要么返回供模板使用的数据
		setup = () => ({}),
		beforeCreate,
		created,
		beforeMount,
		mounted,
		beforeUpdate,
		updated,
		activated,
		deactivated
	} = componentOption;

	function emit(eventName, ...payload) {
		eventName = `on${eventName[0].toUpperCase() + eventName.slice(1)}`;
		const handler = instance.props[eventName];
		if (handler) {
			handler(...payload);
		} else {
			console.error(`{eventName} doesn't exist!`);
		}
	}

	const slots = vnode.children || {};

	const [resolvedProps, resolvedAttrs] = resolveProps(props, vnode.props);

	const setupContext = { attrs: resolvedAttrs, emit, slots };

	const state = data ? shallowReactive(data()) : null; // 状态量转为响应式
	// 组件实例，保存组件生命周期内的状态
	const instance = {
		isMounted: false,
		state,
		props: shallowReactive(resolvedProps),
		methods,
		created: [],
		deactivated: [deactivated].filter((fn) => fn !== undefined),
		activated: [activated].filter((fn) => fn !== undefined),
		mounted: [mounted].filter((fn) => fn !== undefined),
		unMounted: [],
		updated: [],
		slots,
		subTree: null
		// 组件挂载的锚点
		// anchor: null
	};

	if (vnode.type === KeepAlive) {
		const { createElement, moveElementToContainer } = renderOptions;
		const move = (vnode, container, anchor) => {
			const el = vnode.component.subTree.el;
			moveElementToContainer(el, container, anchor);
		};
		instance.keepAliveCtx = {
			createElement,
			move
		};
	}

	// 在setup函数之前设置当前实例为instance，在setup函数中注册的生命周期函数都注册到当前实例上
	setCurrentInstance(instance);

	// 获取setup函数的结果, 是函数则作为render函数，非函数则作为模板的数据源
	const setupRes = setup(shallowReadOnly(instance.props), setupContext);
	// 模板数据源
	let setupState = null;
	if (typeof setupRes === 'function') {
		if (render) {
			console.error('setup 函数返回渲染函数时，render选项将会被忽略');
			render = setupRes;
		} else {
			render = setupRes;
		}
	} else {
		setupState = setupRes;
	}

	// setup函数调用后，释放当前实例的引用
	setCurrentInstance(null);

	beforeCreate && beforeCreate();

	const renderContext = new Proxy(instance, {
		get(target, key) {
			const { state, props } = target;
			if (state && key in state) {
				return state[key];
			} else if (key in props) {
				return props[key];
			} else if (setupState && key in setupState) {
				return setupState[key];
			} else if (key in methods) {
				return methods[key].bind(renderContext);
			} else if (key === '$slots') {
				return slots;
			} else {
				console.error(`${key} is not existed`);
			}
		},
		set(target, key, value) {
			const { state, props } = target;
			if (state && key in state) {
				state[key] = value;
				return true;
			} else if (key in props) {
				// TODO: props可以被组件自身修改吗???
				// console.error('props cannot be overwritten');
				props[key] = value;
				return false;
			} else if (setupState && key in setupState) {
				setupState[key] = value;
			} else {
				console.error(`${key} is not existed`);
			}
		}
	});

	created && created.call(renderContext);

	// for (const key in methods) {
	// 	instance[key] = methods[key].bind(instance);
	// }

	// 保存组件实例到虚拟节点上，便于后续更新时获取实例对象
	vnode.component = instance;
	// 使用effect注册副作用函数，组件内部状态更新将触发副作用函数执行
	effect(
		() => {
			const subTree = render.call(renderContext, renderContext);
			if (!instance.isMounted) {
				beforeMount && beforeMount.call(renderContext);

				patch(null, subTree, container, null, renderOptions);
				instance.isMounted = true;
				instance.mounted.length > 0 &&
					instance.mounted.forEach((fn) => fn.call(renderContext));
			} else {
				beforeUpdate && beforeUpdate.call(renderContext);
				patch(instance.subTree, subTree, container, anchor, renderOptions);
				updated && updated.call(renderContext);
			}
			instance.subTree = subTree;
		},
		{
			scheduler: (job) => {
				// 这里的job参数就是上面注册的副作用函数
				enqueue(job);
			}
		}
	);
}

function patchComponent(n1, n2) {
	function isEmpty(value) {
		return value === null || value === undefined;
	}
	// console.log('patch component', n1, n2, container, anchor, renderOptions);
	// 第一次patchComponent时，n2是新的节点，还未存储实例对象
	const instance = (n2.component = n1.component);
	const { props } = instance;
	if (isEmpty(n1.props) && isEmpty(n2.props)) return;
	if (propsHasChanged(n1.props, n2.props)) {
		// 如果子组件的props变化了，则需要重新生成子树
		const [nextProps] = resolveProps(n2.type.props, n2.props);
		for (const key in nextProps) {
			// 更新实例里的props, 由于在mountComponent时将props进行了shallowReactive，从而更新props时会触发子组件自渲染更新
			props[key] = nextProps[key];
		}
		for (const key in props) {
			if (!(key in nextProps)) {
				delete props[key];
			}
		}
	}
}

/**
 * 根据组件声明的props，解析实际传入的props值，返回解析后的props和attrs
 * @param {object} options 组件的选项对象声明的props
 * @param {object} propsData 实际传入的props
 * @returns {Array} 返回解析后的props和attrs
 */
function resolveProps(options, propsData) {
	const props = {};
	const attrs = {};
	for (const key in propsData) {
		if (key in options || key.startsWith('on')) {
			// 把事件处理函数onXxx也要加入props中，这样emit才能找到对应的处理函数
			props[key] = propsData[key];
		} else {
			attrs[key] = propsData[key];
		}
	}
	return [props, attrs];
}

/**
 * 浅层比较prevProps与nextProps
 * @param {object} prevProps
 * @param {object} nextProps
 * @returns {boolean} prevProps与nextProps浅层比较的结果
 */
function propsHasChanged(prevProps, nextProps) {
	const nextKeys = Object.keys(nextProps);
	if (nextKeys.length !== Object.keys(prevProps).length) return true;
	for (let index = 0; index < nextKeys.length; index++) {
		const key = nextKeys[index];
		if (prevProps[key] !== nextProps[key]) return true;
	}
	return false;
}

function shallowReadOnly(data) {
	for (const key in data) {
		if (Object.hasOwnProperty.call(data, key)) {
			Object.defineProperty(data, key, {
				writable: false
			});
		}
	}
	return data;
}

// function shallowReadOnlyByProxy(data) {
// 	return new Proxy(data, {
// 		get() {
// 			return Reflect.get(...arguments);
// 		},
// 		set() {
// 			console.error('read only data cannot be written');
// 			return false;
// 		}
// 	});
// }
