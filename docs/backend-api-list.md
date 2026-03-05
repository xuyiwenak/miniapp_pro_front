# 需对接后端的业务接口 API 清单

本文档列出小程序中所有需要后端实现的 HTTP/WebSocket 接口，便于联调与对接。  
统一约定：响应体为 `{ code: 200, data?: any, success?: boolean, message?: string }`，业务数据在 `data` 中；请求头需支持 `Authorization: Bearer <access_token>`（除登录相关外）。

---

## 1. 登录与鉴权

| 接口路径 | 方法 | 调用位置 | 请求参数 | 响应说明 |
|---------|------|----------|----------|----------|
| `/login/postPasswordLogin` | POST | [pages/login/login.js](pages/login/login.js) | `{ data: { account, password } }` | 成功返回 `success: true`，`data.token` 写入本地作为 access_token |
| `/login/getSendMessage` | GET | [pages/login/login.js](pages/login/login.js) | 无（手机号在页面状态，可后端按会话/手机号发码） | 成功返回 `success: true`，前端再跳验证码页 |
| `/login/postCodeVerify` | GET | [pages/loginCode/loginCode.js](pages/loginCode/loginCode.js) | `{ code: string }`（验证码） | 成功返回 `success: true`，`data.token` 写入本地并跳「我的」 |

---

## 2. 首页

| 接口路径 | 方法 | 调用位置 | 请求参数 | 响应说明 |
|---------|------|----------|----------|----------|
| `/home/cards` | GET | [pages/home/index.js](pages/home/index.js) | 无 | `data`: 数组，项为 `{ url, desc, tags }`，`tags` 为 `{ text, theme }[]` |
| `/home/swipers` | GET | [pages/home/index.js](pages/home/index.js) | 无 | `data`: 轮播图 URL 数组（字符串数组） |

---

## 3. 搜索

| 接口路径 | 方法 | 调用位置 | 请求参数 | 响应说明 |
|---------|------|----------|----------|----------|
| `/api/searchHistory` | GET | [pages/search/index.js](pages/search/index.js) | 无 | `data.historyWords`: 搜索历史关键词数组 |
| `/api/searchPopular` | GET | [pages/search/index.js](pages/search/index.js) | 无 | `data.popularWords`: 热门搜索词数组 |

---

## 4. 个人中心与设置

| 接口路径 | 方法 | 调用位置 | 请求参数 | 响应说明 |
|---------|------|----------|----------|----------|
| `/api/genPersonalInfo` | GET | [pages/my/index.js](pages/my/index.js)、[pages/my/info-edit/index.js](pages/my/info-edit/index.js) | 无（依赖 token） | `data.data`: 个人信息 `{ image, name, star, gender, birth, address, brief, photos }`，`address` 为省市区 code 数组，`photos` 为 `{ url, name, type }[]` |
| `/api/getServiceList` | GET | [pages/my/index.js](pages/my/index.js) | 无 | `data.data.service`: 服务列表 `{ image, name, type, url }[]` |

**可选（当前前端未调用）：**

- 个人信息保存：编辑页 [pages/my/info-edit/index.js](pages/my/info-edit/index.js) 中 `onSaveInfo()` 尚未请求后端，若需持久化需新增如 `POST /api/savePersonalInfo` 等接口。

---

## 5. 数据看板

| 接口路径 | 方法 | 调用位置 | 请求参数 | 响应说明 |
|---------|------|----------|----------|----------|
| `/dataCenter/member` | GET | [pages/dataCenter/index.js](pages/dataCenter/index.js) | 无 | 当前前端取 `res.data.template.succ.data.list`，项为 `{ name, number }`（整体情况统计） |
| `/dataCenter/interaction` | GET | [pages/dataCenter/index.js](pages/dataCenter/index.js) | 无 | `res.data.template.succ.data.list`，项为 `{ name, number }`（互动情况） |
| `/dataCenter/complete-rate` | GET | [pages/dataCenter/index.js](pages/dataCenter/index.js) | 无 | `res.data.template.succ.data.list`，项为 `{ time, percentage }`（完播率） |
| `/dataCenter/area` | GET | [pages/dataCenter/index.js](pages/dataCenter/index.js) | 无 | `res.data.template.succ.data.list`，项为动态 key 的对象（按区域统计，如 标题、全球、华北、华东 等） |

> 说明：数据看板四个接口当前按 mock 的 `template.succ.data` 结构解析，后端可统一为 `data: { list: [...] }` 或与前端约定同一结构，前端再对应修改取值路径。

---

## 6. 消息与聊天（需 WebSocket + HTTP）

消息与聊天当前由 [mock/chat.js](mock/chat.js) 本地模拟，对接后端时需实现以下能力。

### 6.1 HTTP 接口

| 能力 | 建议路径/方式 | 调用位置 | 说明 |
|------|----------------|----------|------|
| 未读消息数 | 如 `GET /message/unreadNum` 或 `GET /chat/unreadCount` | [app.js](app.js) `getUnreadNum()` | 返回 `data`: number，用于 TabBar 红点 |
| 会话列表（含最近消息） | 如 `GET /message/list` 或 `GET /chat/sessions` | [pages/message/index.js](pages/message/index.js) `getMessageList()` | 返回结构需包含：`{ userId, name, avatar, messages }[]`，`messages` 项为 `{ messageId, from, content, time, read }`，`from`: 0 自己 1 对方 |
| 标记某会话已读 | 如 `POST /message/read` 或 `POST /chat/markRead` | [pages/message/index.js](pages/message/index.js) `setMessagesRead(userId)` | 参数至少包含 `userId`（或会话 id） |

### 6.2 WebSocket

| 能力 | 说明 |
|------|------|
| 连接 | [app.js](app.js) 中 `connect()` 使用 `wx.connectSocket`，需后端提供 WebSocket 地址（当前 mock 为假连接） |
| 上行 | 发送文本消息：`JSON.stringify({ type: 'message', data: { userId, content } })` |
| 下行 | 接收消息格式：`{ type: 'message', data: { userId, message } }`，`message` 同 `messages[]` 单项结构；用于实时更新会话列表与未读数 |

---

## 7. 汇总表（按模块）

| 模块 | 路径 | 方法 | 说明 |
|------|------|------|------|
| 登录 | `/login/postPasswordLogin` | POST | 账号密码登录 |
| 登录 | `/login/getSendMessage` | GET | 发送验证码 |
| 登录 | `/login/postCodeVerify` | GET | 验证码校验并返回 token |
| 首页 | `/home/cards` | GET | 首页卡片列表 |
| 首页 | `/home/swipers` | GET | 首页轮播图 |
| 搜索 | `/api/searchHistory` | GET | 搜索历史 |
| 搜索 | `/api/searchPopular` | GET | 热门搜索 |
| 个人 | `/api/genPersonalInfo` | GET | 个人信息（需 token） |
| 个人 | `/api/getServiceList` | GET | 个人页服务列表 |
| 数据看板 | `/dataCenter/member` | GET | 整体情况 |
| 数据看板 | `/dataCenter/interaction` | GET | 互动情况 |
| 数据看板 | `/dataCenter/complete-rate` | GET | 完播率 |
| 数据看板 | `/dataCenter/area` | GET | 按区域统计 |
| 消息 | 未读数量、会话列表、标记已读 | GET/POST | 见上文 6.1 |
| 消息 | WebSocket | - | 见上文 6.2 |

---

## 8. 请求封装说明

- 所有 HTTP 请求经 [api/request.js](api/request.js) 发出，会自动携带 `Authorization: Bearer <access_token>`（若本地有 token）。
- 后端需保证成功时 HTTP 200 且响应体 `code === 200`（或与前端约定一致），业务数据放在 `data` 中，便于与当前 Mock 及 `request.js` 的解析方式兼容。
