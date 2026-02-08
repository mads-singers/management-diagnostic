/* ============================================
   Management Diagnostic - Quiz Logic & Scoring
   Yes/No format, 4 categories, 5 questions each
   ============================================ */

(function () {
  'use strict';

  // ---- State ----
  let quizData = null;
  let currentQuestionIndex = 0;
  let answers = []; // score per question (10 or 0)
  let totalQuestions = 0;
  let flatQuestions = []; // [{ categoryId, categoryName, questionIndex, text }]
  let businessInfoAnswers = {}; // { 'team-size': '6-15', 'revenue': { text, score }, ... }
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
  const businessInfoContainer = document.getElementById('business-info-container');

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
      setupBusinessInfo();
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
          text: q.text
        });
      });
    });
    totalQuestions = flatQuestions.length;
    answers = new Array(totalQuestions).fill(null);
  }

  // ---- Business Info (intro step) ----
  function setupBusinessInfo() {
    businessInfoContainer.innerHTML = '';

    quizData.businessInfo.forEach(info => {
      const group = document.createElement('div');
      group.className = 'mb-2';

      const label = document.createElement('label');
      label.className = 'block text-sm font-medium text-slate-300 mb-3';
      label.textContent = info.text;
      group.appendChild(label);

      // Determine options array
      const opts = info.options.map(o => typeof o === 'string' ? o : o.text);
      const colCount = opts.length <= 3 ? opts.length : Math.min(opts.length, 4);

      const grid = document.createElement('div');
      grid.className = `grid gap-3`;
      grid.style.gridTemplateColumns = `repeat(${colCount}, minmax(0, 1fr))`;
      grid.dataset.infoId = info.id;

      opts.forEach((optText, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-card text-center py-3 text-sm font-medium';
        btn.textContent = optText;
        btn.addEventListener('click', () => {
          grid.querySelectorAll('.option-card').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');

          // Store answer
          const original = info.options[i];
          if (typeof original === 'string') {
            businessInfoAnswers[info.id] = original;
          } else {
            businessInfoAnswers[info.id] = { text: original.text, score: original.score };
          }

          checkBusinessInfoComplete();
        });
        grid.appendChild(btn);
      });

      group.appendChild(grid);
      businessInfoContainer.appendChild(group);
    });
  }

  function checkBusinessInfoComplete() {
    const allAnswered = quizData.businessInfo.every(info => businessInfoAnswers[info.id] !== undefined);
    btnStart.disabled = !allAnswered;
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
      // submitToGHL(userData, businessInfoAnswers, computeScores());

      showStep('results');
      renderResults();
    });

    btnRetake.addEventListener('click', () => {
      currentQuestionIndex = 0;
      answers = new Array(totalQuestions).fill(null);
      businessInfoAnswers = {};
      userData = { name: '', email: '', company: '' };
      businessInfoContainer.querySelectorAll('.option-card').forEach(b => b.classList.remove('selected'));
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
    void questionArea.offsetWidth;
    questionArea.classList.add('slide-in');

    // Render Yes / No cards
    optionsContainer.innerHTML = '';

    const yesBtn = createYesNoButton('Yes', 10);
    const noBtn = createYesNoButton('No', 0);

    // Highlight if already answered
    if (answers[currentQuestionIndex] !== null) {
      if (answers[currentQuestionIndex] === 10) yesBtn.classList.add('selected');
      else noBtn.classList.add('selected');
    }

    optionsContainer.appendChild(yesBtn);
    optionsContainer.appendChild(noBtn);

    // Show/hide back button
    btnBack.classList.toggle('hidden', currentQuestionIndex === 0);

    // Update nav
    navProgress.textContent = `${currentQuestionIndex + 1} / ${totalQuestions}`;
  }

  function createYesNoButton(label, score) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option-card text-center py-8 text-xl font-semibold flex items-center justify-center';

    const icon = label === 'Yes'
      ? '<svg class="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
      : '<svg class="w-6 h-6 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';

    btn.innerHTML = icon + label;

    btn.addEventListener('click', () => selectOption(score));
    return btn;
  }

  // ---- Select option ----
  function selectOption(score) {
    answers[currentQuestionIndex] = score;

    // Visual feedback
    const buttons = optionsContainer.querySelectorAll('.option-card');
    buttons.forEach(b => b.classList.remove('selected'));
    if (score === 10) buttons[0].classList.add('selected');
    else buttons[1].classList.add('selected');

    // Auto-advance
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        currentQuestionIndex++;
        renderQuestion();
      } else {
        progressFill.style.width = '100%';
        showStep('email');
      }
    }, 300);
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
      scores[cat.id] = 0;
    });

    let qi = 0;
    quizData.categories.forEach(cat => {
      cat.questions.forEach(() => {
        if (answers[qi] !== null) {
          scores[cat.id] += answers[qi];
        }
        qi++;
      });
    });

    return scores;
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
    const maxPerCategory = quizData.config.maxScorePerCategory;

    // User name
    const resultsName = document.getElementById('results-name');
    if (userData.name) {
      resultsName.textContent = `${userData.name}, here are your results`;
    }

    // Overall score
    const allScores = Object.values(scores);
    const overall = allScores.reduce((a, b) => a + b, 0);
    const maxTotal = maxPerCategory * quizData.categories.length;
    document.getElementById('overall-score').textContent = overall;

    // CTA
    document.getElementById('cta-link').href = quizData.config.ctaUrl;

    // Radar chart
    renderRadarChart(scores);

    // Sort categories by score for weakness identification
    const sortedCategories = quizData.categories
      .map(cat => ({ ...cat, score: scores[cat.id] }))
      .sort((a, b) => a.score - b.score);

    // Top weaknesses
    renderWeaknesses(sortedCategories);

    // Category cards
    renderCategoryCards(scores);
  }

  // ---- Radar chart ----
  function renderRadarChart(scores) {
    const ctx = document.getElementById('radar-chart').getContext('2d');
    const labels = quizData.categories.map(c => c.name);
    const data = quizData.categories.map(c => scores[c.id]);
    const max = quizData.config.maxScorePerCategory;

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
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          borderColor: '#ffffff',
          borderWidth: 1.5,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#ffffff',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: max,
            ticks: {
              stepSize: 10,
              color: '#7a8ba0',
              backdropColor: 'transparent',
              font: { size: 10 }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.08)'
            },
            angleLines: {
              color: 'rgba(255, 255, 255, 0.08)'
            },
            pointLabels: {
              color: '#e2e8f0',
              font: { size: 12, weight: '500' }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#112240',
            titleColor: '#ffffff',
            bodyColor: '#7a8ba0',
            borderColor: '#1e3a5f',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function (context) {
                return `Score: ${context.parsed.r} / ${max}`;
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

    const weaknesses = sorted.filter(c => c.score <= 20).slice(0, 2);

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
            <p class="text-sm text-slate-300 mt-1">${result.description.split('\n')[0]}</p>
          </div>
        </div>
      `;
      list.appendChild(div);
    });
  }

  // ---- Render category cards ----
  function renderCategoryCards(scores) {
    const container = document.getElementById('results-cards');
    container.innerHTML = '';
    const max = quizData.config.maxScorePerCategory;

    quizData.categories.forEach(cat => {
      const score = scores[cat.id];
      const level = getResultLevel(cat, score);
      const result = cat.results[level];

      let colorClass, badgeClass;
      if (score <= 20) {
        colorClass = 'result-red';
        badgeClass = 'badge-red';
      } else if (score <= 40) {
        colorClass = 'result-amber';
        badgeClass = 'badge-amber';
      } else {
        colorClass = 'result-green';
        badgeClass = 'badge-green';
      }

      // Format description into paragraphs
      const descParagraphs = result.description
        .split('\n')
        .filter(p => p.trim())
        .map(p => `<p class="mb-2">${p.trim()}</p>`)
        .join('');

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
          <div class="score-badge ${badgeClass}">${score}</div>
        </div>
        <div class="text-slate-300 text-sm">${descParagraphs}</div>
      `;
      container.appendChild(card);
    });
  }

  // ---- GHL webhook placeholder ----
  // Uncomment and configure to send data to Go High Level
  /*
  function submitToGHL(user, businessInfo, scores) {
    const payload = {
      name: user.name,
      email: user.email,
      company: user.company,
      teamSize: businessInfo['team-size'],
      workLocation: businessInfo['work-location'],
      yearsRunning: businessInfo['years-running'],
      revenue: businessInfo['revenue'],
      scores: scores,
      overallScore: Object.values(scores).reduce((a, b) => a + b, 0),
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
