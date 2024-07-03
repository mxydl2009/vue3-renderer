export let currentInstance = null;

export function setCurrentInstance(instance) {
	currentInstance = instance;
}

export function onUnmounted(fn) {
	currentInstance && currentInstance.unMounted.push(fn);
}

export function onMounted(fn) {
	currentInstance && currentInstance.mounted.push(fn);
}
