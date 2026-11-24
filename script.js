// Simple calculator: enter a number, pick an operator, enter another number, press =.
// Chained operations work left to right (2 + 3 × 4 = 20), like a basic pocket calculator.

const resultEl = document.getElementById("result");
const expressionEl = document.getElementById("expression");

const SYMBOLS = { "+": "+", "-": "−", "*": "×", "/": "÷" };

const state = {
  current: "0",       // number being typed / shown
  previous: null,     // left-hand number
  operator: null,     // pending operator
  overwrite: false,   // next digit replaces `current` (after = or an operator)
};

function format(value) {
  if (value === "Error") return value;
  const n = Number(value);
  if (!Number.isFinite(n)) return "Error";
  // Avoid floating-point noise like 0.1 + 0.2 = 0.30000000000000004
  return String(parseFloat(n.toPrecision(12)));
}

function compute(a, b, op) {
  const x = Number(a);
  const y = Number(b);
  switch (op) {
    case "+": return x + y;
    case "-": return x - y;
    case "*": return x * y;
    case "/": return y === 0 ? "Error" : x / y;
    default: return y;
  }
}

function render() {
  const isError = state.current === "Error";
  resultEl.textContent = isError ? "Can't divide by 0" : state.current;
  resultEl.classList.toggle("error", isError);
  expressionEl.textContent =
    state.operator && state.previous !== null
      ? `${state.previous} ${SYMBOLS[state.operator]}`
      : "";
  document.querySelectorAll(".key.op").forEach((key) => {
    key.classList.toggle("active", state.overwrite && key.dataset.op === state.operator);
  });
}

function inputDigit(d) {
  if (state.overwrite || state.current === "0" || state.current === "Error") {
    state.current = d;
    state.overwrite = false;
  } else if (state.current.replace(/[-.]/g, "").length < 15) {
    state.current += d;
  }
}

function inputDecimal() {
  if (state.overwrite || state.current === "Error") {
    state.current = "0.";
    state.overwrite = false;
  } else if (!state.current.includes(".")) {
    state.current += ".";
  }
}

function chooseOperator(op) {
  if (state.current === "Error") return;
  if (state.operator && !state.overwrite) {
    state.current = format(compute(state.previous, state.current, state.operator));
    if (state.current === "Error") {
      state.previous = null;
      state.operator = null;
      return;
    }
  }
  state.previous = state.current;
  state.operator = op;
  state.overwrite = true;
}

function equals() {
  if (!state.operator || state.previous === null) return;
  const left = state.previous;
  const right = state.current;
  state.current = format(compute(left, right, state.operator));
  expressionEl.dataset.last = `${left} ${SYMBOLS[state.operator]} ${right} =`;
  state.previous = null;
  state.operator = null;
  state.overwrite = true;
}

function clearAll() {
  state.current = "0";
  state.previous = null;
  state.operator = null;
  state.overwrite = false;
}

function deleteLast() {
  if (state.overwrite || state.current === "Error") return;
  state.current = state.current.length > 1 ? state.current.slice(0, -1) : "0";
  if (state.current === "-") state.current = "0";
}

function toggleSign() {
  if (state.current === "0" || state.current === "Error") return;
  state.current = state.current.startsWith("-") ? state.current.slice(1) : "-" + state.current;
}

function percent() {
  if (state.current === "Error") return;
  state.current = format(Number(state.current) / 100);
}

const actions = {
  clear: clearAll,
  delete: deleteLast,
  percent,
  sign: toggleSign,
  decimal: inputDecimal,
  equals,
};

function handle(fn) {
  fn();
  render();
  if (fn === equals && expressionEl.dataset.last) {
    expressionEl.textContent = expressionEl.dataset.last;
    delete expressionEl.dataset.last;
  }
}

document.querySelector(".keys").addEventListener("click", (e) => {
  const key = e.target.closest("button");
  if (!key) return;
  if (key.dataset.digit) handle(() => inputDigit(key.dataset.digit));
  else if (key.dataset.op) handle(() => chooseOperator(key.dataset.op));
  else if (key.dataset.action) handle(actions[key.dataset.action]);
});

// Keyboard support
document.addEventListener("keydown", (e) => {
  const k = e.key;
  if (/^[0-9]$/.test(k)) handle(() => inputDigit(k));
  else if (["+", "-", "*", "/"].includes(k)) handle(() => chooseOperator(k));
  else if (k === "." || k === ",") handle(inputDecimal);
  else if (k === "Enter" || k === "=") { e.preventDefault(); handle(equals); }
  else if (k === "Backspace") handle(deleteLast);
  else if (k === "Escape" || k === "Delete") handle(clearAll);
  else if (k === "%") handle(percent);
});

render();
