/**
 * @file 定义diff算法
 *
 */
import patch from './patch';
import unmount from './unmount';
import lis from './lis';
/**
 * ### 不使用key来标记节点时的diff算法
 * #### 核心思想
 * - 因为没有key的帮助，无法识别新旧节点列表中，究竟哪些节点是可以复用的，所以依次按照顺序对比patch
 * @param {*} n1 旧的父节点
 * @param {*} n2 新的父节点
 * @param {DOMElement} 子节点集的父DOM容器
 */
export function diffWithoutKey(n1, n2, container, renderOptions) {
	const oldChildren = n1.children;
	const newChildren = n2.children;
	const oldLen = oldChildren.length;
	const newLen = newChildren.length;
	const commonLen = Math.min(oldLen, newLen);
	for (let index = 0; index < commonLen; index++) {
		const el = newChildren[index].el;
		const anchor = el && el.nextSibling;
		patch(
			oldChildren[index],
			newChildren[index],
			container,
			anchor,
			renderOptions
		);
	}
	if (newLen > oldLen) {
		// 有需要挂载的新节点
		for (let index = commonLen; index < newLen; index++) {
			const el = newChildren[index].el;
			const anchor = el && el.nextSibling;
			patch(null, newChildren[index], container, anchor, renderOptions);
		}
	}
	if (newLen < oldLen) {
		// 有需要卸载的旧节点
		for (let index = commonLen; index < oldLen; index++) {
			unmount(oldChildren[index], renderOptions);
		}
	}
}

/**
 * ### 使用key标记节点时的单端diff算法
 * 核心思想: 通过key可以在新旧子节点列表中，找到可以复用的节点，从而不必卸载和挂载，通过移动可复用节点即可
 */
export function singleEndDiffWithKey(n1, n2, container, renderOptions) {
	const { insert } = renderOptions;
	// 对children的元素进行过滤
	const oldChildren = n1.children.filter(
		(c) => typeof c === 'string' || (typeof c === 'object' && c !== null)
	);
	const newChildren = n2.children.filter(
		(c) => typeof c === 'string' || (typeof c === 'object' && c !== null)
	);
	const oldLen = oldChildren.length;
	const newLen = newChildren.length;
	// 从前向后遍历新节点，记录新节点在旧节点列表中的索引里的最大值，在该新节点之后的节点如果索引都小于该最大值，表明这些节点都需要移动到该新节点的前面
	// 之所以使用这种方式来判断，原因在于移动节点使用的是insertBefore
	// 这种方式在某些场景下可能移动效率并不高，比如要移动很多节点到前面，不如一次移动一个节点到后面，只是没有insertAfter方法
	// 实际上，在面对普遍的场景下，无论是insertBefore还是insertAfter，都是一样的效率
	// 这是判断节点是否需要向前移动的方法，React也是使用这种方式
	let lastIndex = 0;
	for (let i = 0; i < newLen; i++) {
		const newNode = newChildren[i];
		let findReusedNode = false;
		// 遍历旧节点，试图找到新旧节点里可复用的节点
		for (let j = 0; j < oldLen; j++) {
			const oldNode = oldChildren[j];
			const canReuse = isReusable(oldNode, newNode);
			if (canReuse) {
				findReusedNode = true;
				// 找到新旧节点中可复用的节点
				patch(oldNode, newNode, container, null, renderOptions); // 移动前先进行打补丁操作，因为可能节点的props或者子节点有更新
				// 检查节点是否需要移动
				if (j < lastIndex) {
					// 需要向前移动
					// 移动的锚点一定是该新节点前一个节点
					const anchorNode = newChildren[i - 1];
					// 如果anchorNode不存在，说明当前的newNode是第一个遍历到的，那就不用考虑移动了，因为没有参考点
					// 不过如果代码走到这，i一定不是0了
					if (anchorNode) {
						// TODO: anchorNode一定会有el属性？按理说新节点上应该没有el属性吧
						const anchor = anchorNode.el.nextSibling;
						insert(newNode.el, container, anchor);
					} else {
						// 说明i === 0，第一个子节点，虽然不用动，但是需要将旧节点上的el属性拷贝过来
						newNode.el = oldNode.el;
					}
				} else {
					lastIndex = j;
				}
				// 找到可复用节点，停止本轮循环
				break;
			}
		}
		// 没有找到可复用节点，说明新节点不在旧节点中，需要进行挂载
		if (!findReusedNode) {
			let anchor;
			// 因为新节点是按次序处理的，所以第一个新节点处理完后肯定有el属性，那么后面的依次取前面一个节点的el属性是肯定没问题
			if (i === 0) {
				anchor = container.firstChild;
			} else {
				// TODO: 新节点都不知道自己需要挂载到哪，那么新节点应该都没有el属性
				anchor = newChildren[i - 1].el && newChildren[i - 1].el.nextSibling;
				console.log('挂载新节点的anchor是', anchor, newChildren[i - 1]);
			}
			patch(null, newChildren[i], container, anchor, renderOptions);
		}
		// 还原
		findReusedNode = false;
	}
	// 遍历旧子节点集，查找需要删除的子节点
	for (let index = 0; index < oldLen; index++) {
		const oldNode = oldChildren[index];
		const has = newChildren.find((newNode) => isReusable(oldNode, newNode));
		if (!has) {
			// 没有找到，应该删除子节点
			unmount(oldNode, renderOptions);
		}
	}
}

/**
 * #### 判断两个节点之间是否可复用
 * 根据key值和node.type来判断两个节点是否可以复用
 * @param {*} oldNode 旧节点
 * @param {*} newNode 新节点
 * @returns {boolean} 新旧节点是否可以复用
 */
function isReusable(oldNode, newNode) {
	const oldNodeKey = oldNode.key;
	const newNodeKey = newNode.key;
	if (oldNode.type.name === 'keep-alive' && newNode.type.name === 'keep-alive')
		return true;
	if (oldNode.type.name === 'teleport' && newNode.type.name === 'teleport')
		return true;
	if (
		oldNodeKey === undefined ||
		newNodeKey === undefined ||
		oldNodeKey === null ||
		newNodeKey === null
	)
		return false;
	return newNodeKey === oldNodeKey && newNode.type === oldNode.type;
}

/**
 * ### 双端diff算法
 * #### 核心思想:
 * - 针对单端diff的劣势(新的子节点集中的头部节点是旧的子节点集中的尾部的情况，需要多次移动操作), 减少移动操作的次数;
 * - 根据针对的场景，因此要进行双端比对。如果双端比对命中，那么移动操作的优化就会生效。如果双端比对未命中，则退化为遍历旧子节点集来寻找可复用节点;
 */
export function dualEndDiffWithKey(n1, n2, container, renderOptions) {
	const { insert } = renderOptions;
	// 对children的元素进行过滤
	const oldChildren = n1.children.filter(
		(c) => typeof c === 'string' || (typeof c === 'object' && c !== null)
	);
	const newChildren = n2.children.filter(
		(c) => typeof c === 'string' || (typeof c === 'object' && c !== null)
	);
	const oldLen = oldChildren.length;
	const newLen = newChildren.length;

	let newStartIndex = 0,
		newEndIndex = newLen - 1,
		oldStartIndex = 0,
		oldEndIndex = oldLen - 1;

	/**
	 * 双端diff终止条件: 新子节点集或者旧子节点集遍历结束
	 */
	while (newStartIndex <= newEndIndex || oldStartIndex <= oldEndIndex) {
		const newStartVNode = newChildren[newStartIndex];
		const newEndVNode = newChildren[newEndIndex];
		const oldStartVNode = oldChildren[oldStartIndex];
		const oldEndVNode = oldChildren[oldEndIndex];
		if (typeof oldStartVNode === 'undefined') {
			oldStartIndex++;
			continue;
		}
		if (typeof oldEndVNode === 'undefined') {
			oldEndIndex--;
			continue;
		}
		// 尝试查找可复用节点
		if (isReusable(newStartVNode, oldStartVNode)) {
			// 新旧的头部节点一样，可复用, 只patch，不移动
			patch(oldStartVNode, newStartVNode, container, null, renderOptions);

			newStartIndex++;
			oldStartIndex++;
		} else if (isReusable(newStartVNode, oldEndVNode)) {
			// 新头部节点与旧尾部节点一样，可复用，patch，移动
			patch(oldEndVNode, newStartVNode, container, null, renderOptions);
			// 锚点为旧头部节点
			const anchor = oldStartVNode.el;
			// 将旧尾部节点对应的DOM节点，移动到旧头部节点DOM的前面
			insert(oldEndVNode.el, container, anchor);

			newStartIndex++;
			oldEndIndex--;
		} else if (isReusable(newEndVNode, oldStartVNode)) {
			// 新尾部与旧头部一样，可复用，patch，移动
			patch(oldStartVNode, newEndVNode, container, null, renderOptions);
			// 把旧头部对应的DOM移到末尾
			insert(oldStartVNode.el, container, null);

			newEndIndex--;
			oldStartIndex++;
		} else if (isReusable(newEndVNode, oldEndVNode)) {
			// 新旧尾部一样，patch，不移动
			patch(oldEndVNode, newEndVNode, container, null, renderOptions);

			newEndIndex--;
			oldEndIndex--;
		} else {
			// 双端比对后，未找到可复用节点, 退化为遍历旧子节点集来查找可复用节点
			const oldReusableVNodeIndex = oldChildren.findIndex((oldChild) =>
				isReusable(newStartVNode, oldChild)
			);
			if (oldReusableVNodeIndex > 0) {
				// 找到可复用节点, patch，移动
				const oldReusableVNode = oldChildren[oldReusableVNodeIndex];
				patch(oldReusableVNode, newStartVNode, container, null, renderOptions);

				// 锚点必须是旧子节点集的节点对应的DOM，因为新子节点还未挂载，el为undefined，因为此时对比的是newStartVNode，所以锚点是头部节点对应的DOM
				const anchor = oldStartVNode.el;
				// 将oldReusableVNodeIndex对应的DOM节点，移到头部节点对应的DOM
				insert(oldReusableVNode.el, container, anchor);

				// 将处理过的旧子节点置为undefined
				oldChildren[oldReusableVNodeIndex] = undefined;

				newStartIndex++;
			} else {
				// 如果没有找到可复用节点，那么该节点需要新挂载
				const anchor = oldStartVNode.el;
				patch(null, newStartVNode, container, anchor, renderOptions);
			}
		}
	}

	// 如果双端diff终止了，newStartIndex <= newEndIndex，说明这些在[newStartIndex, newEndIndex]的新节点需要挂载
	if (newStartIndex <= newEndIndex) {
		// 挂载剩余新节点
		for (let i = newStartIndex; i <= newEndIndex; i++) {
			patch(
				null,
				newChildren[i],
				container,
				newChildren[i - 1].el,
				renderOptions
			);
		}
	}

	// 如果双端diff终止了，oldStartIndex < oldEndIndex, 说明这些在[oldStartIndex, oldEndIndex]的旧节点需要卸载
	if (oldStartIndex <= oldEndIndex) {
		for (let i = oldStartIndex; i <= oldEndIndex; i++) {
			unmount(oldChildren[i], renderOptions);
		}
	}
}

/**
 * ### 快速diff算法
 *
 * #### 核心思想
 *
 * - 借鉴了文本diff的思想，对节点集进行前置相同和后置相同的预处理判断;
 * - 前置和后置相同判断，从而消费了前置和后置节点后，再继续diff;
 */
export function quickDiffWithKey(n1, n2, container, renderOptions) {
	const { insert } = renderOptions;
	// 对children的元素进行过滤
	const oldChildren = n1.children.filter(
		(c) => typeof c === 'string' || (typeof c === 'object' && c !== null)
	);
	const newChildren = n2.children.filter(
		(c) => typeof c === 'string' || (typeof c === 'object' && c !== null)
	);
	const oldLen = oldChildren.length;
	const newLen = newChildren.length;

	// 先进行前置节点的预处理
	let j = 0;
	while (isReusable(newChildren[j], oldChildren[j])) {
		// 如果前置节点可以复用，那么patch，并且继续循环
		patch(oldChildren[j], newChildren[j], container, null, renderOptions);
		j++;
	}

	// 再进行后置节点的预处理, 由于新旧节点集的数量不一样，所以需要两个变量来记录后置的索引
	let newEndIndex = newLen - 1;
	let oldEndIndex = oldLen - 1;
	while (isReusable(newChildren[newEndIndex], oldChildren[oldEndIndex])) {
		patch(
			oldChildren[oldEndIndex],
			newChildren[newEndIndex],
			container,
			null,
			renderOptions
		);

		newEndIndex--;
		oldEndIndex--;
	}

	/**
	 * 预处理结束后，继续diff
	 * - 如果是旧节点被处理完，那么剩下的新节点需要挂载;
	 * - 如果是新节点被处理完，那么剩下的旧节点需要被卸载;
	 */

	if (oldEndIndex < j && j <= newEndIndex) {
		// 此时旧节点被处理完，剩余的新节点需要挂载
		for (let i = j; i <= newEndIndex; i++) {
			/**
			 * 锚点
			 * - 如果newEndIndex是最后一个元素的索引，那么锚点应该是null，因为要挂载到父节点的末尾
			 * - 如果newEndIndex非最后一个元素的索引，那么锚点应该是newEndIndex + 1的元素，因为该元素已被处理，el属性有值
			 */
			const anchor =
				newEndIndex + 1 === newLen ? null : newChildren[newEndIndex + 1].el;
			patch(null, newChildren[i], container, anchor, renderOptions);
		}
	} else if (newEndIndex < j && j <= oldEndIndex) {
		// 此时新节点被处理完，剩余的旧节点需要卸载
		for (let i = j; j <= oldEndIndex; i++) {
			unmount(oldChildren[i], renderOptions);
		}
	} else {
		// 此时，预处理完后，新旧节点都有剩余，这是更一般的情况
		// 新节点集在预处理后，待更新的数量
		const count = newEndIndex - j + 1;
		// 构建source数据，记录新节点在旧节点集中的索引: source的索引从0开始, 也是从j指向的节点开始
		const source = new Array(count);
		// 初始化填充为-1，另外，如果索引为-1，表示新节点不在旧节点中，说明该新节点是新增的，要挂载
		source.fill(-1);
		/**
		 * 为了提高性能，先根据新节点的key来构建一个Map<key, index>的映射表，方便后期遍历旧节点时根据key查询新节点集中是否有可复用节点
		 *
		 */
		const keyToIndex = new Map();
		for (let i = j; i <= newEndIndex; i++) {
			const newVNode = newChildren[i];
			if (typeof newVNode.key !== 'undefined' && newVNode.key !== null) {
				keyToIndex.set(newVNode.key, i);
			}
		}

		let lastIndex = oldEndIndex - j;
		let needMove = false;
		// 遍历旧子节点，查找可复用节点，更新source数组，根据source数组来确定如何移动可复用节点
		for (let i = j; i <= oldEndIndex; i++) {
			const oldVNode = oldChildren[i];
			const indexInNew = keyToIndex.get(oldVNode.key);

			if (typeof indexInNew !== 'undefined') {
				// 找到可复用节点
				const newVNode = newChildren[indexInNew];
				// patch
				patch(oldVNode, newVNode, container, null, renderOptions);
				// 更新source数组, 记录当前新节点在旧节点集中的索引
				source[indexInNew - j] = i;
				// 判断是否需要移动, 与单端diff的判断方式一样，只是这次是遍历旧节点集，而非新节点集
				if (indexInNew < lastIndex) {
					// 当前
					needMove = true;
				} else {
					lastIndex = indexInNew;
				}
			} else {
				// 没找到可复用节点，说明旧节点要卸载
				unmount(oldVNode, renderOptions);
			}
		}

		if (needMove) {
			// 根据source数组来移动元素, source元素记录了新节点在旧节点中的索引值
			// 计算source数组的最长递增子序列，sequence是子序列元素对应的索引
			// 如source: [0, 8, 4, 12] 最长递增子序列: [0, 8, 12], sequence: [0, 1, 3]
			const sequence = lis(source);

			// 从count - 1的索引开始，递减遍历
			let index = count - 1;
			// s表示最长递增子序列的最后一个元素索引, sequence[s]之后的节点都需要移动
			let s = sequence.length - 1;
			while (index >= 0) {
				if (source[index] === -1) {
					// 挂载新节点
					// 找到新节点的索引
					const position = index + j;
					const newVNode = newChildren[position];
					const anchor =
						position + 1 === newLen ? null : newChildren[position + 1].el;
					patch(null, newVNode, container, anchor, renderOptions);
				} else if (index !== sequence[s]) {
					// 移动, 先获取新节点，然后根据新节点获取对应可复用的老节点
					const position = index + j;
					const newVNode = newChildren[position];
					const anchor =
						position + 1 === newLen ? null : newChildren[position + 1].el;
					// 因为可复用节点已经被patch过了，所以新节点上也有了el属性，这里就可以用新节点的el属性来移动了
					// 如果没有被patch，那么就得根据新节点找到旧节点，使用旧节点的el属性了
					insert(newVNode.el, container, anchor);
				} else {
					// 不移动，s递减
					s--;
				}
				index--;
			}
		}
	}
}
