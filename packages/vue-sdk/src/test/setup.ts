// Toasts append to document.body on a removal timer, and sessions write to
// localStorage; both would otherwise leak between cases.
afterEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
});
