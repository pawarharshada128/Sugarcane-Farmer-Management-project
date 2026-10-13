
import { useEffect, useState } from "react";
import "./index.css";

type Farmer = {
  name: string;
  village: string;
  suppliedTons: number;
  pendingAmount: number;
  amountPaid: number;
};

const API = "http://localhost:5001/api";

const suggestions = [
  "Which farmer supplied the most sugarcane?",
  "Which village has the highest pending payment?",
  "What is the total pending payment?",
  "Show farmers with no pending payment."
];

const money = (n: number) =>
  "₹" + n.toLocaleString("en-IN");

function App() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [question, setQuestion] = useState(
    "Which farmers have pending payments? Show their names, villages, pending amounts, and the total pending payment."
  );
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState("Home");

  async function loadFarmers() {
    setLoadingData(true);
    setError("");

    try {
      const response = await fetch(`${API}/farmers`);
      if (!response.ok) throw new Error("Could not load farmers.");

      const data: Farmer[] = await response.json();
      setFarmers(data);
    } catch {
      setError(
        "Cannot connect to the backend. Make sure api.ts is running on port 5001."
      );
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    void loadFarmers();
  }, []);

  const totalPending = farmers.reduce(
    (sum, f) => sum + f.pendingAmount, 0
  );

  const totalPaid = farmers.reduce(
    (sum, f) => sum + f.amountPaid, 0
  );

  const totalTons = farmers.reduce(
    (sum, f) => sum + f.suppliedTons, 0
  );

  async function askAI(text?: string) {
    const prompt = (text ?? question).trim();
    if (!prompt || loading) return;

    setQuestion(prompt);
    setAnswer("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI request failed.");
      }

      setAnswer(data.answer);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">🌿</div>
        <div>
          <h1>Sanjivani Sugar Factory</h1>
          <p>Farmer Data Assistant</p>
        </div>
        <div className="top-right">
          <span>✦ Powered by MCP + OpenAI</span>
          <span className="connected">● Connected</span>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav>
            {["Home", "Farmers", "Analytics", "About"].map((item) => (
              <button
                key={item}
                className={page === item ? "nav active" : "nav"}
                onClick={() => setPage(item)}
              >
                {item === "Home" ? "⌂" :
                 item === "Farmers" ? "♧" :
                 item === "Analytics" ? "▥" : "ⓘ"}
                <span>{item}</span>
              </button>
            ))}
          </nav>

          <div className="side-footer">
            <div>🌱</div>
            <strong>Sanjivani Sugar Factory</strong>
            <p>Supporting Our Farmers<br />Building a Better Tomorrow</p>
          </div>
        </aside>

        <main className="content">
          {page === "Home" && (
            <>
              <section className="panel">
                <h2>Ask About Farmer Data</h2>
                <p className="muted">
                  Get insights from the farmer database using AI.
                </p>

                <form
                  className="ask-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void askAI();
                  }}
                >
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask a question about farmer payments..."
                    rows={3}
                  />
                  <button className="ask-button" disabled={loading}>
                    {loading ? "Thinking..." : "➤ Ask"}
                  </button>
                </form>

                <p className="hint">💡 Try these examples:</p>
                <div className="suggestions">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      disabled={loading}
                      onClick={() => void askAI(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              <section className="stats">
                <Stat title="Total Farmers" value={
                  loadingData ? "…" : String(farmers.length)
                } />
                <Stat title="Pending Payments" value={
                  loadingData ? "…" : money(totalPending)
                } />
                <Stat title="Amount Paid" value={
                  loadingData ? "…" : money(totalPaid)
                } />
                <Stat title="Sugarcane Supplied" value={
                  loadingData ? "…" : `${totalTons} tonnes`
                } />
              </section>

              {(answer || loading || error) && (
                <section className="panel">
                  <h2>✳ AI Answer</h2>
                  {loading && <p className="loading">Analyzing your question…</p>}
                  {answer && <div className="answer">{answer}</div>}
                  {error && <div className="error">{error}</div>}
                </section>
              )}

              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h2>Farmer Records</h2>
                    <p className="muted">
                      Records retrieved from MongoDB through MCP.
                    </p>
                  </div>
                  <button className="refresh" onClick={() => void loadFarmers()}>
                    ↻ Refresh
                  </button>
                </div>
                <FarmerTable farmers={farmers} loading={loadingData} />
              </section>
            </>
          )}

          {page === "Farmers" && (
            <section className="panel">
              <h2>All Farmers</h2>
              <p className="muted">Farmer supply and payment details.</p>
              <FarmerTable farmers={farmers} loading={loadingData} />
            </section>
          )}

          {page === "Analytics" && (
            <section className="panel">
              <h2>Farmer Analytics</h2>
              <div className="analytics">
                <p><strong>Total farmers:</strong> {farmers.length}</p>
                <p><strong>Total sugarcane supplied:</strong> {totalTons} tonnes</p>
                <p><strong>Total amount paid:</strong> {money(totalPaid)}</p>
                <p><strong>Total pending:</strong> {money(totalPending)}</p>
                <p><strong>Farmers with pending balances:</strong>{" "}
                  {farmers.filter((f) => f.pendingAmount > 0).length}
                </p>
              </div>
            </section>
          )}

          {page === "About" && (
            <section className="panel">
              <h2>About This Project</h2>
              <p className="muted">
                An AI-powered farmer assistant built using React, Express,
                MongoDB, the Model Context Protocol (MCP), and OpenAI.
              </p>
              <div className="analytics">
                <p><strong>React:</strong> Web interface</p>
                <p><strong>Express:</strong> Backend API</p>
                <p><strong>MongoDB:</strong> Farmer database</p>
                <p><strong>MCP:</strong> Tool communication</p>
                <p><strong>OpenAI:</strong> Natural-language answers</p>
              </div>
            </section>
          )}

          <footer className="footer">
            ● Data from MongoDB <span>•</span> AI answers powered by OpenAI
          </footer>
        </main>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="stat">
      <div className="stat-symbol">✦</div>
      <p>{title}</p>
      <strong>{value}</strong>
    </div>
  );
}

function FarmerTable({
  farmers,
  loading
}: {
  farmers: Farmer[];
  loading: boolean;
}) {
  if (loading) return <p>Loading farmer records...</p>;

  if (farmers.length === 0) {
    return <p>No farmer records found.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Village</th>
            <th>Supplied (tonnes)</th>
            <th>Amount Paid</th>
            <th>Pending Amount</th>
          </tr>
        </thead>
        <tbody>
          {farmers.map((f) => (
            <tr key={`${f.name}-${f.village}`}>
              <td><strong>{f.name}</strong></td>
              <td>{f.village}</td>
              <td>{f.suppliedTons}</td>
              <td>{money(f.amountPaid)}</td>
              <td className={f.pendingAmount > 0 ? "pending" : "paid"}>
                {money(f.pendingAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
