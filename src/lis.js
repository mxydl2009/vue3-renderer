/**
 * ### 求解最长递增子序列
 *
 * **来自vue.js version 3**
 * @returns
 */
function lis(arr) {
	const p = arr.slice();
	const result = [0];
	let i, j, u, v, c;
	const len = arr.length;

	for (i = 0; i < len; i++) {
		const arrI = arr[i];
		if (arrI !== 0) {
			j = result[result.length - 1];
			if (arr[j] < arrI) {
				p[i] = j;
				result.push(i);
				continue;
			}
			u = 0;
			v = result.length - 1;
			while (u < v) {
				c = ((u + v) / 2) | 0;
				if (arr[result[c]] < arrI) {
					u = c + 1;
				} else {
					v = c;
				}
			}
			if (arrI < arr[result[u]]) {
				if (u > 0) {
					p[i] = result[u - 1];
				}
				result[u] = i;
			}
		}
	}

	u = result.length;
	v = result[u - 1];
	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}
	return result;
}

// vue3中使用的获取最长递增子序列的方法，这里的结果是子序列在原数组中的索引值
/**
 * 1. 使用所谓的贪心算法（即替换），可以保证得到的递增子序列长度一定是最长的吗?
 *   假定在索引i处的最长递增子序列为s, 那么在索引i + 1处，
 *   1.1 如果nums[i + 1] < s的最后一个元素，那么nums[i + 1]一定可以和s中的元素形成一个递增子序列, 但这个子序列长度不超过s的长度
 *   把nums[i + 1]加入s, 替换s中的某个元素，在索引i + 1处的最长递增子序列的长度不变;
 *   1.2 如果nums[i + 1] > s的最后一个元素，那么nums[i + 1]可以加载s后，形成最新的最长递增子序列;
 *   我们目前讨论的是情况1.1，也就是说，在1.1的情境下，通过替换，可以保证i + 1处的最长递增子序列的长度不变;
 *   根据数学归纳法的思想，i + 2, i + 3, ...一直到结束，都不会对最长递增子序列的长度有影响;
 *   所谓贪心，指的是，如果子序列的元素值越小，在后续就越容易形成更长的子序列
 * 2. 如何根据替换后的数据，还原为本来的最长递增子序列?
 *   2.1 替换后的数据里，最后一项一定是正确的，不管是被替换的，还是由于递增被添加的;
 *   2.2 被替换的前一项在顺序上一定是正确的，被替换的项的后面所有项才是顺序错误的;被添加的前一项肯定是正确的;
 *   2.3 不管是被替换，还是被添加，当前项的前一项会被p数组记录在p[i];
 *   2.4 从后向前还原，最后一项正确，倒数第二项被记录在p[倒数第二项]里;
 *   2.5 倒数第二项不管是被替换还是添加，倒数第三项一定是正确的，并且倒数第三项被记录在p[倒数第三项]里;
 *   2.6 根据递推关系，从倒数第一项是正确的，倒数第二，倒数第三，一直到第一项，都可以从p数组中还原回来.
 *       结果数组result的倒数第二项就是p数组的倒数第二项，result[倒数第三项] = p[倒数第三项], ...,
 *       一直到第一项，result[第一项] = p[arr的长度 - result的长度]
 * @param {*} arr
 * @returns
 */
function getRequence(arr) {
	const length = arr.length;

	// 描述最长递增子序列的数组，元素是递增元素对应的下标
	const result = [0];
	// result 最后一个元素
	let resultLast;

	let start;
	let end;
	let middle;

	let p = arr.slice();

	for (let i = 0; i < length; i++) {
		const arrI = arr[i];

		// 在 Vue 3 Diff 中，0 表示该新节点不在旧节点的中，是需要进行新增的节点
		if (arrI !== 0) {
			resultLast = result[result.length - 1];

			if (arrI > arr[resultLast]) {
				result.push(i);
				// p[i]是原来结果的最后一项
				p[i] = resultLast;

				continue;
			}

			start = 0;
			end = result.length - 1;

			// 如果arrI的值不大于arr[resultLast], 即arrI不大于当前递增子序列的最后一项，
			// 那么就要根据二分查找替换递增子序列的某一项了
			while (start < end) {
				middle = ((start + end) / 2) | 0; // 或者 middle = Math.floor((start  end) / 2);

				if (arr[result[middle]] < arrI) {
					start = middle + 1;
				} else {
					end = middle;
				}
			}

			// while 循环结束后，start 和 end 会指向同一个元素, 此时找到替换的位置，
			// 替换某一项s[j]，同时将该项前面的那一项s[j - 1]记录在p[i]中
			if (arr[result[end]] > arrI) {
				result[end] = i;
				p[i] = result[end - 1];
			}
		}
	}

	/**
	 * p数组里，p[i]要么是
	 */
	// 找到最长递增子序列的长度了
	let i = result.length;
	// 结果序列里的最后一项
	let last = result[i - 1];

	while (i-- > 0) {
		result[i] = last;
		last = p[last];
	}

	return result;
}

/**
 * 返回的是最长递增子序列，而非子序列在原数组的索引
 * @param {*} arr
 * @returns
 */
function getRequenceValue(arr) {
	const length = arr.length;

	// 描述最长递增子序列的数组，元素是递增元素对应的下标
	const result = [arr[0]];
	// result 最后一个元素
	let resultLast;

	let start;
	let end;
	let middle;

	let p = arr.slice();

	for (let i = 0; i < length; i++) {
		const arrI = arr[i];

		// 在 Vue 3 Diff 中，0 表示该新节点不在旧节点的中，是需要进行新增的节点
		if (arrI !== 0) {
			resultLast = result[result.length - 1];

			if (arrI > resultLast) {
				result.push(arrI);
				// p[i]是原来结果的最后一项
				p[i] = resultLast;

				continue;
			}

			start = 0;
			end = result.length - 1;

			// 如果arrI的值不大于arr[resultLast], 即arrI不大于当前递增子序列的最后一项，
			// 那么就要根据二分查找替换递增子序列的某一项了
			while (start < end) {
				middle = ((start + end) / 2) | 0; // 或者 middle = Math.floor((start  end) / 2);

				if (result[middle] < arrI) {
					start = middle + 1;
				} else {
					end = middle;
				}
			}

			// while 循环结束后，start 和 end 会指向同一个元素, 此时找到替换的位置，
			// 替换某一项s[j]，同时将该项前面的那一项s[j - 1]记录在p[i]中
			if (result[end] > arrI) {
				result[end] = arrI;
				p[i] = result[end - 1];
			}
		}
	}

	console.log('输入数组: ', arr);
	console.log('p 数组: ', p);
	console.log('还未修正的result 数组: ', result);
	/**
	 * 不管是子序列递增，还是替换，p数组都记录了当前
	 */
	// 找到最长递增子序列的长度了
	let i = result.length - 1;
	// 结果序列里的最后一项
	// let last = result[i];
	const interval = length - i - 1;

	// while (i >= 0) {
	// 	result[i - 1] = p[i + interval];
	// 	i--;
	// }
	for (; i > 0; i--) {
		result[i - 1] = p[i + interval - 1];
	}

	console.log('修正后的数组: ', result);

	return result;
}

export default lis;
