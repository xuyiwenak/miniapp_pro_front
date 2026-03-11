import request from '~/api/request';
import { MBTI_QUESTIONS, MBTI_OPTIONS } from './questions';
import { getMbtiStyle } from './mbtiConfig';

function calcMBTIWithDetail(answers) {
  const scores = { EI: 0, NS: 0, TF: 0, JP: 0 };
  answers.forEach(({ questionId, value }) => {
    const q = MBTI_QUESTIONS.find((item) => item.id === questionId);
    if (!q) return;
    scores[q.dimension] += value * q.direction;
  });
  const letters = [
    scores.EI >= 0 ? 'E' : 'I',
    scores.NS >= 0 ? 'N' : 'S',
    scores.TF >= 0 ? 'T' : 'F',
    scores.JP >= 0 ? 'J' : 'P',
  ];
  const type = letters.join('');
  const maxPerDim = 2 * 15; // 每维最大绝对分值
  function dimPercent(dim, positive, negative) {
    const raw = scores[dim];
    const side = raw >= 0 ? positive : negative;
    const ratio = Math.abs(raw) / maxPerDim; // 0 ~ 1
    const main = Math.round(50 + ratio * 50);
    return {
      side,
      main,
      other: 100 - main,
    };
  }
  return {
    type,
    scores,
    detail: {
      EI: dimPercent('EI', 'E', 'I'),
      NS: dimPercent('NS', 'N', 'S'),
      TF: dimPercent('TF', 'T', 'F'),
      JP: dimPercent('JP', 'J', 'P'),
    },
  };
}

Page({
  data: {
    questions: MBTI_QUESTIONS,
    options: MBTI_OPTIONS,
    currentIndex: 0,
    currentQuestion: MBTI_QUESTIONS[0] || {},
    selectedValue: null,
    answers: {}, // { [id]: value }
    // 记录每道题是否已作答，用于一次性提示所有漏答题号
    selectedByIndex: [], // string[]，下标为题目索引
    progressPercent: 0,
    total: MBTI_QUESTIONS.length,
    questionAnim: null,
    finished: false,
    resultType: '',
    resultStyle: '',
    resultDetail: null,
  },

  onLoad() {
    this.updateProgress();
  },

  updateProgress() {
    const { currentIndex, total, questions, answers } = this.data;
    const percent = ((currentIndex + 1) / total) * 100;
    const q = questions[currentIndex] || {};
    this.setData({
      progressPercent: Math.round(percent),
      currentQuestion: q,
      selectedValue: answers[q.id] ?? null,
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onOptionTap(e) {
    const { value } = e.currentTarget.dataset;
    const { questions, currentIndex, answers, selectedByIndex } = this.data;
    const q = questions[currentIndex];
    if (!q) return;
    const newAnswers = { ...answers, [q.id]: value };
    const newSelectedByIndex = [...selectedByIndex];
    newSelectedByIndex[currentIndex] = value;
    this.setData(
      {
        selectedValue: value,
        answers: newAnswers,
        selectedByIndex: newSelectedByIndex,
      },
      () => {
        // 自动轻微延迟跳下一题
        if (currentIndex < this.data.total - 1) {
          setTimeout(() => {
            this.setData({ currentIndex: this.data.currentIndex + 1 }, () => {
              this.updateProgress();
            });
          }, 250);
        }
      },
    );
  },

  onPrev() {
    const { currentIndex } = this.data;
    if (currentIndex === 0) return;
    this.setData({ currentIndex: currentIndex - 1 }, () => {
      this.updateProgress();
    });
  },

  onNext() {
    const { currentIndex, total } = this.data;
    if (currentIndex < total - 1) {
      this.setData({ currentIndex: currentIndex + 1 }, () => {
        this.updateProgress();
      });
      return;
    }
    this.onSubmit();
  },

  async onSubmit() {
    const { answers, questions, selectedByIndex } = this.data;
    // 先检查是否有漏答题目：提示所有未作答的题号
    const missingNumbers = questions
      .map((_, index) => (!selectedByIndex[index] ? index + 1 : null))
      .filter((v) => v != null);

    if (missingNumbers.length > 0) {
      const text =
        missingNumbers.length === 1
          ? `第 ${missingNumbers[0]} 题还没有作答`
          : `还有未作答的题目：第 ${missingNumbers.join('、')} 题`;
      wx.showToast({ title: text, icon: 'none' });
      // 跳回第一道漏答题
      const firstMissingIndex = missingNumbers[0] - 1;
      this.setData({ currentIndex: firstMissingIndex }, () => {
        this.updateProgress();
      });
      return;
    }
    const answerArr = Object.keys(answers).map((id) => ({
      questionId: Number(id),
      value: answers[id],
    }));
    const { type: mbti, detail } = calcMBTIWithDetail(answerArr);
    const { style } = getMbtiStyle(mbti);
    this.setData({
      finished: true,
      resultType: mbti,
      resultStyle: style,
      resultDetail: detail,
    });
  },

  async onConfirmUpdate() {
    const { resultType } = this.data;
    if (!resultType) {
      wx.showToast({ title: '结果异常，请重试', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '更新中...' });
      await request('/api/savePersonalInfo', 'POST', {
        data: {
          mbti: resultType,
        },
      });
      wx.hideLoading();
      wx.showToast({ title: '已更新到我的人格', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 600);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '更新失败，请稍后重试', icon: 'none' });
    }
  },
});

