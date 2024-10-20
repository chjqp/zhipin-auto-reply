# 自动回复BOSS直聘 zhipin-auto-reply

zhipin-auto-reply 是一个自动回复和处理BOSS直聘聊天的Node.js应用程序。

## 功能特点

- 自动浏览和处理BOSS直聘的聊天消息
- 根据预设条件筛选候选人
- 自动发送初始消息和请求简历
- 模拟真实的鼠标移动和点击行为
- 根据职位类型应用不同的筛选条件
- 检查候选人简历中是否包含特定技能（如Vue/Node.js）



## 前置条件

在使用本程序之前，请确保您已经拥有BOSS直聘的招聘端账号，并且已经在Chrome浏览器中登录。以下是详细步骤：

1. 打开Chrome浏览器，并启动调试模式：
   - Windows:
     ```
     chrome --remote-debugging-port=9333
     ```
   - Mac:
     ```
     open -a Google\ Chrome --args --remote-debugging-port=9333
     ```

2. 在启动后的Chrome浏览器中，访问BOSS直聘网站并登录您的招聘端账号。

3. 确保您已经成功登录并可以访问招聘端的聊天页面。

完成以上步骤后，您可以继续进行安装和使用本程序。

## 安装

按照以下步骤进行安装：

1. 进入项目目录：
   ```
   cd zhipin-auto-reply
   ```

2. 安装依赖：
   ```
   yarn install
   ```

## 使用方法

1. 确保您已经登录了BOSS直聘网站，并且浏览器已经在运行。

2. 运行程序：
   ```
   yarn start
   ```

3. 程序将自动连接到浏览器，并开始处理聊天消息。

## 配置

您可以在 `src/config/constants.js` 文���中修改以下配置：

```javascript
/** @constant {string} BROWSER_URL - 浏览器 URL */
export const BROWSER_URL = 'http://127.0.0.1:9333';

/** @constant {string} CHAT_URL - 聊天页面 URL */
export const CHAT_URL = 'https://www.zhipin.com/web/chat/index';

/** @constant {string[]} RANDOM_RESPONSES - 随机回复列表 */
export const RANDOM_RESPONSES = ['好的', '好', 'OK', '收到', '收到，我看看', '好的，我看看'];
```

## 职位筛选配置

您可以在 `src/config/positionFilters.js` 文件中配置不同职位的筛选条件。以下是positionFilter的说明：

1. 结构：
   POSITION_FILTERS是一个对象，其中每个键代表一个职位，值是该职位的筛选条件。

2. 当前定义的职位：
   - '前端'
   - '测试'
   （其他职位如'产品经理'、'全栈'和'默认'目前被注释掉了）

3. 筛选条件：
   每个职位的筛选条件包括以下几个属性：
   - requireGraduate：是否要求应届毕业生
   - requireUndergraduateOrMaster：是否要求本科或硕士学历
   - excludeWomen：是否排除女性候选人
   - requireVueNodejs：是否要求具备Vue/Node.js技能
   - isNewGraduate：是否要求1年以内的新毕业生（仅在'测试'职位中使用）

4. 示例：
   以'前端'职位为例：

   ```javascript
   '前��': {
       requireGraduate: true,
       requireUndergraduateOrMaster: true,
       excludeWomen: true,
       requireVueNodejs: true
   },
   ```

   这意味着前端职位要求应届毕业生，本科或硕士学历，排除女性候选人，并且要求具备Vue/Node.js技能。

5. 注意事项：
   - 请确保您的筛选条件符合相关法律法规和道德标准。
   - 某些筛选条件（如excludeWomen）可能会引起争议，请谨慎使用。

## 项目结构

- `src/index.js`: 主程序入口文件
- `src/services/AutoReply.js`: AutoReply 类定义，处理自动回复和浏览器操作
- `src/utils/helpers.js`: 辅助函数
- `src/config/constants.js`: 常量定义
- `src/config/positionFilters.js`: 职位筛选条件配置

## 依赖

- puppeteer: 用于控制浏览器
- node-fetch: 用于网络请求

## 注意事项

- 请确保您的使用符合BOSS直聘的用户协议和相关法律法规。
- 本程序仅用于学习和研究目的，不应用于任何非法或不道德的用途。

## TODO

- 重构职位筛选配置结构:
  - 在`src/config/positionFilters.js`中,为每个职位增加更灵活的筛选条件配置,如`keywords`, `experienceYears`, `salaryRange`等。
  - 示例:
    ```javascript
    '前端': {
      keywords: ['JavaScript', 'Vue', 'React'],
      experienceYears: { min: 0, max: 3 },
      salaryRange: { min: 10000, max: 25000 },
      education: ['本科', '硕士'],
      gender: 'any'
    }
    ```

- 实现通用筛选逻辑:
  - 修改`src/index.js`中的`isCandidateQualified`函数,支持新增的筛选条件。
  - 实现关键词匹配、工作年限范围判断、薪资范围判断等功能。

- 增强简历解析功能:
  - 在`src/index.js`中增加新的函数,用于从简历内容中提取更多信息,如工作年限、期望薪资等。

- 优化用户界面:
  - 创建一个简单的Web界面,用于实时配置和修改筛选条件。
  - 使用Express.js或类似的框架来提供API接口,允许动态更新配置。

- 添加数据统计和报告功能:
  - 记录筛选结果和操作日志。
  - 实现基本的数据分析功能,如每日筛选数量、匹配率等。

- 提高程序的健壮性:
  - 增加错误处理和日志记录。
  - 实现自动重试机制,处理网络波动等问题。

- 优化性能:
  - 使用缓存机制减少重复的简历解析。
  - 考虑使用多线程处理大量候选人信息。

- 完善文档:
  - 更新README.md,详细说明新增功能的使用方法。
  - 编写开发者文档,便于其他开发者理解和扩展代码。