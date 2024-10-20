/**
 * @file AutoReply 类定义文件
 * @module AutoReply
 */

import puppeteer from 'puppeteer';
import fetch from 'node-fetch';
globalThis.fetch = fetch;

/**
 * AutoReply 类,用于自动回复和操作浏览器
 */
class AutoReply {
    /**
     * 创建一个 AutoReply 实例
     */
    constructor() {
        /** @type {puppeteer.Browser} */
        this.browser = null;
        /** @type {puppeteer.Page} */
        this.page = null;
        /** @type {{x: number, y: number}} */
        this.currentMousePosition = {
            x: 0,
            y: 0
        };
    }

    /**
     * 初始化浏览器和页面
     * @async
     */
    async init() {
        const browserURL = 'http://127.0.0.1:9333';
        this.browser = await puppeteer.connect({ browserURL });
        this.page = await this.browser.newPage();

        const dimensions = await this.page.evaluate(() => {
            return {
                width: window.screen.width,
                height: parseInt(window.screen.height * 0.8)
            };
        });

        await this.page.setViewport(dimensions);
        this.currentMousePosition = {
            x: dimensions.width / 2,
            y: dimensions.height / 2
        };
    }

    /**
     * 跳转到指定 URL
     * @async
     * @param {string} url - 目标 URL
     */
    async goto(url) {
        await this.page.goto(url);
    }

    /**
     * 等待指定时间
     * @async
     * @param {number} time - 等待时间(毫秒)
     * @returns {Promise<void>}
     */
    async waitForTimeout(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    /**
     * 获取元素中心坐标
     * @async
     * @param {string} selector - 元素选择器
     * @returns {Promise<{x: number, y: number}>} 元素中心坐标
     */
    async getElementCenter(selector) {
        await this.page.waitForSelector(selector, { timeout: 30000, visible: true });
        const element = await this.page.$(selector);
        const boundingBox = await element.boundingBox();
        return {
            x: boundingBox.x + boundingBox.width / 2,
            y: boundingBox.y + boundingBox.height / 2
        };
    }

    /**
     * 模拟鼠标移动
     * @async
     * @param {{x: number, y: number}} startPoint - 起始点
     * @param {{x: number, y: number}} endPoint - 终点
     * @param {Function} [onEnd] - 移动结束回调
     */
    async moveMouse(startPoint, endPoint, onEnd = () => {}) {
        const distance = Math.sqrt((endPoint.x - startPoint.x) ** 2 + (endPoint.y - startPoint.y) ** 2);
        const steps = Math.ceil(distance / 5);
        const accelerationSteps = Math.floor(steps * 0.3);
        const decelerationSteps = Math.floor(steps * 0.3);
        const constantSpeedSteps = steps - accelerationSteps - decelerationSteps;

        await this.page.evaluate(() => {
            if (!document.getElementById('mouse-pointer')) {
                const pointer = document.createElement('div');
                pointer.id = 'mouse-pointer';
                pointer.style.position = 'absolute';
                pointer.style.width = '10px';
                pointer.style.height = '10px';
                pointer.style.backgroundColor = 'red';
                pointer.style.borderRadius = '50%';
                pointer.style.zIndex = '9999';
                document.body.appendChild(pointer);
            }
        });

        async function requestAnimationFrame() {
            return new Promise(resolve => {
                setTimeout(resolve, 10);
            });
        }
        async function animateToPoint(start, end, duration, bezierPoints, updatePosition) {
            const startTime = performance.now();

            function bezier(t, points) {
                const [p0, p1, p2, p3, p4, p5] = points.map(p => p / 100);
                return Math.pow(1 - t, 5) * p0 +
                       5 * Math.pow(1 - t, 4) * t * p1 +
                       10 * Math.pow(1 - t, 3) * Math.pow(t, 2) * p2 +
                       10 * Math.pow(1 - t, 2) * Math.pow(t, 3) * p3 +
                       5 * (1 - t) * Math.pow(t, 4) * p4 +
                       Math.pow(t, 5) * p5;
            }

            async function animate() {
                const currentTime = performance.now();
                const elapsed = currentTime - startTime;
                const t = Math.min(elapsed / duration, 1);
                const position = bezier(t, bezierPoints);

                const pos = {
                    x: start.x + (end.x - start.x) * position,
                    y: start.y + (end.y - start.y) * position
                };

                await updatePosition(pos.x, pos.y);

                if (t < 1) {
                    await requestAnimationFrame();
                    await animate();
                } else {
                    onEnd(end.x, end.y);
                }
            }

            await animate();
        }
        const start = startPoint;
        const end = endPoint;
        const duration = 100 + Math.random() * 400;
        const bezierPoints = [0, 10, 100, 100, 100, 100];

        await animateToPoint(start, end, duration, bezierPoints, async (x, y) => {
            await this.page.evaluate((x, y) => {
                const pointer = document.getElementById('mouse-pointer');
                if (pointer) {
                    pointer.style.left = `${x}px`;
                    pointer.style.top = `${y}px`;
                }
            }, x, y);
        });
    }

    /**
     * 点击元素
     * @async
     * @param {string} selector - 元素选择器
     */
    async clickElement(selector) {
        const { x, y } = await this.getElementCenter(selector);
        await this.page.mouse.click(x, y);
    }

    /**
     * 关闭浏览器
     * @async
     */
    async close() {
        await this.browser.close();
    }

    /**
     * 移动到元素
     * @async
     * @param {string} selector - 元素选择器
     */
    async moveToElement(selector) {
        const { x, y } = await this.getElementCenter(selector);
        const currentMousePosition = this.currentMousePosition;
        await this.waitForTimeout(500);
        await this.moveMouse(currentMousePosition, { x, y }, (x, y) => {
            this.currentMousePosition = { x, y };
        });
    }

    /**
     * 移动到元素并点击
     * @async
     * @param {string} selector - 元素选择器 
     */
    async moveAndClickElement(selector) {
        await this.moveToElement(selector);
        await this.waitForTimeout(100);
        await this.clickElement(selector);
    }

    /**
     * 发送消息
     * @async
     * @param {string} message - 要发送的消息
     */
    async sendMessage(message) {
        await this.moveAndClickElement('.boss-chat-editor-input');
        await this.waitForTimeout(500);
        await this.page.keyboard.type(message);
        await this.waitForTimeout(500);
        await this.moveAndClickElement('.conversation-editor .submit-content .submit');
    }
}

export default AutoReply;