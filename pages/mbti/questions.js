// MBTI 问卷题目静态配置
// 结构：id, text, dimension (EI/NS/TF/JP), direction (1 正向, -1 反向)

export const MBTI_QUESTIONS = [
  // EI 维度
  { id: 1, text: '在聚会中，你更容易主动和陌生人搭话', dimension: 'EI', direction: 1 },
  { id: 2, text: '长时间待在人群中会让你感觉被“充电”而不是被耗尽', dimension: 'EI', direction: 1 },
  { id: 3, text: '你更愿意把周末时间花在社交活动上，而不是一个人待着', dimension: 'EI', direction: 1 },
  { id: 4, text: '遇到新环境时，你会很快主动融入其中', dimension: 'EI', direction: 1 },
  { id: 5, text: '你经常在聊天中抢先开口，而不是等待别人发问', dimension: 'EI', direction: 1 },
  { id: 6, text: '独处一天比社交一天更让你放松', dimension: 'EI', direction: -1 },
  { id: 7, text: '与人长时间面对面交流后，你通常需要一个人安静恢复', dimension: 'EI', direction: -1 },
  { id: 8, text: '在做决定前，你更喜欢先在心里默默想清楚再说出来', dimension: 'EI', direction: -1 },
  { id: 9, text: '与其参加多人聚会，你更偏爱一对一或小范围的交流', dimension: 'EI', direction: -1 },
  { id: 10, text: '别人会形容你“安静”“慢热”多于“外向”“活跃”', dimension: 'EI', direction: -1 },
  { id: 11, text: '你很少在公共场合主动成为注意力中心', dimension: 'EI', direction: -1 },
  { id: 12, text: '临时的社交邀约对你来说往往显得有点累', dimension: 'EI', direction: -1 },
  { id: 13, text: '你更愿意通过文字而不是电话来和别人沟通', dimension: 'EI', direction: -1 },
  { id: 14, text: '不认识的人太多的场合会让你有些紧张', dimension: 'EI', direction: -1 },
  { id: 15, text: '你更常在心里给出“完美回答”，而不是当场脱口而出', dimension: 'EI', direction: -1 },

  // NS 维度
  { id: 16, text: '你更关注事物未来的可能性，而不是仅仅现在的状态', dimension: 'NS', direction: 1 },
  { id: 17, text: '你喜欢思考抽象的概念，比如“人生意义”“理想世界”等', dimension: 'NS', direction: 1 },
  { id: 18, text: '想到一个点子时，你会一下子联想到很多延伸可能', dimension: 'NS', direction: 1 },
  { id: 19, text: '你做事情常常依赖直觉，而不是严格按照经验', dimension: 'NS', direction: 1 },
  { id: 20, text: '面对信息时，你更在意“隐含的模式”而非表面的细节', dimension: 'NS', direction: 1 },
  { id: 21, text: '你更相信亲身经历而不是他人的推理结论', dimension: 'NS', direction: -1 },
  { id: 22, text: '你在做事时会非常留意细节是否正确', dimension: 'NS', direction: -1 },
  { id: 23, text: '你更愿意一步步踏实推进，而不是跳跃式地构想未来', dimension: 'NS', direction: -1 },
  { id: 24, text: '你更偏好已经验证过的方法，而不是全新但不确定的方案', dimension: 'NS', direction: -1 },
  { id: 25, text: '你倾向于先弄清事实，再去谈“意义”和“解读”', dimension: 'NS', direction: -1 },
  { id: 26, text: '你经常被他人认为“很接地气”“务实”', dimension: 'NS', direction: -1 },
  { id: 27, text: '你更喜欢能看得见摸得着的成果，而不是抽象的理论', dimension: 'NS', direction: -1 },
  { id: 28, text: '你做决定时会反复确认信息来源是否可靠', dimension: 'NS', direction: -1 },
  { id: 29, text: '你对“流程标准”“操作规范”有一定的安全感', dimension: 'NS', direction: -1 },
  { id: 30, text: '你更习惯按照经验来判断该怎么做', dimension: 'NS', direction: -1 },

  // TF 维度
  { id: 31, text: '做决策时，你首先考虑的是逻辑是否合理，而不是谁会不会难过', dimension: 'TF', direction: 1 },
  { id: 32, text: '你更容易指出问题本身，而不是先照顾对方情绪', dimension: 'TF', direction: 1 },
  { id: 33, text: '你认为“对事不对人”比“避免冲突”更重要', dimension: 'TF', direction: 1 },
  { id: 34, text: '你常常从效率、成本、结果的角度来评估一件事', dimension: 'TF', direction: 1 },
  { id: 35, text: '在讨论时，你更在乎观点是否自洽，而不是对方是不是被认可', dimension: 'TF', direction: 1 },
  { id: 36, text: '你容易受到他人情绪的影响', dimension: 'TF', direction: -1 },
  { id: 37, text: '即便自己有不同意见，你也会为了不伤害对方而委婉表达', dimension: 'TF', direction: -1 },
  { id: 38, text: '你做决定时常常会先想“这样会不会让谁难过”', dimension: 'TF', direction: -1 },
  { id: 39, text: '当朋友遇到难题时，你更倾向于先安慰而不是立刻给出建议', dimension: 'TF', direction: -1 },
  { id: 40, text: '维持关系的和谐对你来说非常重要', dimension: 'TF', direction: -1 },
  { id: 41, text: '你经常不忍心说出过于直接的真话', dimension: 'TF', direction: -1 },
  { id: 42, text: '在团队中，你更关心大家的氛围是否轻松', dimension: 'TF', direction: -1 },
  { id: 43, text: '别人会形容你“善解人意”多于“很理性”', dimension: 'TF', direction: -1 },
  { id: 44, text: '你会为了照顾别人情绪而主动做一些额外的事', dimension: 'TF', direction: -1 },
  { id: 45, text: '你经常在意别人对你是否满意', dimension: 'TF', direction: -1 },

  // JP 维度
  { id: 46, text: '出行前你喜欢提前计划好每一个环节', dimension: 'JP', direction: 1 },
  { id: 47, text: '未完成的任务会让你一直挂心，直到处理完才安心', dimension: 'JP', direction: 1 },
  { id: 48, text: '你偏好有清晰时间表和待办清单的生活', dimension: 'JP', direction: 1 },
  { id: 49, text: '你不太喜欢计划被临时更改或打乱', dimension: 'JP', direction: 1 },
  { id: 50, text: '对你来说，“按时完成”本身就是一种重要的价值', dimension: 'JP', direction: 1 },
  { id: 51, text: '你更喜欢保持选择空间，而不是一开始就把一切定死', dimension: 'JP', direction: -1 },
  { id: 52, text: '你常常会把决定拖到最后一刻，以便观察更多变化', dimension: 'JP', direction: -1 },
  { id: 53, text: '面对计划，你更倾向于“先开始再说，再边走边调”', dimension: 'JP', direction: -1 },
  { id: 54, text: '你更享受过程中的即兴发挥，而不是严格按计划执行', dimension: 'JP', direction: -1 },
  { id: 55, text: '临时出现更好玩的安排时，你很乐意改变原先计划', dimension: 'JP', direction: -1 },
  { id: 56, text: '你更认同“船到桥头自然直”这类说法', dimension: 'JP', direction: -1 },
  { id: 57, text: '你很难长期坚持使用详细的日程表或任务管理工具', dimension: 'JP', direction: -1 },
  { id: 58, text: '你更习惯先探索各种可能，再慢慢收束选择', dimension: 'JP', direction: -1 },
  { id: 59, text: '突发的灵感和机会让你感到兴奋，而不是焦虑', dimension: 'JP', direction: -1 },
  { id: 60, text: '你更在意“此刻真实的感觉”，而不是长期规划', dimension: 'JP', direction: -1 },
];

export const MBTI_OPTIONS = [
  { value: 2, label: '非常符合' },
  { value: 1, label: '比较符合' },
  { value: 0, label: '不确定' },
  { value: -1, label: '比较不符合' },
  { value: -2, label: '完全不符合' },
];

