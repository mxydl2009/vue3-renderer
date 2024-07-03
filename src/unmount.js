/**
 * @file
 * 定义卸载方法
 *
 * @module unmount
 */

import { Fragment } from './nodeType';

/**
 * 卸载节点（组件）
 * @param {*} vnode
 * @param {*} renderOptions
 * @returns {undefined}
 */
export default function unmount(vnode, renderOptions) {
	const { removeChildFromParent } = renderOptions;
	if (typeof vnode.type === 'object') {
		const instance = vnode.component;
		// 组件类型的节点
		if (vnode.shouldKeepAlive) {
			// 应该缓存的组件，不卸载，而是失活, 调用deactivate生命周期函数
			instance.deactivated && instance.deactivated.forEach((fn) => fn());
			return vnode.keepAliveInstance._deactivate(vnode);
		}
		unmount(vnode.component.subTree, renderOptions);
		instance.unmounted && instance.unmounted.forEach((fn) => fn());
	} else if (vnode.type === Fragment) {
		vnode.children && vnode.children.forEach((c) => unmount(c, renderOptions));
	} else {
		const parent = vnode.el && vnode.el.parentNode;
		parent && removeChildFromParent(parent, vnode.el);
	}
}
