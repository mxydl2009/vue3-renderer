/**
 * @file
 * 定义生命周期方法的添加函数
 *
 * @module lifeCycleHooks
 */

export let currentInstance = null;

/**
 * 将传入的实例赋值给当前实例，在组件setup函数调用前，将组件实例传入作为当前实例，这样在setup中注册的生命周期函数会添加到组件实例上，setup调用后释放
 * @param {*} instance
 */
export function setCurrentInstance(instance) {
	currentInstance = instance;
}

export function onBeforeCreate(fn) {
	currentInstance && currentInstance.beforeCreate.push(fn);
}

export function onCreated(fn) {
	currentInstance && currentInstance.created.push(fn);
}

export function onBeforeMount(fn) {
	currentInstance && currentInstance.beforeMount.push(fn);
}

export function onMounted(fn) {
	currentInstance && currentInstance.mounted.push(fn);
}

export function onBeforeUpdate(fn) {
	currentInstance && currentInstance.beforeUpdate.push(fn);
}

export function onUpdate(fn) {
	currentInstance && currentInstance.update.push(fn);
}

export function onActivated(fn) {
	currentInstance && currentInstance.activated.push(fn);
}

export function onDeactivated(fn) {
	currentInstance && currentInstance.deactivated.push(fn);
}

export function onUnmounted(fn) {
	currentInstance && currentInstance.unMounted.push(fn);
}
