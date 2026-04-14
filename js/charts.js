// charts.js — Chart.js wrappers for nutrition visualization
// 栄養可視化チャートラッパー / 营养可视化图表封装

const Charts = (() => {
  let _macroRingChart = null;
  let _nutritionBarChart = null;
  let _weeklyKcalChart = null;

  // Destroy existing chart before re-creating
  // 再作成前に既存チャートを破棄 / 重新创建前销毁旧图表
  function _destroy(chart) {
    if (chart) { chart.destroy(); }
    return null;
  }

  // ── Macro Ring (dashboard donut) ────────────────────
  // ダッシュボードのドーナツチャート / 仪表板环形图
  function renderMacroRing(totals, target) {
    const canvas = document.getElementById('macroRing');
    if (!canvas) return;

    if (!totals) totals = Tracker.getTotals(new Date().toISOString().slice(0, 10));
    if (!target) target = State.get().settings.targetKcal || 1800;

    const remaining = Math.max(0, target - totals.kcal);

    _macroRingChart = _destroy(_macroRingChart);
    _macroRingChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['蛋白质', '碳水', '脂肪', '剩余'],
        datasets: [{
          data: [
            Math.round(totals.protein * 4),  // protein kcal
            Math.round(totals.carbs * 4),    // carbs kcal
            Math.round(totals.fat * 9),      // fat kcal
            remaining,
          ],
          backgroundColor: ['#3498db', '#f39c12', '#e74c3c', '#ecf0f1'],
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

  return { renderMacroRing, renderNutritionBar, renderWeeklyKcal };
})();
