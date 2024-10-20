/**
 * @file 辅助函数文件
 * @module helpers
 */

/**
 * 从数组中随机选择一个元素
 * @param {Array} array - 输入数组
 * @returns {*} 随机选择的元素
 */
export function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 等待指定时间
 * @param {number} ms - 等待时间(毫秒)
 * @returns {Promise<void>}
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}