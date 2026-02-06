/* ============================================
   Management Diagnostic - Quiz Logic & Scoring
   ============================================ */

(function () {
  'use strict';

  // ---- State ----
  let quizData = null;
  let currentQuestionIndex = 0;
  let answers = []; // { categoryId, questionIndex, score }
  let totalQuestions = 0;
  let flatQuestions = []; // [{ categoryId, categoryName, questionIndex, text, options }]
  let teamSize = '';
  let userData = { name: '', email: '', company: '' };

  // ---- DOM refs ----
  const stepIntro = document.getElementById('step-intro');
  const stepQuestions = document.getElementById('step-questions');
  const stepEmail = document.getElementById('step-email');
  const stepResults = document.getElementById('step-results');
  const steps = [stepIntro, stepQuestions, stepEmail, stepResults];

  const btnStart = document.getElementById('btn-start');
  const btnBack = document.getElementById('btn-back');
  const btnRetake = document.getElementById('btn-retake');
  const emailForm = document.getElementById('email-form');
  const teamSizeContainer = document.getElementById('team-size-options');

  const questionCounter = document.getElementById('question-counter');
  const categoryLabel = document.getElementById('category-label');
  const progressFill = document.getElementById('progress-fill');
  const questionText = document.getElementById('question-text');
  const optionsContainer = document.getElementById('options-container');
  const questionArea = document.getElementById('question-area');
  const navProgress = document.getElementById('nav-progress');

  // ---- Init ----
  async function init() {
    try {
      const response = await fetch('data/questions.json');
      quizData = await response.json();
      buildFlatQuestions();
      setupTeamSizeOptions();
      setupEventListeners();
    } catch (err) {
      console.error('Failed to load questions:', err);
      document.body.innerHTML = '<div class="min-h-screen flex items-center justify-center text-red-400 text-lg p-8">Failed to load diagnostic data. Please refresh the page.</div>';
    }
  }

  function buildFlatQuestions() {
    flatQuestions = [];
    quizData.categories.forEach(cat => {
      cat.questions.forEach((q, qi) => {
        flatQuestions.push({
          categoryId: cat.id,
          categoryName: cat.name,
          questionIndex: qi,
          text: q.text,
          options: q.options
        });
      });
    });
    totalQuestions = flatQuestions.length;
    answers = new Array(totalQuestions).fill(null);
  }

  // ---- Team size buttons ----
  function setupTeamSizeOptions() {
    const sizes = quizData.config.teamSizeOptions;
    teamSizeContainer.innerHTML = '';
    sizes.forEach(size => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-card text-center py-3 text-sm font-medium';
      btn.textContent = size;
      btn.addEventListener('click', () => {
        teamSize = size;
        teamSizeContainer.querySelectorAll('.option-card').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        btnStart.disabled = false;
      });
      teamSizeContainer.appendChild(btn);
    });
  }

  // ---- Event listeners ----
  function setupEventListeners() {
    btnStart.addEventListener('click', () => {
      showStep('questions');
      renderQuestion();
    });

    btnBack.addEventListener('click', goBack);

    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      userData.name = document.getElementById('input-name').value.trim();
      userData.email = document.getElementById('input-email').value.trim();
      userData.company = document.getElementById('input-company').value.trim();

      // You could POST to a GHL webhook here:
      // submitToGHL(userData, teamSize, computeScores());

      showStep('results');
      renderResults();
    });

    btnRetake.addEventListener('click', () => {
      currentQuestionIndex = 0;
      answers = new Array(totalQuestions).fill(null);
      teamSize = '';
      userData = { name: '', email: '', company: '' };
      teamSizeContainer.querySelectorAll('.option-card').forEach(b => b.classList.remove('selected'));
      btnStart.disabled = true;
      document.getElementById('input-name').value = '';
      document.getElementById('input-email').value = '';
      document.getElementById('input-company').value = '';
      showStep('intro');
    });
  }

  // ---- Step navigation ----
  function showStep(stepName) {
    const map = { intro: stepIntro, questions: stepQuestions, email: stepEmail, results: stepResults };
    steps.forEach(s => s.classList.remove('active'));
    map[stepName].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update nav progress text
    if (stepName === 'questions') {
      navProgress.textContent = '';
    } else if (stepName === 'email') {
      navProgress.textContent = 'Almost done!';
    } else if (stepName === 'results') {
      navProgress.textContent = 'Your Results';
    } else {
      navProgress.textContent = '';
    }
  }

  // ---- Render question ----
  function renderQuestion() {
    const q = flatQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / totalQuestions) * 100;

    questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
    categoryLabel.textContent = q.categoryName;
    progressFill.style.width = progress + '%';
    questionText.textContent = q.text;

    // Trigger animation
    questionArea.classList.remove('slide-in');
    void questionArea.offsetWidth; // reflow
    questionArea.classList.add('slide-in');

    // Render options
    optionsContainer.innerHTML = '';
    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-card';
      if (answers[currentQuestionIndex] !== null && answers[currentQuestionIndex].score === opt.score) {
        btn.classList.add('selected');
      }

      // Add option letter
      const letterSpan = document.createElement('span');
      letterSpan.className = 'inline-block w-7 h-7 rounded-full bg-slate-700 text-slate-300 text-sm font-semibold text-center leading-7 mr-3 flex-shrink-0';
      letterSpan.textContent = String.fromCharCode(65 + i);

      const textSpan = document.createElement('span');
      textSpan.textContent = opt.text;

      btn.appendChild(letterSpan);
      btn.appendChild(textSpan);
      btn.style.display = 'flex';
      btn.style.alignItems = 'flex-start';

      btn.addEventListener('click', () => selectOption(opt, i));
      optionsContainer.appendChild(btn);
    });

    // Show/hide back button
    btnBack.classList.toggle('hidden', currentQuestionIndex === 0);

    // Update nav
    navProgress.textContent = `${currentQuestionIndex + 1} / ${totalQuestions}`;
  }

  // ---- Select option ----
  function selectOption(option, optionIndex) {
    const q = flatQuestions[currentQuestionIndex];

    answers[currentQuestionIndex] = {
      categoryId: q.categoryId,
      questionIndex: q.questionIndex,
      score: option.score
    };

    // Visual feedback
    optionsContainer.querySelectorAll('.option-card').forEach(b => b.classList.remove('selected'));
    optionsContainer.children[optionIndex].classList.add('selected');

    // Auto-advance after short delay
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        currentQuestionIndex++;
        renderQuestion();
      } else {
        // All questions answered
        progressFill.style.width = '100%';
        showStep('email');
      }
    }, 350);
  }

  // ---- Go back ----
  function goBack() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderQuestion();
    }
  }

  // ---- Compute scores ----
  function computeScores() {
    const scores = {};
    quizData.categories.forEach(cat => {
      scores[cat.id] = { total: 0, count: 0 };
    });

    answers.forEach(a => {
      if (a) {
        scores[a.categoryId].total += a.score;
        scores[a.categoryId].count++;
      }
    });

    const result = {};
    quizData.categories.forEach(cat => {
      const s = scores[cat.id];
      result[cat.id] = s.count > 0 ? s.total / s.count : 0;
    });

    return result;
  }

  // ---- Get result level ----
  function getResultLevel(category, score) {
    if (score <= category.results.low.range[1]) return 'low';
    if (score <= category.results.mid.range[1]) return 'mid';
    return 'high';
  }

  // ---- Render results ----
  function renderResults() {
    const scores = computeScores();

    // User name
    const resultsName = document.getElementById('results-name');
    if (userData.name) {
      resultsName.textContent = `${userData.name}, here are your results`;
    }

    // Overall score
    const allScores = Object.values(scores);
    const overall = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    document.getElementById('overall-score').textContent = overall.toFixed(1);

    // CTA
    document.getElementById('cta-link').href = quizData.config.ctaUrl;

    // Radar chart
    renderRadarChart(scores);

    // Sort categories by score for weakness identification
    const sortedCategories = quizData.categories
      .map(cat => ({ ...cat, score: scores[cat.id] }))
      .sort((a, b) => a.score - b.score);

    // Top weaknesses (lowest 2)
    renderWeaknesses(sortedCategories);

    // Category cards
    renderCategoryCards(sortedCategories, scores);
  }

  // ---- Radar chart ----
  function renderRadarChart(scores) {
    const ctx = document.getElementById('radar-chart').getContext('2d');
    const labels = quizData.categories.map(c => c.name);
    const data = quizData.categories.map(c => scores[c.id]);

    // Destroy existing chart if retaking
    if (window._diagnosticChart) {
      window._diagnosticChart.destroy();
    }

    window._diagnosticChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Your Score',
          data: data,
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          borderColor: '#06b6d4',
          borderWidth: 2,
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: '#06b6d4',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 4,
            ticks: {
              stepSize: 1,
              color: '#64748b',
              backdropColor: 'transparent',
              font: { size: 11 }
            },
            grid: {
              color: 'rgba(51, 65, 85, 0.5)'
            },
            angleLines: {
              color: 'rgba(51, 65, 85, 0.5)'
            },
            pointLabels: {
              color: '#e2e8f0',
              font: { size: 13, weight: '600' }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function (context) {
                return `Score: ${context.parsed.r.toFixed(1)} / 4.0`;
              }
            }
          }
        }
      }
    });
  }

  // ---- Render weaknesses ----
  function renderWeaknesses(sorted) {
    const list = document.getElementById('weaknesses-list');
    list.innerHTML = '';

    const weaknesses = sorted.filter(c => c.score < 3).slice(0, 2);

    if (weaknesses.length === 0) {
      document.getElementById('weaknesses-section').style.display = 'none';
      return;
    }

    document.getElementById('weaknesses-section').style.display = 'block';

    weaknesses.forEach(cat => {
      const level = getResultLevel(cat, cat.score);
      const result = cat.results[level];

      const div = document.createElement('div');
      div.className = 'card p-4 border-amber-500/30';
      div.innerHTML = `
        <div class="flex items-start gap-3">
          <span class="text-2xl">${cat.icon}</span>
          <div>
            <h4 class="font-bold text-amber-400">${cat.name}: ${result.title}</h4>
            <p class="text-sm text-slate-300 mt-1">${result.description}</p>
          </div>
        </div>
      `;
      list.appendChild(div);
    });
  }

  // ---- Render category cards ----
  function renderCategoryCards(sortedCategories, scores) {
    const container = document.getElementById('results-cards');
    container.innerHTML = '';

    // Re-sort by original order for display
    const orderedCategories = quizData.categories.map(cat => ({
      ...cat,
      score: scores[cat.id]
    }));

    orderedCategories.forEach(cat => {
      const score = cat.score;
      const level = getResultLevel(cat, score);
      const result = cat.results[level];

      let colorClass, badgeClass;
      if (score < 2) {
        colorClass = 'result-red';
        badgeClass = 'badge-red';
      } else if (score < 3) {
        colorClass = 'result-amber';
        badgeClass = 'badge-amber';
      } else {
        colorClass = 'result-green';
        badgeClass = 'badge-green';
      }

      const card = document.createElement('div');
      card.className = `result-card ${colorClass}`;
      card.innerHTML = `
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${cat.icon}</span>
            <div>
              <h3 class="font-bold text-lg">${cat.name}</h3>
              <span class="text-sm text-slate-400">${result.title}</span>
            </div>
          </div>
          <div class="score-badge ${badgeClass}">${score.toFixed(1)}</div>
        </div>
        <p class="text-slate-300 text-sm mb-4">${result.description}</p>
        <div class="space-y-2">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actionable Tips</p>
          ${result.tips.map(tip => `
            <div class="tip-item">
              <span class="text-sm text-slate-300">${tip}</span>
            </div>
          `).join('')}
        </div>
      `;
      container.appendChild(card);
    });
  }

  // ---- GHL webhook placeholder ----
  // Uncomment and configure to send data to Go High Level
  /*
  function submitToGHL(user, teamSize, scores) {
    const payload = {
      name: user.name,
      email: user.email,
      company: user.company,
      teamSize: teamSize,
      scores: scores,
      overallScore: Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length,
      completedAt: new Date().toISOString()
    };

    fetch('YOUR_GHL_WEBHOOK_URL', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('GHL submission failed:', err));
  }
  */

  // ---- Launch ----
  document.addEventListener('DOMContentLoaded', init);
})();
