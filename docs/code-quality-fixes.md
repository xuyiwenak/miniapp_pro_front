# 代码质量修复说明

## 已完成的修改

### 1. 组件按需注入 ✅
在 `app.json` 中已添加：
```json
"lazyCodeLoading": "requiredComponents"
```
- 仅注入当前页面需要的组件和代码，减少启动耗时和内存占用。
- 需基础库 2.11.1+，请确保 `project.config.json` 中 `libVersion` 满足要求。

### 2. 主包瘦身 ✅
- 主包只保留 TabBar 页面：`pages/home/index`、`pages/my/index`。
- 以下页面已移至分包：
  - `pages/workDetail`（作品详情）
  - `pages/feedback`（反馈）
  - `pages/mbti`（MBTI 测试）
- MBTI 配置已抽到主包 `utils/mbtiConfig.js`，供「我的」页与 MBTI 分包共用。
- 跳转路径未改，仍使用 `/pages/workDetail/index`、`/pages/feedback/index`、`/pages/mbti/index`，无需改业务代码。

---

## 图片和音频资源超过 200K 的解决方案

当前 `static/` 目录约 **668KB**，超过「图片和音频资源不超过 200K」的建议。可任选或组合以下方式：

### 方案 A：压缩现有图片（推荐）
1. **TinyPNG**：https://tinypng.com/  
   - 上传 `static/` 下 png/jpg，下载压缩后替换原文件。
2. **命令行工具**（若已安装 Node）：
   ```bash
   npx sharp-cli --input "static/**/*.png" --output "static/" --quality 80
   ```
3. **优先压缩大文件**（当前体积较大）：
   - `static/img_td.png`（约 124KB，兼作占位图与个人主页背景墙默认图）

### 方案 B：图片放云端
- 将大图上传至 CDN 或云存储，页面内用 `https://` 链接代替本地路径。
- 可保留小图标、占位图在包内，大图一律用网络图片，主包体积可显著下降。

### 方案 C：分包内放资源
- 若某页独享大图，可将该页与图片一起放到同一分包，避免占主包体积。
- 主包尽量只保留首屏必需的小图（如 tabBar 图标、占位图）。

---

## 验证方式

1. 微信开发者工具：**详情 → 本地设置** 勾选「将 JS 编译成 ES5」等后，重新编译。
2. 点击 **代码质量** 或 **代码依赖分析**，确认：
   - 主包体积 &lt; 1.5M
   - 已启用组件按需注入
   - 图片/音频资源 &lt; 200K（需完成上述图片优化后再验）
