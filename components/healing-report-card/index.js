Component({
  properties: {
    visible: {
      type: Boolean,
      value: true,
    },
    scores: {
      type: Object,
      value: null,
      observer(newVal) {
        if (newVal) {
          this.drawRadar(newVal);
        }
      },
    },
    scoreDimensions: {
      type: Array,
      value: [],
      observer(newVal) {
        if (newVal && newVal.length && this.properties.scores) {
          this.drawRadar(this.properties.scores);
        }
      },
    },
    summary: {
      type: String,
      value: '',
    },
    colorAnalysis: {
      type: String,
      value: '',
    },
    isPublic: {
      type: Boolean,
      value: true,
    },
    canTogglePrivacy: {
      type: Boolean,
      value: false,
    },
    dominantEmotion: {
      type: String,
      value: 'calm',
      observer(newVal) {
        this.updateDominantEmoji(newVal);
      },
    },
    dominantEmotionLabel: {
      type: String,
      value: '',
    },
    dominantEmotionScore: {
      type: Number,
      value: 0,
    },
    compositionReport: {
      type: String,
      value: '',
    },
    lineAnalysis: {
      type: Object,
      value: null,
    },
    suggestion: {
      type: String,
      value: '',
    },
    keyColors: {
      type: Array,
      value: [],
    },
  },

  data: {
    dominantEmoji: '🌿',
    canvasSize: 260,
  },

  lifetimes: {
    attached() {
      const info = wx.getSystemInfoSync();
      // 画布宽度按屏幕宽度适配，左右各留一点内边距
      const size = Math.min(info.windowWidth - 80, 360);
      this.setData(
        {
          canvasSize: size,
        },
        () => {
          if (this.properties.scores) {
            this.drawRadar(this.properties.scores);
          }
        },
      );
      this.updateDominantEmoji(this.properties.dominantEmotion);
    },
  },

  methods: {
    updateDominantEmoji(emotion) {
      const dims = this.properties.scoreDimensions || [];
      const found = dims.find((d) => d.key === emotion);
      this.setData({ dominantEmoji: found ? found.emoji : '🌿' });
    },

    onPrivacyChange(e) {
      const value = e?.detail?.value;
      this.triggerEvent('toggleprivacy', { value });
    },

    drawRadar(scores) {
      const dims = this.properties.scoreDimensions;
      if (!dims || dims.length < 3) return; // 维度不足无法画雷达图

      const size = this.data.canvasSize || 260;
      const ctx = wx.createCanvasContext('radarCanvas', this);
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size * 0.35;
      const levels = 4;
      const n = dims.length;
      const angleOf = (i) => (Math.PI / 2) + (i * (2 * Math.PI / n));

      ctx.clearRect(0, 0, size, size);

      // 参考网格
      ctx.setStrokeStyle('rgba(143, 169, 177, 0.35)');
      ctx.setLineWidth(1);
      for (let level = 1; level <= levels; level += 1) {
        const r = (radius * level) / levels;
        ctx.beginPath();
        dims.forEach((_, i) => {
          const a = angleOf(i);
          const x = centerX + r * Math.cos(a);
          const y = centerY - r * Math.sin(a);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
      }

      // 辐射轴
      dims.forEach((_, i) => {
        const a = angleOf(i);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(a), centerY - radius * Math.sin(a));
        ctx.stroke();
      });

      // 数据多边形
      const points = dims.map(({ key }, i) => {
        const raw = scores && typeof scores[key] === 'number' ? scores[key] : 0;
        const ratio = Math.max(0.05, Math.min(1, raw / 100));
        const a = angleOf(i);
        return {
          x: centerX + radius * ratio * Math.cos(a),
          y: centerY - radius * ratio * Math.sin(a),
        };
      });

      ctx.beginPath();
      points.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      const gradient = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
      gradient.addColorStop(0, 'rgba(138, 184, 164, 0.55)');
      gradient.addColorStop(1, 'rgba(120, 152, 190, 0.35)');
      ctx.setFillStyle(gradient);
      ctx.fill();
      ctx.setStrokeStyle('rgba(104, 139, 150, 0.9)');
      ctx.setLineWidth(2);
      ctx.stroke();

      // 顶点圆点
      ctx.setFillStyle('rgba(104, 139, 150, 0.95)');
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      // 维度标签和得分
      ctx.setFillStyle('rgba(0, 0, 0, 0.55)');
      ctx.setFontSize(20);
      dims.forEach(({ key, label }, i) => {
        const a = angleOf(i);
        const labelR = radius + 24;
        const x = centerX + labelR * Math.cos(a);
        const y = centerY - labelR * Math.sin(a);
        const value = scores && typeof scores[key] === 'number' ? `${scores[key]}%` : '';
        ctx.setTextAlign('center');
        ctx.fillText(label, x, y - 4);
        if (value) {
          ctx.setFontSize(18);
          ctx.fillText(value, x, y + 20);
          ctx.setFontSize(20);
        }
      });

      ctx.draw();
    },
  },
});

