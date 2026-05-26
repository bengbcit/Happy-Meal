// charts.js — Chart.js wrappers for nutrition visualization
// 栄養可視化チャートラッパー / 营养可视化图表封装

const Charts = (() => {
  let _macroRingChart = null;
  let _nutritionBarChart = null;
  let _weeklyKcalChart = null;
  let _weightChart = null;

  // Destroy existing chart before re-creating
  // 再作成前に既存チャートを破棄 / 重新创建前销毁旧图表
  function _destroy(chart) {
    if (chart) { chart.destroy(); }
    return null;
  }

  // ── Macro Ring (dashboard donut) ────────────────────
  // burned = today's exercise kcal (shown as orange segment expanding the budget)
  // ダッシュボードのドーナツチャート / 仪表板环形图
  function renderMacroRing(totals, target, burned) {
    const canvas = document.getElementById('macroRing');
    if (!canvas) return;

    if (!totals) totals = Tracker.getTotals(new Date().toISOString().slice(0, 10));
    const baseTarget = State.get().settings.targetKcal || 1800;
    if (!target) target = baseTarget;
    // Auto-fetch burned from Exercise if not passed — ensures any caller gets up-to-date ring
    if (burned === undefined || burned === null) {
      burned = (typeof Exercise !== 'undefined') ? Exercise.getTodayBurned() : 0;
    }

    const proteinKcal = Math.round(totals.protein * 4);
    const carbsKcal   = Math.round(totals.carbs   * 4);
    const fatKcal     = Math.round(totals.fat     * 9);
    const eaten       = proteinKcal + carbsKcal + fatKcal;
    const remaining   = Math.max(0, target - eaten);

    const lang = (typeof I18n !== 'undefined') ? I18n.current() : 'zh';
    const labels = {
      protein:   lang==='en' ? 'Protein'   : lang==='ja' ? 'タンパク質' : '蛋白质',
      carbs:     lang==='en' ? 'Carbs'     : lang==='ja' ? '炭水化物'   : '碳水',
      fat:       lang==='en' ? 'Fat'       : lang==='ja' ? '脂質'       : '脂肪',
      exercise:  lang==='en' ? 'Exercise+' : lang==='ja' ? '運動+'      : '运动+',
      remaining: lang==='en' ? 'Remaining' : lang==='ja' ? '残り'       : '剩余',
    };

    const dataValues = [proteinKcal, carbsKcal, fatKcal];
    const dataLabels = [labels.protein, labels.carbs, labels.fat];
    const dataColors = ['#3498db', '#f39c12', '#e74c3c'];

    // Add exercise segment (orange) when burned > 0
    if (burned > 0) {
      dataValues.push(burned);
      dataLabels.push(labels.exercise);
      dataColors.push('#FF7A45');
    }

    // Remaining (grey)
    dataValues.push(remaining);
    dataLabels.push(labels.remaining);
    dataColors.push('#ecf0f1');

    _macroRingChart = _destroy(_macroRingChart);
    _macroRingChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: dataLabels,
        datasets: [{
          data: dataValues,
          backgroundColor: dataColors,
          borderWidth: 0,
          hoverOffset: 4,
        }]
      },
      options: {
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed} kcal`
            }
          }
        }
      }
    });
  }

  // ── Nutrition Bar (tracker tab horizontal bars) ──────
  // トラッカータブの横棒グラフ / 追踪页横向条形图
  function renderNutritionBar(totals) {
    const canvas = document.getElementById('nutritionBar');
    if (!canvas) return;

    _nutritionBarChart = _destroy(_nutritionBarChart);
    _nutritionBarChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['蛋白质(g)', '碳水(g)', '脂肪(g)'],
        datasets: [{
          label: '今日摄入',
          data: [
            Math.round(totals.protein || 0),
            Math.round(totals.carbs   || 0),
            Math.round(totals.fat     || 0),
          ],
          backgroundColor: ['#3498db', '#f39c12', '#e74c3c'],
          borderRadius: 6,
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, grid: { display: false } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  // ── Weekly Kcal Chart (7-day line) ───────────────────
  // 7日間カロリー折れ線グラフ / 近7日热量折线图
  function renderWeeklyKcal() {
    const canvas = document.getElementById('weeklyKcalChart');
    if (!canvas) return;

    const labels = [];
    const data = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const totals = Tracker.getTotals(dateStr);
      const mm = d.getMonth() + 1;
      const dd = d.getDate();
      labels.push(`${mm}/${dd}`);
      data.push(Math.round(totals.kcal));
    }

    const target = State.get().settings.targetKcal || 1800;

    _weeklyKcalChart = _destroy(_weeklyKcalChart);
    _weeklyKcalChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '实际摄入',
            data,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46,204,113,0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          },
          {
            label: '目标热量',
            data: Array(7).fill(target),
            borderColor: '#e74c3c',
            borderDash: [6, 3],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
          }
        ]
      },
      options: {
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#f0f0f0' } }
        }
      }
    });
  }

  // ── Weight History Chart (line, last 30 entries) ─────
  // 体重履歴折れ線グラフ / 近30条体重历史折线图
  function renderWeightChart() {
    const canvas = document.getElementById('weightHistoryChart');
    if (!canvas) return;

    const log = State.getWeightLog();
    if (log.length === 0) {
      _weightChart = _destroy(_weightChart);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const entries = log.slice(-30);
    const labels  = entries.map(e => e.date.slice(5)); // MM-DD
    const data    = entries.map(e => e.weight);

    // Compute BMI for each entry
    const u = State.get().user;
    const hm = (u.height / 100) ** 2;
    const bmiData = entries.map(e => +(e.weight / hm).toFixed(1));

    _weightChart = _destroy(_weightChart);
    _weightChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: '体重 (kg)',
            data,
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46,204,113,0.12)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            yAxisID: 'yWeight',
          },
          {
            label: 'BMI',
            data: bmiData,
            borderColor: '#3498db',
            borderDash: [5, 3],
            borderWidth: 1.5,
            pointRadius: 3,
            fill: false,
            tension: 0.4,
            yAxisID: 'yBmi',
          }
        ]
      },
      options: {
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        },
        scales: {
          yWeight: {
            type: 'linear', position: 'left',
            beginAtZero: false,
            grid: { color: 'rgba(0,0,0,.05)' },
            ticks: { font: { size: 11 } }
          },
          yBmi: {
            type: 'linear', position: 'right',
            beginAtZero: false,
            grid: { drawOnChartArea: false },
            ticks: { font: { size: 11 } }
          },
          x: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  return { renderMacroRing, renderNutritionBar, renderWeeklyKcal, renderWeightChart };
})();
