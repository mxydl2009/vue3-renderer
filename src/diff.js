/**
 * @file
 * 定义diff算法
 * @module diff
 */
import patch from './patch';
import unmount from './unmount';
/**
 * ### 不使用key来标记节点时的diff算法
 * 核心思想: 因为没有key的帮助，无法识别新旧节点列表中，究竟哪些节点是可以复用的，所以依次按照顺序对比patch
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
 * 核心思想: 针对单端diff的劣势(新的子节点集中的头部节点是旧的子节点集中的尾部的情况，需要多次移动操作), 减少移动操作的次数;
 * 根据针对的场景，因此要进行双端比对。如果双端比对命中，那么移动操作的优化就会生效。如果双端比对未命中，则退化为遍历旧子节点集来寻找可复用节点;
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
			patch(oldEndVNode, newEndVNode, container, null, renderOptions);
			// 把旧头部对应的DOM移到末尾
			insert(oldEndVNode.el, container, null);

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
				insert(oldReusableVNode, container, anchor);

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

	// 如果双端diff终止了，newStartIndex < newEndIndex，说明这些在[newStartIndex, newEndIndex]的新节点需要挂载
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
