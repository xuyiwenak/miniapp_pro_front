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
      const map = {
        calm: '🌿',
        stress: '🌪️',
        joy: '✨',
        sadness: '🌧️',
      };
      this.setData({
        dominantEmoji: map[emotion] || '🌿',
      });
    },

    onPrivacyChange(e) {
      const value = e?.detail?.value;
      this.triggerEvent('toggleprivacy', { value });
    },

    drawRadar(scores) {
      const size = this.data.canvasSize || 260;
      const ctx = wx.createCanvasContext('radarCanvas', this);
      const width = size;
      const height = size;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = (size * 0.35);
      const levels = 4;
      const emotions = ['calm', 'joy', 'stress', 'sadness'];

      ctx.clearRect(0, 0, width, height);

      ctx.setStrokeStyle('rgba(143, 169, 177, 0.35)');
      ctx.setLineWidth(1);

      for (let level = 1; level <= levels; level += 1) {
        const r = (radius * level) / levels;
        ctx.beginPath();
        emotions.forEach((_, index) => {
          const angle = (Math.PI / 2) + (index * (2 * Math.PI / emotions.length));
          const x = centerX + r * Math.cos(angle);
          const y = centerY - r * Math.sin(angle);
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.closePath();
        ctx.stroke();
      }

      ctx.setStrokeStyle('rgba(143, 169, 177, 0.35)');
      emotions.forEach((_, index) => {
        const angle = (Math.PI / 2) + (index * (2 * Math.PI / emotions.length));
        const x = centerX + radius * Math.cos(angle);
        const y = centerY - radius * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      });

      const points = emotions.map((key, index) => {
        const raw = scores && typeof scores[key] === 'number' ? scores[key] : 0;
        const ratio = Math.max(0.05, Math.min(1, raw / 100));
        const r = radius * ratio;
        const angle = (Math.PI / 2) + (index * (2 * Math.PI / emotions.length));
        return {
          x: centerX + r * Math.cos(angle),
          y: centerY - r * Math.sin(angle),
        };
      });

      ctx.beginPath();
      points.forEach((p, index) => {
        if (index === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      });
      ctx.closePath();
      const gradient = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
      gradient.addColorStop(0, 'rgba(138, 184, 164, 0.55)');
      gradient.addColorStop(1, 'rgba(120, 152, 190, 0.35)');
      ctx.setFillStyle(gradient);
      ctx.fill();

      ctx.setStrokeStyle('rgba(104, 139, 150, 0.9)');
      ctx.setLineWidth(2);
      ctx.stroke();

      ctx.setFillStyle('rgba(104, 139, 150, 0.95)');
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });

      ctx.setFillStyle('rgba(0, 0, 0, 0.55)');
      ctx.setFontSize(20);
      emotions.forEach((key, index) => {
        const angle = (Math.PI / 2) + (index * (2 * Math.PI / emotions.length));
        const labelR = radius + 24;
        const x = centerX + labelR * Math.cos(angle);
        const y = centerY - labelR * Math.sin(angle);
        let label = '';
        if (key === 'calm') label = '平静';
        if (key === 'joy') label = '快乐';
        if (key === 'stress') label = '压力';
        if (key === 'sadness') label = '忧郁';
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

