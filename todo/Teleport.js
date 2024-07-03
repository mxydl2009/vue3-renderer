// TODO: 更新时patchChildren的anchor不太对
const Teleport = {
	name: 'teleport',
	__isTeleport: true,
	process(n1, n2, patchOptions, renderOptions) {
		const { patch, patchChildren, unmount, move } = patchOptions;
		if (!n1) {
			// 挂载组件
			const targetContainer =
				typeof n2.props.to === 'string'
					? document.querySelector(n2.props.to)
					: n2.props.to;
			n2.children.forEach((c) =>
				patch(null, c, targetContainer, null, renderOptions)
			);
		} else {
			const targetContainer =
				typeof n2.props.to === 'string'
					? document.querySelector(n2.props.to)
					: n2.props.to;
			if (n1.props.to !== n2.props.to) {
				n1.children.forEach((c) => unmount(c, renderOptions));
				n2.children.forEach((c) => move(c, targetContainer));
			} else {
				patchChildren(n1, n2, targetContainer, renderOptions);
			}
		}
	}
};
export default Teleport;
