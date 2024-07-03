import patch from './patch';
import unmount from './unmount';
import WebApi from './WebApi';

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
const renderer = createRenderer();
export default renderer;
