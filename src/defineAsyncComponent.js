import { ref } from '@mxydl2009/vue3-responsive';
import { Text } from './nodeType';
import { onUnmounted } from './lifeCycleHooks';

const ErrorBoundary = (error) => ({
	render() {
		return {
			type: 'p',
			children: `render error: ${error.message}`
		};
	}
});

export default function defineAsyncComponent({
	loader,
	timeout = 5000,
	errorComponent = ErrorBoundary
}) {
	// 存储解析后的异步组件
	let innerCom = null;

	return {
		name: 'AsyncComponentWrapper',
		setup() {
			const loaded = ref(false);
			const errorIndicator = ref(false);
			let error = null;
			let timer = setTimeout(() => {
				if (errorIndicator.value === false) {
					errorIndicator.value = true;
					error = new Error(`timeout error: ${timeout} is running out!`);
				}
			}, timeout);

			onUnmounted(() => clearTimeout(timer));

			loader({
				timeout
			})
				.then((c) => {
					loaded.value = true;
					innerCom = c;
					clearTimeout(timer);
				})
				.catch((e) => {
					if (errorIndicator.value === false) {
						errorIndicator.value = true;
						error = e;
					}
				});
			return () => {
				return errorIndicator.value
					? {
							type: errorComponent(error)
						}
					: loaded.value
						? {
								type: innerCom
							}
						: {
								type: Text,
								children: 'loading'
							};
			};
		}
	};
}
