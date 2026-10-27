// Follows the system; ?theme=light|dark or the toggle overrides it.
(function () {
  const forced = new URLSearchParams(location.search).get('theme');
  const dark = forced ? forced === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', dark);
})();
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
}
