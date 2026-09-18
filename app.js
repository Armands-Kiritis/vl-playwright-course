/* Payroll Transaction list — demo app.
 *
 * Vanilla JS, no build step, no dependencies. Served over http:// (never file://).
 *
 * This page deliberately deviates from its own requirements in five places (B1-B5).
 * Those deviations are the workshop exercise. See demo-app/README.md, and the
 * facilitator answer key, for the mapping. Do not "fix" them.
 */

var BUILD = 'build 2026-09-18a';

/* ---------------------------------------------------------------- variants */

function currentVariant() {
  var v = new URLSearchParams(window.location.search).get('variant');
  return (v === 'b' || v === 'c') ? v : 'base';
}
var VARIANT = currentVariant();

/* ------------------------------------------------------------------- state */

var COLUMN_DEFS = [
  { key: 'employeeNo', label: 'Employee number' },
  { key: 'employeeName', label: 'Name' },
  { key: 'type', label: 'Transaction type' },
  { key: 'period', label: 'Period' },
  { key: 'amount', label: 'Amount', numeric: true },
  { key: 'costCenter', label: 'Cost center' },
  { key: 'projectCode', label: 'Project code' },
  { key: 'account', label: 'Account' },
  { key: 'status', label: 'Status' }
];

function defaultColumns() {
  return COLUMN_DEFS.map(function (c) { return { key: c.key, visible: true }; });
}

var state = {
  view: 'signin',
  runId: DEFAULT_RUN,
  signedIn: false,
  user: '',
  signinUser: '',
  signinError: '',
  /* searchInput is what is typed; filters.search is what has been applied after
   * the debounce. Keeping them apart stops a re-render from reverting the
   * characters someone is still typing. */
  searchInput: '',
  filters: { type: 'all', period: 'all', status: 'all', search: '' },
  grouped: true,
  /* B5 (FR-1): columns live in memory only. They are never written to
   * sessionStorage, so the user choice is lost on reload. */
  columns: defaultColumns(),
  columnPickerOpen: false,
  selection: [],
  detailId: null,
  loading: false,
  confirmOpen: false,
  message: ''
};

var SESSION_KEY = 'payroll-demo-session';

function saveSession() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      signedIn: state.signedIn, user: state.user, view: state.view, runId: state.runId
    }));
  } catch (e) { /* private mode: the page still works, it just forgets */ }
}

function loadSession() {
  try {
    var raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    var s = JSON.parse(raw);
    if (s && s.signedIn) {
      state.signedIn = true;
      state.user = s.user || '';
      state.view = (s.view === 'transactions') ? 'transactions' : 'runs';
      state.runId = s.runId || DEFAULT_RUN;
    }
  } catch (e) { /* ignore a corrupt value rather than breaking the page */ }
}

/* ----------------------------------------------------------------- helpers */

function el(tag, props, children) {
  var node = document.createElement(tag);
  if (props) {
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : String(v));
    });
  }
  (children || []).forEach(function (c) {
    if (c === null || c === undefined) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

/* Amounts are integer oere. Formatted by hand (not toLocaleString) so the output
 * is byte-identical in every browser and locale, with a plain ASCII space as the
 * thousands separator - a non-breaking space here would quietly break assertions. */
function fmtAmount(cents) {
  var neg = cents < 0;
  var a = Math.abs(cents);
  var whole = Math.floor(a / 100);
  var frac = a % 100;
  var w = String(whole);
  var out = '';
  while (w.length > 3) {
    out = ' ' + w.slice(-3) + out;
    w = w.slice(0, -3);
  }
  out = w + out;
  return (neg ? '-' : '') + out + ',' + (frac < 10 ? '0' + frac : String(frac));
}

function runById(id) {
  return RUNS.filter(function (r) { return r.id === id; })[0];
}

function runTransactions() {
  return TRANSACTIONS.filter(function (t) { return t.run === state.runId; });
}

function txById(id) {
  return TRANSACTIONS.filter(function (t) { return t.id === id; })[0];
}

function isBlocking(t) {
  return t.status === 'Error' && t.severity === 'blocking';
}

function matchesFilters(t) {
  var f = state.filters;
  if (f.type !== 'all' && t.type !== f.type) return false;
  if (f.period !== 'all' && t.period !== f.period) return false;
  if (f.status !== 'all') {
    if (f.status === 'Error-blocking') {
      if (!isBlocking(t)) return false;
    } else if (t.status !== f.status) return false;
  }
  if (f.search) {
    var q = f.search.toLowerCase();
    var hit = t.employeeName.toLowerCase().indexOf(q) !== -1 ||
              t.employeeNo.indexOf(q) !== -1;
    if (!hit) return false;
  }
  return true;
}

function visibleTransactions() {
  return runTransactions().filter(matchesFilters);
}

function activeFilterChips() {
  var f = state.filters;
  var chips = [];
  /* The visible chip text names the field ("Status: Error"). The remove button's
   * accessible name deliberately does NOT, because getByLabel() matches on a
   * substring: an aria-label of "Remove filter Status: Error" would make
   * getByLabel('Status') ambiguous between the select and this button, and every
   * generated test would trip over it. */
  if (f.type !== 'all') {
    chips.push({ key: 'type', label: 'Type: ' + f.type, value: f.type });
  }
  if (f.period !== 'all') {
    chips.push({ key: 'period', label: 'Period: ' + f.period, value: f.period });
  }
  if (f.status !== 'all') {
    var statusLabel = (f.status === 'Error-blocking') ? 'Error (blocking)' : f.status;
    chips.push({ key: 'status', label: 'Status: ' + statusLabel, value: statusLabel });
  }
  if (f.search) {
    chips.push({ key: 'search', label: 'Search: ' + f.search, value: f.search });
  }
  return chips;
}

function visibleColumns() {
  return state.columns
    .filter(function (c) { return c.visible; })
    .map(function (c) {
      var def = COLUMN_DEFS.filter(function (d) { return d.key === c.key; })[0];
      return def;
    });
}

/* ------------------------------------------------------------------ totals */

/* Subtotals are filter-aware, exactly as FR-3 requires. */
function subtotalFor(employeeNo) {
  return visibleTransactions()
    .filter(function (t) { return t.employeeNo === employeeNo; })
    .reduce(function (sum, t) { return sum + t.amount; }, 0);
}

/* B2 (FR-3, critical): the grand total is computed over EVERY transaction in the
 * run and ignores the active filter. The subtotals above are correct, so the two
 * disagree the moment a filter is applied - which is how the bug is found.
 *
 * variant=c additionally drops one row, so the grand total is wrong by 2 150,00
 * even with no filter applied. Nothing on screen looks unusual. */
function grandTotal() {
  return runTransactions()
    .filter(function (t) { return !(VARIANT === 'c' && t.id === VARIANT_C_DROPPED_ROW); })
    .reduce(function (sum, t) { return sum + t.amount; }, 0);
}

/* --------------------------------------------------------------- rendering */

/* This app re-renders the whole view on every change, which is simple to reason
 * about but would otherwise throw away focus and the caret mid-keystroke. Grab
 * them first, put them back afterwards, keyed on data-testid. */
function captureFocus() {
  var a = document.activeElement;
  if (!a || !a.getAttribute) return null;
  var id = a.getAttribute('data-testid');
  if (!id) return null;
  var snap = { testid: id, start: null, end: null };
  try {
    if (a.selectionStart !== null && a.selectionStart !== undefined) {
      snap.start = a.selectionStart;
      snap.end = a.selectionEnd;
    }
  } catch (e) { /* selectionStart is not readable on every input type */ }
  return snap;
}

function restoreFocus(snap) {
  if (!snap) return;
  var node = document.querySelector('[data-testid="' + snap.testid + '"]');
  if (!node) return;
  node.focus();
  if (snap.start !== null && node.setSelectionRange) {
    try { node.setSelectionRange(snap.start, snap.end); } catch (e) { /* not a text input */ }
  }
}

function render() {
  var snap = captureFocus();
  var root = document.getElementById('app');
  root.innerHTML = '';
  if (!state.signedIn) root.appendChild(renderSignIn());
  else if (state.view === 'runs') root.appendChild(renderRunList());
  else root.appendChild(renderTransactions());
  renderFooter();
  restoreFocus(snap);
}

function renderFooter() {
  var stamp = document.getElementById('build-stamp');
  stamp.textContent = BUILD + ' · variant: ' + VARIANT;
}

/* ---- sign in ---- */

function renderSignIn() {
  var wrap = el('section', { class: 'card signin', 'aria-labelledby': 'signin-heading' });
  wrap.appendChild(el('h1', { id: 'signin-heading', text: 'Sign in to Payroll' }));

  var creds = el('div', { class: 'creds', 'data-testid': 'demo-credentials' }, [
    el('p', { text: 'Demo credentials (this is a training page, not a real system):' }),
    el('p', {}, [
      el('strong', { text: 'Username: ' }), el('code', { text: 'payroll.admin' }),
      el('span', { text: '  ' }),
      el('strong', { text: 'Password: ' }), el('code', { text: 'Workshop2026!' })
    ])
  ]);
  wrap.appendChild(creds);

  if (state.signinError) {
    wrap.appendChild(el('p', {
      class: 'error-msg', role: 'alert', 'data-testid': 'signin-error',
      text: state.signinError
    }));
  }

  var user = el('input', { id: 'username', name: 'username', type: 'text',
    autocomplete: 'off', 'data-testid': 'username', value: state.signinUser,
    oninput: function (ev) { state.signinUser = ev.target.value; } });
  var pass = el('input', { id: 'password', name: 'password', type: 'password',
    autocomplete: 'off', 'data-testid': 'password' });

  /* variant=b: the visible break. The button label changes, so a test that clicks
   * by accessible name goes red with a readable locator error. */
  var submitLabel = (VARIANT === 'b') ? 'Log in' : 'Sign in';

  var form = el('form', {
    'data-testid': 'signin-form',
    onsubmit: function (ev) {
      ev.preventDefault();
      if (user.value === 'payroll.admin' && pass.value === 'Workshop2026!') {
        state.signedIn = true;
        state.user = user.value;
        state.view = 'runs';
        state.signinError = '';
        state.signinUser = '';
        saveSession();
      } else {
        state.signinError = 'Wrong username or password.';
      }
      render();
    }
  }, [
    el('div', { class: 'field' }, [
      el('label', { for: 'username', text: 'Username' }), user
    ]),
    el('div', { class: 'field' }, [
      el('label', { for: 'password', text: 'Password' }), pass
    ]),
    el('button', { type: 'submit', class: 'primary', 'data-testid': 'signin-submit',
      text: submitLabel })
  ]);

  wrap.appendChild(form);
  return wrap;
}

/* ---- run list ---- */

function renderRunList() {
  var wrap = el('section', { class: 'card', 'aria-labelledby': 'runs-heading' });
  wrap.appendChild(el('h1', { id: 'runs-heading', text: 'Payroll runs' }));
  wrap.appendChild(el('p', { class: 'muted',
    text: 'Open a run to review its transactions.' }));

  var list = el('ul', { class: 'run-list', 'data-testid': 'run-list' });
  RUNS.forEach(function (r) {
    var count = TRANSACTIONS.filter(function (t) { return t.run === r.id; }).length;
    list.appendChild(el('li', { class: 'run', 'data-testid': 'run-' + r.id }, [
      el('div', { class: 'run-main' }, [
        el('span', { class: 'run-label', text: r.label }),
        el('span', { class: 'run-meta',
          text: r.state + ' · ' + count + ' transactions · paid ' + r.paidOn })
      ]),
      el('button', {
        class: 'primary',
        'aria-label': 'Open payroll run ' + r.label,
        'data-testid': 'open-run-' + r.id,
        onclick: function () {
          state.runId = r.id;
          state.view = 'transactions';
          resetFilters();
          state.selection = [];
          state.detailId = null;
          saveSession();
          render();
        },
        text: 'Open run'
      })
    ]));
  });
  wrap.appendChild(list);
  return wrap;
}

/* ---- transaction list ---- */

function renderTransactions() {
  var run = runById(state.runId);
  var wrap = el('section', { class: 'tx-view', 'aria-labelledby': 'tx-heading' });

  wrap.appendChild(el('div', { class: 'crumbs' }, [
    el('button', {
      class: 'link', 'data-testid': 'back-to-runs',
      onclick: function () {
        state.view = 'runs';
        state.detailId = null;
        saveSession();
        render();
      },
      text: '← All payroll runs'
    }),
    el('button', {
      class: 'link', 'data-testid': 'sign-out',
      onclick: function () {
        state.signedIn = false;
        state.view = 'signin';
        state.user = '';
        saveSession();
        render();
      },
      text: 'Sign out'
    })
  ]));

  wrap.appendChild(el('h1', { id: 'tx-heading',
    text: 'Transactions — ' + run.label }));

  /* The column picker REPLACES the filter toolbar rather than sitting beside it.
   * That is not decoration: the picker lists a column called "Transaction type"
   * and the toolbar has a filter labelled "Transaction type", and getByLabel()
   * matches on a substring - so while both were on screen at once, a perfectly
   * reasonable generated locator resolved to four elements. Showing one at a
   * time removes the ambiguity instead of asking a beginner to debug it. */
  wrap.appendChild(state.columnPickerOpen ? renderColumnPicker() : renderToolbar());
  wrap.appendChild(renderChips());
  if (state.selection.length > 0) wrap.appendChild(renderBulkBar());

  if (state.message) {
    wrap.appendChild(el('p', { class: 'message', role: 'status',
      'data-testid': 'message', text: state.message }));
  }

  var body = el('div', { class: 'tx-body' });
  body.appendChild(state.loading ? renderSpinner() : renderTable());
  if (state.detailId) body.appendChild(renderDetail());
  wrap.appendChild(body);

  if (state.confirmOpen) wrap.appendChild(renderConfirm());
  return wrap;
}

function renderSpinner() {
  return el('div', { class: 'spinner-box', role: 'status',
    'data-testid': 'loading-spinner' }, [
    el('span', { class: 'spinner', 'aria-hidden': 'true' }),
    el('span', { text: 'Working, please wait...' })
  ]);
}

function renderToolbar() {
  var f = state.filters;

  /* variant=b: the placeholder changes too, so a placeholder-based locator breaks. */
  var searchPlaceholder = (VARIANT === 'b')
    ? 'Find a person...'
    : 'Name or employee number';

  var search = el('input', {
    id: 'search', type: 'search', 'data-testid': 'search-input',
    placeholder: searchPlaceholder, value: state.searchInput,
    oninput: function (ev) {
      state.searchInput = ev.target.value;
      scheduleSearch();
    }
  });

  function select(id, testid, label, value, options, onchange) {
    var sel = el('select', { id: id, 'data-testid': testid, onchange: onchange });
    options.forEach(function (o) {
      var opt = el('option', { value: o.value, text: o.label });
      if (o.value === value) opt.setAttribute('selected', '');
      sel.appendChild(opt);
    });
    return el('div', { class: 'field' }, [el('label', { for: id, text: label }), sel]);
  }

  var periods = [];
  runTransactions().forEach(function (t) {
    if (periods.indexOf(t.period) === -1) periods.push(t.period);
  });
  periods.sort().reverse();

  var toolbar = el('div', { class: 'toolbar', 'data-testid': 'toolbar' }, [
    el('div', { class: 'field' }, [el('label', { for: 'search', text: 'Search' }), search]),

    select('filter-type', 'filter-type', 'Transaction type', f.type, [
      { value: 'all', label: 'All types' },
      { value: 'Salary', label: 'Salary' },
      { value: 'Overtime', label: 'Overtime' },
      { value: 'Deduction', label: 'Deduction' },
      { value: 'Reimbursement', label: 'Reimbursement' }
    ], function (ev) { state.filters.type = ev.target.value; applyFilterChange(); }),

    select('filter-period', 'filter-period', 'Period', f.period,
      [{ value: 'all', label: 'All periods' }].concat(periods.map(function (p) {
        return { value: p, label: p };
      })),
      function (ev) { state.filters.period = ev.target.value; applyFilterChange(); }),

    select('filter-status', 'filter-status', 'Status', f.status, [
      { value: 'all', label: 'All statuses' },
      { value: 'Approved', label: 'Approved' },
      { value: 'Pending', label: 'Pending' },
      { value: 'Error', label: 'Error' },
      { value: 'Error-blocking', label: 'Error (blocking only)' }
    ], function (ev) { state.filters.status = ev.target.value; applyFilterChange(); })
  ]);

  var groupWrap = el('div', { class: 'field checkbox-field' });
  var groupBox = el('input', {
    id: 'group-by-employee', type: 'checkbox', 'data-testid': 'group-by-employee',
    onchange: function (ev) { state.grouped = ev.target.checked; render(); }
  });
  if (state.grouped) groupBox.setAttribute('checked', '');
  groupWrap.appendChild(groupBox);
  groupWrap.appendChild(el('label', { for: 'group-by-employee', text: 'Group by employee' }));
  toolbar.appendChild(groupWrap);

  toolbar.appendChild(el('button', {
    class: 'secondary', 'data-testid': 'toggle-column-picker',
    'aria-expanded': state.columnPickerOpen ? 'true' : 'false',
    onclick: function () { state.columnPickerOpen = !state.columnPickerOpen; render(); },
    text: 'Columns'
  }));

  /* B3 (FR-9): there is no "Export to Excel" button anywhere on this page.
   * The requirement asks for one. Finding something that is absent is the point. */

  return toolbar;
}

function renderChips() {
  var chips = activeFilterChips();
  var box = el('div', { class: 'chips', 'data-testid': 'filter-chips' });
  if (chips.length === 0) {
    box.appendChild(el('span', { class: 'muted', 'data-testid': 'no-filters',
      text: 'No filters applied' }));
    return box;
  }
  chips.forEach(function (c) {
    box.appendChild(el('span', { class: 'chip' }, [
      el('span', { text: c.label }),
      el('button', {
        class: 'chip-x', 'aria-label': 'Remove filter for ' + c.value,
        'data-testid': 'remove-filter-' + c.key,
        onclick: function () {
          if (c.key === 'search') {
            if (searchTimer) { window.clearTimeout(searchTimer); searchTimer = null; }
            state.filters.search = '';
            state.searchInput = '';
          } else {
            state.filters[c.key] = 'all';
          }
          applyFilterChange();
        },
        text: '×'
      })
    ]));
  });
  box.appendChild(el('button', {
    class: 'link', 'data-testid': 'clear-all-filters',
    onclick: function () {
      resetFilters();
      applyFilterChange();
    },
    text: 'Clear all'
  }));
  return box;
}

function renderColumnPicker() {
  var box = el('div', { class: 'card column-picker', 'data-testid': 'column-picker',
    'aria-label': 'Choose columns' });
  box.appendChild(el('h2', { text: 'Columns' }));
  box.appendChild(el('p', { class: 'muted',
    text: 'Choose which columns are visible, and reorder them.' }));

  var list = el('ul', { class: 'column-list' });
  state.columns.forEach(function (c, i) {
    var def = COLUMN_DEFS.filter(function (d) { return d.key === c.key; })[0];
    var boxId = 'col-' + c.key;
    var cb = el('input', {
      id: boxId, type: 'checkbox', 'data-testid': 'column-toggle-' + c.key,
      onchange: function (ev) {
        c.visible = ev.target.checked;
        render();
      }
    });
    if (c.visible) cb.setAttribute('checked', '');

    /* The move buttons deliberately carry the column name ("Move Period up") so
     * they are usable with a screen reader. Inside this panel that makes
     * getByLabel('Period') ambiguous, which is why generated tests should reach
     * for the role: getByRole('checkbox', { name: 'Period' }) resolves to one. */
    list.appendChild(el('li', {}, [
      cb,
      el('label', { for: boxId, text: def.label }),
      el('button', {
        class: 'tiny', 'aria-label': 'Move ' + def.label + ' up',
        'data-testid': 'column-up-' + c.key,
        disabled: i === 0,
        onclick: function () { moveColumn(i, -1); },
        text: '↑'
      }),
      el('button', {
        class: 'tiny', 'aria-label': 'Move ' + def.label + ' down',
        'data-testid': 'column-down-' + c.key,
        disabled: i === state.columns.length - 1,
        onclick: function () { moveColumn(i, 1); },
        text: '↓'
      })
    ]));
  });
  box.appendChild(list);
  box.appendChild(el('button', {
    class: 'primary', 'data-testid': 'close-column-picker',
    onclick: function () { state.columnPickerOpen = false; render(); },
    text: 'Done'
  }));
  return box;
}

function moveColumn(index, delta) {
  var target = index + delta;
  if (target < 0 || target >= state.columns.length) return;
  var tmp = state.columns[index];
  state.columns[index] = state.columns[target];
  state.columns[target] = tmp;
  /* B5 (FR-1): nothing is persisted here. The requirement says the column choice
   * is saved per user and survives a reload. It does not. */
  render();
}

function renderBulkBar() {
  var n = state.selection.length;
  return el('div', { class: 'bulk-bar', role: 'region', 'aria-label': 'Bulk actions',
    'data-testid': 'bulk-toolbar' }, [
    el('span', { 'data-testid': 'selected-count', text: n + ' selected' }),
    el('button', {
      class: 'primary', 'data-testid': 'bulk-approve',
      onclick: function () { state.confirmOpen = true; render(); },
      text: 'Approve selected'
    }),
    el('button', {
      class: 'secondary', 'data-testid': 'clear-selection',
      onclick: function () { state.selection = []; render(); },
      text: 'Clear selection'
    })
  ]);
}

function renderConfirm() {
  /* B4 (FR-7): the requirement asks for a confirmation that states the count
   * ("You are about to approve 2 400 transactions - are you sure?"). This one
   * does not say how many. */
  var dialog = el('div', { class: 'modal-backdrop' }, [
    el('div', {
      class: 'modal', role: 'dialog', 'aria-modal': 'true',
      'aria-labelledby': 'confirm-title', 'data-testid': 'confirm-dialog'
    }, [
      el('h2', { id: 'confirm-title', text: 'Approve transactions' }),
      el('p', { 'data-testid': 'confirm-text', text: 'Are you sure?' }),
      el('div', { class: 'modal-actions' }, [
        el('button', {
          class: 'primary', 'data-testid': 'confirm-yes',
          onclick: doBulkApprove, text: 'Yes, approve'
        }),
        el('button', {
          class: 'secondary', 'data-testid': 'confirm-cancel',
          onclick: function () { state.confirmOpen = false; render(); },
          text: 'Cancel'
        })
      ])
    ])
  ]);
  return dialog;
}

function doBulkApprove() {
  var n = 0;
  state.selection.forEach(function (id) {
    var t = txById(id);
    if (t && !isBlocking(t)) { t.status = 'Approved'; t.severity = null; n += 1; }
  });
  state.selection = [];
  state.confirmOpen = false;
  state.message = 'Approved ' + n + ' transactions.';
  render();
}

function renderTable() {
  var rows = visibleTransactions();
  var cols = visibleColumns();
  var all = runTransactions();

  var box = el('div', { class: 'table-box' });

  box.appendChild(el('p', {
    class: 'result-count', role: 'status', 'data-testid': 'result-count',
    text: 'Showing ' + rows.length + ' of ' + all.length + ' transactions'
  }));

  if (rows.length === 0) {
    box.appendChild(el('p', { class: 'empty', 'data-testid': 'empty-state',
      text: 'No transactions match the current filters.' }));
    return box;
  }

  var table = el('table', { 'data-testid': 'transaction-table' });
  var caption = el('caption', { class: 'sr-only',
    text: 'Payroll transactions for ' + runById(state.runId).label });
  table.appendChild(caption);

  /* head */
  var selectable = rows.filter(function (t) { return !isBlocking(t); });
  var allSelected = selectable.length > 0 && selectable.every(function (t) {
    return state.selection.indexOf(t.id) !== -1;
  });
  var selectAll = el('input', {
    type: 'checkbox', 'aria-label': 'Select all visible transactions',
    'data-testid': 'select-all',
    onchange: function (ev) {
      if (ev.target.checked) {
        state.selection = selectable.map(function (t) { return t.id; });
      } else {
        state.selection = [];
      }
      render();
    }
  });
  if (allSelected) selectAll.setAttribute('checked', '');

  var headRow = el('tr', {}, [
    el('th', { scope: 'col', class: 'col-select' }, [selectAll]),
    el('th', { scope: 'col', text: 'Transaction' })
  ]);
  cols.forEach(function (c) {
    headRow.appendChild(el('th', {
      scope: 'col', class: c.numeric ? 'numeric' : null, text: c.label
    }));
  });
  table.appendChild(el('thead', {}, [headRow]));

  /* body */
  var tbody = el('tbody', {});
  if (state.grouped) {
    var seen = [];
    rows.forEach(function (t) {
      if (seen.indexOf(t.employeeNo) === -1) seen.push(t.employeeNo);
    });
    seen.sort();
    seen.forEach(function (empNo) {
      var empRows = rows.filter(function (t) { return t.employeeNo === empNo; });
      var name = empRows[0].employeeName;
      tbody.appendChild(el('tr', { class: 'group-head',
        'data-testid': 'group-' + empNo }, [
        el('th', { colspan: cols.length + 2, scope: 'colgroup',
          text: name + ' (' + empNo + ')' })
      ]));
      empRows.forEach(function (t) { tbody.appendChild(renderRow(t, cols)); });
      tbody.appendChild(el('tr', { class: 'subtotal-row' }, [
        el('td', { colspan: cols.length + 1,
          text: 'Subtotal ' + name + ' (' + empNo + ')' }),
        el('td', { class: 'numeric', 'data-testid': 'subtotal-' + empNo,
          text: fmtAmount(subtotalFor(empNo)) })
      ]));
    });
  } else {
    rows.forEach(function (t) { tbody.appendChild(renderRow(t, cols)); });
  }
  table.appendChild(tbody);

  /* foot - grand total (B2 lives in grandTotal()) */
  table.appendChild(el('tfoot', {}, [
    el('tr', { class: 'grand-total-row' }, [
      el('td', { colspan: cols.length + 1, text: 'Grand total' }),
      el('td', { class: 'numeric', 'data-testid': 'grand-total',
        text: fmtAmount(grandTotal()) })
    ])
  ]));

  box.appendChild(table);
  return box;
}

function renderRow(t, cols) {
  var selected = state.selection.indexOf(t.id) !== -1;
  var blocking = isBlocking(t);

  var cb = el('input', {
    type: 'checkbox',
    'aria-label': blocking
      ? 'Cannot select ' + t.id + ' - blocking error'
      : 'Select transaction ' + t.id,
    'data-testid': 'select-' + t.id,
    disabled: blocking,
    onchange: function (ev) {
      if (ev.target.checked) state.selection.push(t.id);
      else state.selection = state.selection.filter(function (id) { return id !== t.id; });
      render();
    }
  });
  if (selected) cb.setAttribute('checked', '');

  var idCell = el('td', { 'data-label': 'Transaction' }, [
    el('button', {
      class: 'link tx-id', 'data-testid': 'open-' + t.id,
      'aria-label': 'Open details for ' + t.id,
      onclick: function (ev) { ev.stopPropagation(); openDetail(t.id); },
      text: t.id
    }),
    /* FR-6: the retro marker sits in the fixed Transaction column, not in the
     * Period column - which the user is allowed to hide. */
    t.retroOf ? el('span', {
      class: 'retro-tag', 'data-testid': 'retro-' + t.id,
      title: 'Retroactive correction for ' + t.retroOf.label,
      text: '↺ RETRO'
    }) : null
  ]);

  var tr = el('tr', {
    class: 'tx-row' + (selected ? ' is-selected' : ''),
    'data-testid': 'row-' + t.id,
    'data-transaction-id': t.id,
    onclick: function (ev) {
      var tag = ev.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'label' || tag === 'button') return;
      openDetail(t.id);
    }
  }, [
    el('td', { class: 'col-select', 'data-label': '' }, [cb]),
    idCell
  ]);

  cols.forEach(function (c) {
    var cell;
    if (c.key === 'amount') {
      cell = el('td', { class: 'numeric', 'data-label': c.label,
        text: fmtAmount(t.amount) });
    } else if (c.key === 'status') {
      /* B1 (FR-4): status is shown with colour and text only. The requirement
       * says colour AND an icon, so a colour-blind reviewer can still tell them
       * apart. There is no icon here. */
      cell = el('td', { 'data-label': c.label }, [
        el('span', {
          class: 'status status-' + t.status.toLowerCase(),
          'data-testid': 'status-' + t.id,
          text: t.status
        })
      ]);
    } else {
      var value = t[c.key];
      cell = el('td', { 'data-label': c.label, text: (value === '' ? '—' : value) });
    }
    tr.appendChild(cell);
  });

  return tr;
}

function openDetail(id) {
  state.detailId = id;
  render();
  var panel = document.querySelector('[data-testid="detail-panel"]');
  if (panel) panel.focus();
}

function renderDetail() {
  var t = txById(state.detailId);
  if (!t) return el('div');

  var panel = el('aside', {
    class: 'card detail', 'data-testid': 'detail-panel', tabindex: '-1',
    role: 'complementary', 'aria-labelledby': 'detail-heading'
  });

  panel.appendChild(el('div', { class: 'detail-head' }, [
    el('h2', { id: 'detail-heading', text: t.id }),
    el('button', {
      class: 'link', 'aria-label': 'Close detail panel',
      'data-testid': 'close-detail',
      onclick: function () { state.detailId = null; render(); },
      text: '×'
    })
  ]));

  function row(label, value) {
    return el('div', { class: 'detail-row' }, [
      el('span', { class: 'detail-label', text: label }),
      el('span', { class: 'detail-value', text: value })
    ]);
  }

  panel.appendChild(el('div', { class: 'detail-grid' }, [
    row('Employee', t.employeeName + ' (' + t.employeeNo + ')'),
    row('Transaction type', t.type),
    row('Period', t.period),
    row('Amount', fmtAmount(t.amount)),
    row('Cost center', t.costCenter),
    row('Project code', t.projectCode === '' ? '—' : t.projectCode),
    row('Account', t.account),
    row('Status', t.status)
  ]));

  if (t.retroOf) {
    panel.appendChild(el('div', { class: 'detail-block retro-block',
      'data-testid': 'detail-retro' }, [
      el('h3', { text: '↺ Retroactive correction' }),
      el('p', { text: 'This is a back-dated correction for ' + t.retroOf.label + '.' }),
      el('p', {}, [
        el('span', { text: 'Corrects transaction ' }),
        el('a', { href: '#', 'data-testid': 'retro-original',
          onclick: function (ev) { ev.preventDefault(); },
          text: t.retroOf.id }),
        el('span', { text: ' in the ' + t.retroOf.label + ' run.' })
      ])
    ]));
  }

  if (t.error) {
    var severityLine = (t.severity === 'blocking')
      ? 'This error blocks payment. It must be fixed before the run can be paid.'
      : 'This is a warning. Payment can still go ahead, but it will be flagged.';

    panel.appendChild(el('div', {
      class: 'detail-block error-block severity-' + t.severity,
      'data-testid': 'detail-error'
    }, [
      el('h3', { text: t.severity === 'blocking' ? 'Blocking error' : 'Warning' }),
      el('p', { 'data-testid': 'error-reason', text: t.error.reason }),
      el('p', { class: 'severity-line', 'data-testid': 'error-severity',
        text: severityLine }),
      el('div', { class: 'rule-vs-actual', 'data-testid': 'rule-vs-actual' }, [
        el('div', {}, [
          el('h4', { text: 'Rule' }),
          el('p', { 'data-testid': 'error-rule', text: t.error.rule })
        ]),
        el('div', {}, [
          el('h4', { text: 'Actual' }),
          el('p', { 'data-testid': 'error-actual', text: t.error.actual })
        ])
      ]),
      el('p', {}, [
        el('a', {
          href: '#', 'data-testid': 'error-fix-link',
          onclick: function (ev) {
            ev.preventDefault();
            state.message = 'In the real product this opens: ' + t.error.fixLabel;
            render();
          },
          text: t.error.fixLabel
        })
      ])
    ]));
  }

  panel.appendChild(el('div', { class: 'detail-block', 'data-testid': 'detail-audit' }, [
    el('h3', { text: 'History' }),
    el('ul', { class: 'audit' }, [
      el('li', { text: 'Created by ' + t.audit.createdBy + ' on ' + t.audit.createdAt }),
      t.audit.changedBy
        ? el('li', { text: 'Changed by ' + t.audit.changedBy + ' on ' + t.audit.changedAt })
        : el('li', { text: 'Not changed since it was created' })
    ])
  ]));

  return panel;
}

/* ------------------------------------------------- loading + filter changes */

var loadingTimer = null;
var searchTimer = null;

/* NFR-2: "clear loading feedback" so users do not re-click during a long
 * operation. Fixed 800 ms - long enough to see, short enough not to annoy, and
 * the reason Playwright's auto-waiting is worth showing the room. */
function applyFilterChange() {
  state.selection = [];
  state.message = '';
  state.loading = true;
  render();
  if (loadingTimer) window.clearTimeout(loadingTimer);
  loadingTimer = window.setTimeout(function () {
    state.loading = false;
    render();
  }, 800);
}

function scheduleSearch() {
  if (searchTimer) window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(function () {
    state.filters.search = state.searchInput.trim();
    applyFilterChange();
  }, 300);
}

/* Used by "Clear all" and by opening a run. Cancels any in-flight debounce so a
 * keystroke from a moment ago cannot re-apply a filter that was just cleared. */
function resetFilters() {
  if (searchTimer) { window.clearTimeout(searchTimer); searchTimer = null; }
  state.filters = { type: 'all', period: 'all', status: 'all', search: '' };
  state.searchInput = '';
}

/* -------------------------------------------------------------------- boot */

loadSession();
render();
