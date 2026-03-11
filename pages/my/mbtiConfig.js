// 16 型 MBTI 配色与图标配置（主包复用）

export const MBTI_META = {
  INTJ: { name: '建筑师', emoji: '🏛', c1: '#2d1b69', c2: '#6c3fc5', glow: 'rgba(108, 63, 197, 0.55)' },
  INTP: { name: '逻辑学家', emoji: '🔭', c1: '#1a2a6c', c2: '#7b4fc9', glow: 'rgba(123, 79, 201, 0.55)' },
  ENTJ: { name: '指挥官', emoji: '⚡', c1: '#4a1080', c2: '#c850c0', glow: 'rgba(200, 80, 192, 0.55)' },
  ENTP: { name: '辩论家', emoji: '💡', c1: '#6a3093', c2: '#a044ff', glow: 'rgba(160, 68, 255, 0.55)' },

  INFJ: { name: '提倡者', emoji: '🌿', c1: '#134e5e', c2: '#71b280', glow: 'rgba(113, 178, 128, 0.55)' },
  INFP: { name: '调停者', emoji: '🌸', c1: '#b06ab3', c2: '#4568dc', glow: 'rgba(176, 106, 179, 0.55)' },
  ENFJ: { name: '主人公', emoji: '🌟', c1: '#11998e', c2: '#38ef7d', glow: 'rgba(56, 239, 125, 0.55)' },
  ENFP: { name: '竞选者', emoji: '🦋', c1: '#f7971e', c2: '#38ef7d', glow: 'rgba(247, 151, 30, 0.55)' },

  ISTJ: { name: '物流师', emoji: '🗂', c1: '#1c3d5a', c2: '#3a7bd5', glow: 'rgba(58, 123, 213, 0.55)' },
  ISFJ: { name: '守卫者', emoji: '🛡', c1: '#2c3e7a', c2: '#6dd5fa', glow: 'rgba(109, 213, 250, 0.55)' },
  ESTJ: { name: '总经理', emoji: '📊', c1: '#003973', c2: '#e5e5be', glow: 'rgba(0, 57, 115, 0.55)' },
  ESFJ: { name: '执政官', emoji: '🤝', c1: '#2980b9', c2: '#6dd5fa', glow: 'rgba(41, 128, 185, 0.55)' },

  ISTP: { name: '鉴赏家', emoji: '🔧', c1: '#485563', c2: '#29323c', glow: 'rgba(72, 85, 99, 0.55)' },
  ISFP: { name: '艺术家', emoji: '🎨', c1: '#da4453', c2: '#89216b', glow: 'rgba(218, 68, 83, 0.55)' },
  ESTP: { name: '企业家', emoji: '🚀', c1: '#f7971e', c2: '#ffd200', glow: 'rgba(247, 151, 30, 0.55)' },
  ESFP: { name: '表演者', emoji: '🎭', c1: '#f953c6', c2: '#b91d73', glow: 'rgba(249, 83, 198, 0.55)' },
};

export function getMbtiStyle(type) {
  const meta = MBTI_META[type];
  if (!meta) {
    return { style: '', emoji: '', name: '' };
  }
  const style = `--mbti-c1:${meta.c1};--mbti-c2:${meta.c2};--mbti-glow:${meta.glow};`;
  return { style, emoji: meta.emoji, name: meta.name };
}

