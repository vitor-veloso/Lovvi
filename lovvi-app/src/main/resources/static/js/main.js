const API_BASE = '/api';
const USER_KEY = 'lovviUserId';

const swipeState = {
  matches: [],
  index: 0,
  history: [],
  acceptedMatches: [],
  userId: null,
  moving: false
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setMessage(containerId, message, type = 'info') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = message;
  container.className = `message ${type}`;
}

function clearMessage(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.textContent = '';
  container.className = '';
}

function saveCurrentUser(idUsuario) {
  localStorage.setItem(USER_KEY, String(idUsuario));
}

function getSavedUser() {
  const value = Number(localStorage.getItem(USER_KEY));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function initials(name) {
  const parts = String(name || 'Lovvi').trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'LV';
}

function avatarHue(name) {
  const text = String(name || 'Lovvi');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash + text.charCodeAt(i) * (i + 7)) % 360;
  }
  return hash;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(typeof payload === 'string' && payload ? payload : `Erro ${response.status}`);
  }

  return payload;
}

async function fetchInteresses() {
  const container = document.getElementById('interessesGrid');
  if (!container) return;

  try {
    const interesses = await requestJson(`${API_BASE}/interesses`);

    container.innerHTML = interesses.length > 0 ? interesses.map(i => `
      <label class="check-item interest-pill">
        <input type="checkbox" name="interesse" value="${i.idInteresse}">
        <span>${escapeHtml(i.nomeInteresse)}</span>
      </label>
    `).join('') : '<p>Nenhum interesse disponivel.</p>';
  } catch (error) {
    container.innerHTML = '<p>Erro ao carregar interesses. Tente novamente mais tarde.</p>';
    console.error(error);
  }
}

function getSelectedInterestIds() {
  return Array.from(document.querySelectorAll('#interessesGrid input[name="interesse"]:checked'))
    .map(input => Number(input.value))
    .filter(n => !Number.isNaN(n));
}

function normalizeGender(value) {
  const map = { M: 'Masculino', F: 'Feminino', O: 'Outro' };
  return map[value] || value;
}

function normalizeTipoPerfil(value) {
  if (value === 'serio' || value === 'relacionamento') return 'relacionamento';
  if (value === 'amizade') return 'amizade';
  if (value === 'casual') return 'casual';
  return value;
}

async function handleCadastro(event) {
  event.preventDefault();
  clearMessage('formMsg');

  const form = event.target;
  const alturaValue = form.altura?.value?.trim();

  const payload = {
    nome: form.nome?.value?.trim() || '',
    sobrenome: form.sobrenome?.value?.trim() || '',
    email: form.email?.value?.trim() || '',
    senha: form.senha?.value?.trim() || '',
    cidade: form.cidade?.value?.trim() || '',
    genero: normalizeGender(form.genero?.value || ''),
    generoInteresse: normalizeGender(form.genero_interesse?.value || ''),
    dtNascimento: form.dt_nascimento?.value || '',
    descricao: form.descricao?.value?.trim() || '',
    preferencias: form.preferencias?.value?.trim() || '',
    objetivos: form.objetivos?.value?.trim() || '',
    tipoPerfil: normalizeTipoPerfil(form.tipo_perfil?.value || ''),
    altura: alturaValue ? Number(alturaValue) : null,
    interesses: getSelectedInterestIds()
  };

  if (!payload.nome || !payload.sobrenome || !payload.email || !payload.senha || !payload.cidade || !payload.genero || !payload.generoInteresse || !payload.dtNascimento || !payload.tipoPerfil) {
    setMessage('formMsg', 'Preencha todos os campos obrigatorios corretamente.', 'error');
    return;
  }

  try {
    setMessage('formMsg', 'Criando seu perfil...', 'info');
    const result = await requestJson(`${API_BASE}/usuarios/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    saveCurrentUser(result.idUsuario);
    window.location.href = `/perfil/${result.idUsuario}`;
  } catch (error) {
    setMessage('formMsg', `Falha no cadastro: ${error.message || 'verifique o console'}`, 'error');
    console.error(error);
  }
}

function handleLogin(event) {
  event.preventDefault();
  clearMessage('loginMsg');

  const idUsuario = Number(event.target.idUsuario?.value);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    setMessage('loginMsg', 'Informe um ID de usuario valido.', 'error');
    return;
  }

  saveCurrentUser(idUsuario);
  window.location.href = `/perfil/${idUsuario}`;
}

function initHome() {
  const btn = document.getElementById('btnContinueProfile');
  const savedUser = getSavedUser();
  if (!btn || !savedUser) return;

  btn.hidden = false;
  btn.textContent = `Continuar perfil #${savedUser}`;
  btn.addEventListener('click', () => {
    window.location.href = `/perfil/${savedUser}`;
  });
}

function renderCard(match, offset = 0) {
  const interests = Array.isArray(match.interesses) && match.interesses.length
    ? match.interesses.map(item => `<span>${escapeHtml(item)}</span>`).join('')
    : '<span>Sem interesses em comum</span>';

  return `
    <article class="swipe-card ${offset ? 'is-next' : 'is-active'}" style="--offset:${offset};--avatar-hue:${avatarHue(match.nomeCompleto)}" ${offset ? '' : 'data-active="true"'}>
      <div class="swipe-decision like">Like</div>
      <div class="swipe-decision pass">Pass</div>
      <div class="swipe-photo">
        <span>${escapeHtml(initials(match.nomeCompleto))}</span>
      </div>
      <div class="swipe-card-body">
        <div class="compat-badge">
          <strong>${escapeHtml(match.compatibilidade)}%</strong>
          <span>afinidade</span>
        </div>
        <div class="profile-copy">
          <p class="profile-meta">${escapeHtml(match.cidade || 'Cidade nao informada')} / ${escapeHtml(match.tipoPerfil || 'perfil')}</p>
          <h2>${escapeHtml(match.nomeCompleto)}</h2>
        </div>
        <div class="interest-tags">${interests}</div>
      </div>
    </article>
  `;
}

function attachSwipeGestures() {
  const card = document.querySelector('.swipe-card[data-active="true"]');
  if (!card) return;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let dragging = false;

  const updateCard = () => {
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const rotate = Math.max(-18, Math.min(18, deltaX / 14));
    const progress = Math.min(1, Math.abs(deltaX) / 130);

    card.style.setProperty('--swipe-progress', progress.toFixed(2));
    card.dataset.swipe = deltaX > 18 ? 'like' : deltaX < -18 ? 'pass' : '';
    card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;
  };

  const resetCard = () => {
    card.classList.add('is-returning');
    card.style.removeProperty('transform');
    card.style.removeProperty('--swipe-progress');
    card.dataset.swipe = '';
    window.setTimeout(() => card.classList.remove('is-returning'), 220);
  };

  card.addEventListener('pointerdown', event => {
    if (swipeState.moving) return;
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    currentX = event.clientX;
    currentY = event.clientY;
    card.setPointerCapture(event.pointerId);
    card.classList.add('is-dragging');
  });

  card.addEventListener('pointermove', event => {
    if (!dragging || swipeState.moving) return;
    currentX = event.clientX;
    currentY = event.clientY;
    updateCard();
  });

  card.addEventListener('pointerup', event => {
    if (!dragging) return;
    dragging = false;
    card.releasePointerCapture(event.pointerId);
    card.classList.remove('is-dragging');

    const deltaX = currentX - startX;
    if (deltaX > 120) {
      moveCard('like');
      return;
    }
    if (deltaX < -120) {
      moveCard('pass');
      return;
    }
    resetCard();
  });

  card.addEventListener('pointercancel', () => {
    dragging = false;
    card.classList.remove('is-dragging');
    resetCard();
  });
}

function renderSwipeStack() {
  const stack = document.getElementById('cardStack');
  const status = document.getElementById('swipeStatus');
  if (!stack || !status) return;

  const current = swipeState.matches[swipeState.index];
  const next = swipeState.matches[swipeState.index + 1];

  if (!current) {
    stack.innerHTML = `
      <article class="empty-stack">
        <strong>Sem mais cards por agora.</strong>
        <span>Volte depois ou ajuste seus interesses no cadastro.</span>
      </article>
    `;
    status.textContent = `${swipeState.matches.length} match(es) encontrados`;
    return;
  }

  status.textContent = `${swipeState.index + 1} de ${swipeState.matches.length}`;
  stack.innerHTML = `${next ? renderCard(next, 1) : ''}${renderCard(current, 0)}`;
  attachSwipeGestures();
}

function renderSeenMatches() {
  const list = document.getElementById('seenMatches');
  const historyCount = document.getElementById('historyCount');
  if (!list) return;
  if (historyCount) {
    historyCount.textContent = String(swipeState.acceptedMatches.length);
  }

  if (swipeState.acceptedMatches.length === 0) {
    list.innerHTML = '<p>Nenhum match ainda.</p>';
    return;
  }

  list.innerHTML = swipeState.acceptedMatches.map(match => `
    <article class="seen-item like">
      <strong>${escapeHtml(match.nomeCompleto)}</strong>
      <span>Match confirmado - ${escapeHtml(match.compatibilidade)}%</span>
    </article>
  `).join('');
}

function addAcceptedMatch(match) {
  if (!match || !match.idUsuario) return;
  const exists = swipeState.acceptedMatches.some(item => item.idUsuario === match.idUsuario);
  if (!exists) {
    swipeState.acceptedMatches = [match, ...swipeState.acceptedMatches];
  }
  renderSeenMatches();
}

async function recordSwipe(action, match) {
  if (!swipeState.userId || !match?.idUsuario) return;

  try {
    const endpoint = action === 'like' ? 'like' : 'pass';
    const result = await requestJson(`${API_BASE}/usuarios/${swipeState.userId}/matches/${match.idUsuario}/${endpoint}`, {
      method: 'POST'
    });
    if (action === 'like') {
      addAcceptedMatch(result || match);
    }
  } catch (error) {
    const status = document.getElementById('swipeStatus');
    if (status) {
      status.textContent = 'Nao foi possivel registrar a acao.';
    }
    console.error(error);
  }
}

function moveCard(action) {
  const match = swipeState.matches[swipeState.index];
  if (!match || swipeState.moving) return;

  const card = document.querySelector('.swipe-card[data-active="true"]');
  swipeState.moving = true;

  if (card) {
    card.dataset.swipe = action;
    card.classList.add(action === 'like' ? 'fly-like' : 'fly-pass');
  }

  window.setTimeout(() => {
    swipeState.history.push({ action, match });
    swipeState.index += 1;
    swipeState.moving = false;
    renderSwipeStack();
    renderSeenMatches();
    recordSwipe(action, match);
  }, card ? 320 : 0);
}

function backCard() {
  const last = swipeState.history.pop();
  if (!last || swipeState.moving) return;

  swipeState.index = Math.max(0, swipeState.index - 1);
  renderSwipeStack();
  renderSeenMatches();
}

async function initSwipePage() {
  const page = document.querySelector('.swipe-page');
  if (!page) return;

  const idUsuario = Number(page.dataset.userId);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    document.getElementById('swipeStatus').textContent = 'Usuario invalido.';
    return;
  }

  saveCurrentUser(idUsuario);
  swipeState.userId = idUsuario;
  document.getElementById('btnPass')?.addEventListener('click', () => moveCard('pass'));
  document.getElementById('btnLike')?.addEventListener('click', () => moveCard('like'));
  document.getElementById('btnBackCard')?.addEventListener('click', backCard);
  document.addEventListener('keydown', event => {
    if (!document.querySelector('.swipe-page')) return;
    if (event.key === 'ArrowLeft') moveCard('pass');
    if (event.key === 'ArrowRight') moveCard('like');
    if (event.key === 'ArrowUp') backCard();
  });

  try {
    const [matches, acceptedMatches] = await Promise.all([
      requestJson(`${API_BASE}/usuarios/${idUsuario}/matches`),
      requestJson(`${API_BASE}/usuarios/${idUsuario}/matches/accepted`)
    ]);
    swipeState.matches = Array.isArray(matches) ? matches : [];
    swipeState.acceptedMatches = Array.isArray(acceptedMatches) ? acceptedMatches : [];
    swipeState.index = 0;
    swipeState.history = [];
    renderSwipeStack();
    renderSeenMatches();
  } catch (error) {
    document.getElementById('swipeStatus').textContent = 'Nao foi possivel carregar seus matches.';
    document.getElementById('cardStack').innerHTML = `
      <article class="empty-stack">
        <strong>Erro ao buscar matches.</strong>
        <span>${escapeHtml(error.message || 'Tente novamente mais tarde.')}</span>
      </article>
    `;
    console.error(error);
  }
}

function initUI() {
  initHome();
  initSwipePage();

  const cadastroForm = document.getElementById('formCadastro');
  if (cadastroForm) {
    cadastroForm.addEventListener('submit', handleCadastro);
  }

  const loginForm = document.getElementById('formLogin');
  if (loginForm) {
    const savedUser = getSavedUser();
    if (savedUser && loginForm.idUsuario) {
      loginForm.idUsuario.value = savedUser;
    }
    loginForm.addEventListener('submit', handleLogin);
  }

  fetchInteresses();
}

document.addEventListener('DOMContentLoaded', initUI);
