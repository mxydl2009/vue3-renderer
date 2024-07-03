/**
 * @file
 * 定义入口文件
 * @module renderer
 */
import patch from './patch';
import unmount from './unmount';
import WebApi from './WebApi';

/**
 * 根据传入的平台渲染API，创建一个平台渲染器，不传的话默认是web平台渲染器
 * @param {object} renderOptions 平台渲染的API集合
 * @returns {object} 渲染器对象
 *
 * ### 渲染器对象
 * 包含render方法
 * ```js
 * render(vnode, container);
 * ```
 */
export function createRenderer(renderOptions = WebApi) {
	return {
		render(vnode, container) {
			if (vnode) {
				// 挂载或者更新操作
				patch(container._vnode, vnode, container, null, renderOptions);
			} else {
				if (container._vnode) {
					// 卸载操作
					unmount(container._vnode, null, renderOptions);
				}
			}
			container._vnode = vnode;
		}
		// hydrate(vnode, container) {
		// 	console.log('hydrate');
		// }
	};
}
// webRender目前只能接收vnode类型的数据，因为没有接入编译器
const webRenderer = createRenderer();
export default webRenderer;
export { default as KeepAlive } from './KeepAlive';
export { default as defineAsyncComponent } from './defineAsyncComponent';
export {
	onBeforeCreate,
	onCreated,
	onBeforeMount,
	onMounted,
	onBeforeUpdate,
	onUpdate,
	onActivated,
	onDeactivated,
	onUnmounted
} from './lifeCycleHooks';
