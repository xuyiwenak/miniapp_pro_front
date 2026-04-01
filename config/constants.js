/**
 * 前端业务常量配置
 *
 * 所有可调节的业务数字统一在此管理，避免魔法值散落各处。
 * 修改后需重新编译小程序才能生效。
 */

// ─────────────────────────────────────────────
// 疗愈分析（AI 解读）
// ─────────────────────────────────────────────

/** 进入作品详情后，自动触发疗愈分析的延迟（毫秒）。
 *  给页面渲染留出时间，避免接口与渲染竞争。 */
export const HEALING_AUTO_TRIGGER_DELAY_MS = 400;

/** 疗愈分析预估完成时长（秒）。用于进度条满跑时间。
 *  Coze 工作流通常需要数分钟，设为 10 分钟留足余量。 */
export const HEALING_ESTIMATED_SECONDS = 600;

/** 进度条最高只推进到此百分比，最后一格留给真实完成事件。 */
export const HEALING_PROGRESS_CAP_PCT = 95;

/** 首次轮询 /healing/status 的等待时间（毫秒）。
 *  适当偏长，避免分析刚提交就立刻打服务端。 */
export const HEALING_POLL_FIRST_MS = 6000;

/** 轮询间隔下限（毫秒）。退避算法不会低于此值。 */
export const HEALING_POLL_MIN_INTERVAL_MS = 12000;

/** 轮询间隔上限（毫秒）。退避算法不会超过此值。 */
export const HEALING_POLL_MAX_INTERVAL_MS = 45000;

/** 每次 pending 状态下轮询间隔的增长系数。
 *  每轮 × 1.35，逐步拉长间隔减轻服务端压力。 */
export const HEALING_POLL_BACKOFF_PENDING = 1.35;

/** 遇到网络/服务器错误时轮询间隔的增长系数（比正常退避更保守）。 */
export const HEALING_POLL_BACKOFF_ERROR = 1.2;

/** 进度条每隔多少毫秒更新一次剩余时间显示。 */
export const HEALING_PROGRESS_TICK_MS = 1000;

// ─────────────────────────────────────────────
// 短信验证码
// ─────────────────────────────────────────────

/** 发送验证码后倒计时秒数，倒计时结束前按钮不可再次点击。 */
export const SMS_COUNTDOWN_SECONDS = 60;

/** 倒计时 tick 间隔（毫秒）。 */
export const SMS_COUNTDOWN_TICK_MS = 1000;

// ─────────────────────────────────────────────
// MBTI 测试
// ─────────────────────────────────────────────

/** 每道题选项点击后，自动跳下一题的延迟（毫秒）。
 *  100~300 ms 让用户能感知到选中动效后再翻页。 */
export const MBTI_QUESTION_ADVANCE_DELAY_MS = 250;

/** 保存结果成功后，延迟多久返回上一页（毫秒）。 */
export const MBTI_SAVE_NAV_BACK_DELAY_MS = 600;

// ─────────────────────────────────────────────
// 作品上传
// ─────────────────────────────────────────────

/** 每位用户每日最多上传作品数。 */
export const UPLOAD_DAILY_LIMIT = 5;

/** 单次上传选图数量上限（目前只允许选 1 张）。 */
export const UPLOAD_IMAGE_COUNT = 1;

/** 发布成功后跳转前的等待时长（毫秒），给 Toast 留出展示时间。 */
export const UPLOAD_PUBLISH_NAV_DELAY_MS = 1500;

/** 每篇作品最多可选的艺术标签数量。 */
export const UPLOAD_MAX_TAGS = 5;

// ─────────────────────────────────────────────
// 反馈 / 建议
// ─────────────────────────────────────────────

/** 反馈标题最大字符数。 */
export const FEEDBACK_TITLE_MAX_LEN = 30;

/** 反馈正文最大字符数。 */
export const FEEDBACK_CONTENT_MAX_LEN = 300;

// ─────────────────────────────────────────────
// 通用 UI 交互
// ─────────────────────────────────────────────

/** 下拉刷新完成后，收起刷新动画的延迟（毫秒）。 */
export const PULL_REFRESH_RESET_DELAY_MS = 600;
