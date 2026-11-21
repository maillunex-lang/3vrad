const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8080';

export function App() {
  return (
    <main className="shell">
      <header>
        <h1>Райский остров — админка</h1>
        <p>
          E01 scaffold. По ADMIN-001 A здесь будут только управление игроками и редактор уровней —
          не полноценная студия.
        </p>
      </header>
      <section>
        <h2>Статус</h2>
        <ul>
          <li>Игроки: TODO (E05+)</li>
          <li>Редактор уровней: TODO (E07)</li>
          <li>
            API: <code>{API_BASE}</code>
          </li>
        </ul>
      </section>
    </main>
  );
}
