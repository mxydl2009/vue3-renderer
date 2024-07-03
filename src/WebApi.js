const WebApi = {
	// 创建元素
	createElement(tag) {
		return document.createElement(tag);
	},
	createTextNode(content) {
		return document.createTextNode(content);
	},
	setElementText(el, text) {
		el.textContent = text;
	},
	setTextNodeValue(textNode, content) {
		textNode.value = content;
	},
	insert(node, parent, anchor = null) {
		parent.insertBefore(node, anchor);
	},
	setAttribute(el, key, value) {
		el.setAttribute(key, value);
	},
	patchProp(el, key, prevValue, nextValue) {
		if (key.startsWith('on')) {
			// 处理事件prop, 每种事件类型添加一个包装好的事件处理函数，每种事件类型的处理函数由包装好的处理函数来缓存
			const eventType = key.slice(2).toLowerCase(); // 事件类型
			let invoker = el._invoker || (el._invoker = {}); // 缓存包装好的事件处理函数，方便添加和移除事件处理函数
			// invoker: { eventType: Array<handler> }
			// invoker[eventType]= (e) => { invoker[eventType].value.forEach(fn => fn(e))}
			if (nextValue) {
				if (!Array.isArray(nextValue)) {
					nextValue = [nextValue];
				}
				// 添加/更新事件
				if (invoker[eventType]) {
					// invoker存在，表示已经创建过了，本次需要更新事件
					invoker[eventType].value = nextValue;
				} else {
					// invoker不存在，表示未创建过，本次需要创建并添加事件
					el._invoker[eventType] = invoker[eventType] = (e) => {
						// 仅当触发事件的时刻晚于事件绑定的时刻，才触发绑定的事件,
						// 为了避免DOM更新造成事件绑定被误触发的情况
						// 如果一个事件在更新后才被绑定，而冒泡如果在更新之后，那么就会触发该事件
						// 但实际上，本次事件触发是在上一次渲染而非本次，这就是误触发
						if (e.timeStamp > invoker.attachedTime) {
							invoker[eventType].value.forEach((fn) => fn(e));
						}
					}; // 缓存起来
					// 添加绑定时间
					invoker.attachedTime = performance.now();
					// 添加事件
					invoker[eventType].value = nextValue;

					el.addEventListener(eventType, invoker[eventType]);
				}
			} else {
				// 卸载事件
				el.removeEventListener(eventType, invoker[eventType]);
			}
		} else if (key === 'class') {
			const normalizeClassValue = normalizeClass(nextValue);
			// class单独处理
			// 用className的性能最优，其他的setAttribute('class', value)和classList接口性能较差
			// classList的本质上是用来操作class的，而非只是设置
			el.className = normalizeClassValue || '';
		} else if (key === 'style') {
			// style单独处理
			const normalizeStyleValue = normalizeStyle(nextValue);
			for (const key in normalizeStyleValue) {
				el.style[key] = normalizeStyleValue[key];
			}
		} else if (shouldSetAsDOMProperty(el, key)) {
			const type = typeof el[key];
			// 如果当前prop属于DOM Property，就优先使用DOM Property来设置属性值
			if (type === 'boolean' && nextValue === '') {
				// 如果DOM元素的属性类型是Boolean且要设置的属性值为空字符串，那么需要进行矫正
				el[key] = true;
			} else {
				// 优先使用DOM Properties来设置prop
				el[key] = nextValue;
			}
		} else {
			// 当前prop不属于DOM Property，那么使用HTML Attribute来设置
			WebApi.setAttribute(el, key, nextValue);
		}
	},
	removeChildFromParent(parent, child) {
		parent.removeChild(child);
	},
	moveElementToContainer(el, container, anchor) {
		const parent = el.parentNode;
		WebApi.removeChildFromParent(parent, el);
		WebApi.insert(el, container, anchor);
	}
};

function shouldSetAsDOMProperty(el, key) {
	const formElements = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'];
	if (formElements.includes(el.tagName) && key === 'form') {
		return false;
	} else {
		return key in el;
	}
}

/**
 * 将class的值归一化为字符串
 * @param {string|object|Array<string|object>} value class属性值
 * A@returns {string} 归一化后的字符串值
 */
function normalizeClass(value) {
	if (typeof value === 'string') return value;
	let res = '';
	if (Array.isArray(value)) {
		res = value.reduce((acc, v) => {
			if (typeof v === 'string') {
				acc = acc + ' ' + v;
				return acc;
			} else {
				// v is object
				for (const k in v) {
					if (Boolean(v[k]) === true) {
						res = res + ' ' + k;
					}
				}
				return res;
			}
		}, res);
		return res;
	}
	if (typeof value === 'object') {
		for (const k in value) {
			if (value[k] === true) {
				res = res + ' ' + k;
			}
		}
		return res;
	}
}

/**
 * 归一化style属性值
 * @param {Array<object>|object} value 配置的style属性值
 * @returns {object} 归一化后的style属性值
 */
function normalizeStyle(style) {
	function normalizeStyleObject(obj) {
		let res = {};
		for (const key in obj) {
			if (key.includes('-')) {
				const transformedKey = kebabToCamel(key);
				res[transformedKey] = obj[key];
			} else {
				res[key] = obj[key];
			}
		}
		return res;
	}
	if (Array.isArray(style)) {
		let res = {};
		res = style.reduce((acc, s) => {
			const normalized = normalizeStyleObject(s);
			Object.assign(acc, normalized);
			return acc;
		}, res);
		return res;
	}
	if (typeof style === 'object') {
		return normalizeStyleObject(style);
	}
}

function kebabToCamel(str) {
	return str.replace(/-([a-z])/g, (match, p1) => {
		return p1.toUpperCase();
	});
}

export default WebApi;
