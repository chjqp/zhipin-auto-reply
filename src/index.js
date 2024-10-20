/**
 * @file 主程序入口文件
 * @module index
 */

import AutoReply from './services/AutoReply.js';
import { CHAT_URL, RANDOM_RESPONSES } from './config/constants.js';
import { getRandomElement, wait } from './utils/helpers.js';
import { POSITION_FILTERS } from './config/positionFilters.js';

/**
 * 主函数,初始化自动回复并开始处理聊天
 * @async
 */
async function main() {
    const autoReply = new AutoReply();
    await autoReply.init();
    await autoReply.goto(CHAT_URL);

    while (true) {
        try {
            await processChats(autoReply);
        } catch (error) {
            console.debug(error.toString());
            await wait(10000);
        }
    }
}

/**
 * 处理聊天的主要逻辑
 * @async
 * @param {AutoReply} autoReply - AutoReply 实例
 */
async function processChats(autoReply) {
    await wait(2000);
    await clickTabs(autoReply);
    await filterMessages(autoReply);
    
    const candidateInfo = await getCandidateInfo(autoReply);
    
    if (candidateInfo.isMessageSent) {
        await sendRandomResponse(autoReply);
        return;
    }

    if (!isCandidateQualified(candidateInfo)) {
        return;
    }

    await sendInitialMessage(autoReply);
    await requestResume(autoReply);
}

/**
 * 点击聊天标签
 * @async
 * @param {AutoReply} autoReply - AutoReply 实例
 */
async function clickTabs(autoReply) {
    await autoReply.moveAndClickElement('.chat-filter-container .chat-label-item:nth-child(1)');
    await wait(500);
    await autoReply.moveAndClickElement('.chat-filter-container .chat-label-item:nth-child(2)');
}

/**
 * 过滤消息
 * @async
 * @param {AutoReply} autoReply - AutoReply 实例
 */
async function filterMessages(autoReply) {
    await autoReply.moveAndClickElement('.chat-message-filter > div > span:nth-child(2)');
}

/**
 * 获取候选人信息
 * @async
 * @param {AutoReply} autoReply - AutoReply 实例
 * @returns {Promise<Object>} 候选人信息对象
 */
async function getCandidateInfo(autoReply) {
    const candidates = await autoReply.page.$$('.user-list .geek-item');
    let pos = 1;
    let isFound = false;
    for (const candidate of candidates) {
        const badgeCount = await candidate.$('.badge-count-common-less');
        if (badgeCount) {
            const sourceJob = await candidate.$eval('.source-job', el => el.textContent);
            for (const position in POSITION_FILTERS) {
                if (sourceJob.includes(position)) {
                    await autoReply.moveAndClickElement(`.user-list .geek-item:nth-child(${pos}) .badge-count-common-less`);
                    isFound = true;
                    break;
                }
            }
        }
        if (isFound) break;
        pos++;
    }
    // await autoReply.moveAndClickElement('.user-list .badge-count-common-less');
    if (!isFound) {
        await autoReply.moveAndClickElement('.user-list .badge-count-common-less');
    }
    await wait(400);
    
    const hasVueNodeJsNodejs = await checkResumeForSkills(autoReply);
    
    return await autoReply.page.evaluate(evaluateCandidateInfo, hasVueNodeJsNodejs);
}

/**
 * 检查简历中是否包含Vue/Node.js/NodeJS
 * @async
 * @param {AutoReply} autoReply - AutoReply 实例
 * @returns {Promise<boolean>} 是否包含Vue/Node.js/NodeJS
 */
async function checkResumeForSkills(autoReply) {
    await autoReply.moveAndClickElement('.resume-btn-content > a');
    await wait(1000);
    
    const resumeContent = await autoReply.page.evaluate(() => {
        const resumeDialog = document.querySelector('.resume-container .boss-popup__content');
        return resumeDialog ? resumeDialog.textContent : '';
    });
    
    await autoReply.moveAndClickElement('.boss-popup__close > i');
    
    return resumeContent.toLowerCase().includes('vue') || 
           resumeContent.toLowerCase().includes('node.js') || 
           resumeContent.toLowerCase().includes('nodejs');
}

/**
 * 评估候选人信息
 * @param {boolean} hasVueNodeJsNodejs - 是否包含Vue/Node.js/NodeJS
 * @returns {Object} 候选人信息对象
 */
function evaluateCandidateInfo(hasVueNodeJsNodejs) {
    const baseInfo = document.querySelector('.base-info-single-detial');
    if (!baseInfo) return { 
        isGraduate: true, 
        isNewGraduate: false, 
        isUndergraduateOrMaster: true, 
        isWomen: false, 
        isMessageSent: false, 
        hasVueNodeJsNodejs,
        position: '未知职位'
    };
    
    const textContent = baseInfo.textContent;
    const htmlContent = baseInfo.innerHTML;
    
    const positionElement = document.querySelector('span.position-name');
    const position = positionElement ? positionElement.textContent.trim() : '未知职位';
    
    return {
        isGraduate: textContent.includes('25年') || textContent.includes('26年'),
        isNewGraduate: textContent.includes('24年') || textContent.includes('1年'),
        isUndergraduateOrMaster: textContent.includes('本科') || textContent.includes('硕士') || textContent.includes('博士'),
        isWomen: htmlContent.includes('icon-icon-women'),
        isMessageSent: Array.from(document.querySelectorAll('.item-myself .text span')).map(span => span.innerText).includes('你好'),
        hasVueNodeJsNodejs,
        position
    };
}

/**
 * 判断候选人是否符合条件
 * @param {Object} candidateInfo - 候选人信息对象
 * @returns {boolean} 是否符合条件
 */
function isCandidateQualified(candidateInfo) {
    const { position, isGraduate, isUndergraduateOrMaster, isWomen, hasVueNodeJsNodejs, isNewGraduate } = candidateInfo;
    const filter = getFilterForPosition(position);
    const reasons = [];
    if (!filter) reasons.push('未匹配到职位');
    if (filter && filter.requireGraduate && !isGraduate) reasons.push('不是应届生');
    if (filter && filter.isNewGraduate && !isNewGraduate) reasons.push('不是1年以内');
    if (filter && filter.requireUndergraduateOrMaster && !isUndergraduateOrMaster) reasons.push('不是本科或硕士或博士');
    if (filter && filter.excludeWomen && isWomen) reasons.push('是女性');
    if (filter && filter.requireVueNodejs && !hasVueNodeJsNodejs) reasons.push('简历中不包含Vue/Node.js/NodeJS');
    
    const isQualified = reasons.length === 0;
    console.debug(`职位: ${position}, 匹配过滤器: ${filter?.name || '无'}, 判断结果: ${isQualified ? '继续' : '跳过'}, 原因: ${reasons.join('，') || '符合所有条件'}`);
    
    return isQualified;
}

/**
 * 根据职位名称获取对应的过滤器
 * @param {string} position - 职位名称
 * @returns {Object} 匹配的过滤器
 */
function getFilterForPosition(position) {
    const positionLower = position.toLowerCase();
    for (const [key, filter] of Object.entries(POSITION_FILTERS)) {
        if (positionLower.includes(key.toLowerCase())) {
            return { ...filter, name: key };
        }
    }
    return null;
}

/**
 * 发送随机回复
 * @async
 * @param {AutoReply} autoReply - AutoReply 实例
 */
async function sendRandomResponse(autoReply) {
    await wait(1000 + Math.random() * 2000);
    await autoReply.sendMessage(getRandomElement(RANDOM_RESPONSES));
}

/**
 * 发送初始消息
 * @async
 * @param {AutoReply} autoReply - AutoReply 实例
 */
async function sendInitialMessage(autoReply) {
    await autoReply.sendMessage('你好');
    await wait(1000);
}

/**
 * 请求简历
 * @async
 * @param {AutoReply} autoReply - AutoReply 实例
 */
async function requestResume(autoReply) {
    await autoReply.moveAndClickElement('.operate-exchange-left span.operate-btn');
    await wait(500);
    await autoReply.moveAndClickElement('.toolbar-box-right .operate-exchange-left .boss-btn-primary');
}

main().catch(console.error);
