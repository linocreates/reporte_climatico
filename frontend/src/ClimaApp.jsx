import { useState, useCallback } from "react";

const API_BASE = "http://localhost:3000/api/v1";

const UF_LIST = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

const t = {
  bg: "#080d18",
  surface: "#0f1624",
  surfaceAlt: "#161f30",
  border: "rgba(255,255,255,0.07)",
  accent: "#38bdf8",
  text: "#eef4ff",
  muted: "#7a90aa",
  dim: "#3d5068",
  danger: "#f87171",
  dangerBg: "rgba(248,113,113,0.1)",
  warm: "#fb923c",
  green: "#34d399",
  greenBg: "rgba(52,211,153,0.1)",
};

const COND = {
  sol: { icon: "☀️", color: "#fbbf24" },
  nublado: { icon: "☁️", color: "#94a3b8" },
  parcialmente: { icon: "⛅", color: "#60a5fa" },
  chuva: { icon: "🌧️", color: "#38bdf8" },
  trovoada: { icon: "⛈️", color: "#a78bfa" },
  neve: { icon: "❄️", color: "#bae6fd" },
  neblina: { icon: "🌫️", color: "#94a3b8" },
  garoa: { icon: "🌦️", color: "#7dd3fc" },
  tempestade: { icon: "🌩️", color: "#818cf8" },
};

function condMeta(desc = "") {
  const l = desc.toLowerCase();
  for (const [k, v] of Object.entries(COND)) if (l.includes(k)) return v;
  return { icon: "🌡️", color: t.accent };
}

// ─── API ──────────────────────────────────────────────────────────────
async function apiClima(cidade) {
  if (!cidade || cidade.trim().length < 2)
    return {
      erro: true,
      mensagem: "Nome da cidade inválido (mínimo 2 caracteres).",
    };
  try {
    const r = await fetch(
      `${API_BASE}/clima/${encodeURIComponent(cidade.trim())}`
    );
    const data = await r.json();
    if (!r.ok)
      return {
        erro: true,
        mensagem: data?.detail || data?.mensagem || `Erro ${r.status}.`,
      };
    if (Array.isArray(data)) {
      if (data.length === 0)
        return { erro: true, mensagem: "Cidade não encontrada." };
      return { lista: data };
    }
    return { lista: [data] };
  } catch {
    return {
      erro: true,
      mensagem:
        "Não foi possível conectar. Verifique se o uvicorn está rodando na porta 3000.",
    };
  }
}

async function apiCidades(uf) {
  if (!uf) return { erro: true, mensagem: "Selecione uma UF." };
  try {
    const r = await fetch(`${API_BASE}/cidades/${uf}`);
    const data = await r.json();
    if (!r.ok)
      return {
        erro: true,
        mensagem: data?.detail || data?.mensagem || `Erro ${r.status}.`,
      };
    return data;
  } catch {
    return {
      erro: true,
      mensagem:
        "Não foi possível conectar. Verifique se o uvicorn está rodando na porta 3000.",
    };
  }
}

async function apiHealth() {
  try {
    const r = await fetch(`${API_BASE}/health`);
    return await r.json();
  } catch {
    return null;
  }
}

// ─── Shared components ────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: t.muted,
            animation: `dot 0.9s ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function Tag({ children, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: `${color}22`,
        border: `0.5px solid ${color}55`,
        borderRadius: 7,
        padding: "3px 10px",
        fontSize: 12,
        color,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

function MetricCard({ label, value, unit, color }) {
  return (
    <div
      style={{
        background: t.surfaceAlt,
        border: `0.5px solid ${t.border}`,
        borderRadius: 12,
        padding: "13px 15px",
        flex: 1,
        minWidth: 100,
      }}
    >
      <p
        style={{
          margin: "0 0 5px",
          fontSize: 10,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: t.dim,
          fontWeight: 500,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 26,
          fontWeight: 300,
          fontFamily: "'DM Serif Display', serif",
          color: color || t.text,
          lineHeight: 1,
        }}
      >
        {value}
        <span style={{ fontSize: 13, color: t.muted, marginLeft: 3 }}>
          {unit}
        </span>
      </p>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div
      style={{
        background: t.dangerBg,
        border: `0.5px solid ${t.danger}44`,
        borderRadius: 11,
        padding: "11px 15px",
        fontSize: 13,
        color: t.danger,
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        animation: "fadeUp 0.3s ease",
      }}
    >
      <span>⚠️</span>
      <span>{msg}</span>
    </div>
  );
}

// ─── CidadeCard ───────────────────────────────────────────────────────
function CidadeCard({ cidade }) {
  const { icon, color } = condMeta(cidade?.clima?.condicao ?? "");
  return (
    <div
      style={{
        background: t.surface,
        border: `0.5px solid ${t.border}`,
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 10,
        animation: "fadeUp 0.4s ease",
      }}
    >
      <div
        style={{
          background: `linear-gradient(135deg, ${color}15 0%, transparent 55%)`,
          borderBottom: `0.5px solid ${t.border}`,
          padding: "14px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2
              style={{
                margin: "0 0 2px",
                fontSize: 18,
                fontFamily: "'DM Serif Display', serif",
                fontWeight: 400,
                color: t.text,
              }}
            >
              {cidade.nome}
            </h2>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: t.muted }}>
              {cidade.estado}
            </p>
            <Tag color={color}>
              {icon} {cidade.clima.condicao}
            </Tag>
          </div>
          <span style={{ fontSize: 34, lineHeight: 1 }}>{icon}</span>
        </div>
      </div>
      <div style={{ padding: "12px 16px" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          <MetricCard
            label="Mínima"
            value={cidade.clima.temperatura_min}
            unit="°C"
            color={t.accent}
          />
          <MetricCard
            label="Máxima"
            value={cidade.clima.temperatura_max}
            unit="°C"
            color={t.warm}
          />
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: t.dim,
            display: "flex",
            gap: 5,
            alignItems: "center",
          }}
        >
          <span>📅</span> Previsão para {cidade.consultado_em}
        </p>
      </div>
    </div>
  );
}

// ─── Tab: Clima ───────────────────────────────────────────────────────
function TabClima() {
  const [input, setInput] = useState("");
  const [loading, setLoad] = useState(false);
  const [lista, setLista] = useState(null);
  const [error, setError] = useState(null);

  const buscar = useCallback(async () => {
    if (loading) return;
    setError(null);
    setLista(null);
    setLoad(true);
    const res = await apiClima(input);
    setLoad(false);
    if (res.erro) setError(res.mensagem);
    else setLista(res.lista);
  }, [input, loading]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: "1.25rem",
          background: t.surface,
          border: `0.5px solid ${t.border}`,
          borderRadius: 11,
          padding: 5,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          placeholder="Ex: Fortaleza"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: t.text,
            fontSize: 15,
            padding: "6px 10px",
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <button
          onClick={buscar}
          disabled={loading}
          style={{
            background: loading ? t.surfaceAlt : t.accent,
            color: loading ? t.muted : "#080d18",
            border: "none",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            minWidth: 76,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
          }}
        >
          {loading ? <Spinner /> : "Buscar"}
        </button>
      </div>

      {error && <ErrorBox msg={error} />}

      {lista && !error && (
        <div>
          {lista.length > 1 && (
            <p style={{ margin: "0 0 10px", fontSize: 12, color: t.muted }}>
              {lista.length} cidades encontradas para{" "}
              <strong style={{ color: t.accent }}>{input}</strong>
            </p>
          )}
          {lista.map((cidade, i) => (
            <CidadeCard key={i} cidade={cidade} />
          ))}
        </div>
      )}

      {!lista && !error && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 1rem",
            color: t.dim,
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>🌤️</div>
          Digite o nome de uma cidade para ver a previsão.
        </div>
      )}
    </div>
  );
}

// ─── Tab: Cidades ─────────────────────────────────────────────────────
function TabCidades() {
  const [uf, setUf] = useState("");
  const [loading, setLoad] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const buscar = useCallback(async () => {
    if (loading || !uf) return;
    setError(null);
    setResult(null);
    setLoad(true);
    const res = await apiCidades(uf);
    setLoad(false);
    if (res.erro) setError(res.mensagem);
    else setResult(res);
  }, [uf, loading]);

  const lista = Array.isArray(result) ? result : result?.cidades ?? [];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
        <select
          value={uf}
          onChange={(e) => setUf(e.target.value)}
          style={{
            flex: 1,
            background: t.surface,
            border: `0.5px solid ${t.border}`,
            borderRadius: 11,
            padding: "10px 12px",
            color: uf ? t.text : t.muted,
            fontSize: 14,
            fontFamily: "'DM Sans', sans-serif",
            outline: "none",
          }}
        >
          <option value="">Selecione a UF...</option>
          {UF_LIST.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <button
          onClick={buscar}
          disabled={loading || !uf}
          style={{
            background: !uf || loading ? t.surfaceAlt : t.accent,
            color: !uf || loading ? t.muted : "#080d18",
            border: "none",
            borderRadius: 11,
            padding: "0 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: !uf || loading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s",
            minWidth: 80,
          }}
        >
          {loading ? <Spinner /> : "Buscar"}
        </button>
      </div>

      {error && <ErrorBox msg={error} />}

      {lista.length > 0 && (
        <div style={{ animation: "fadeUp 0.4s ease" }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: t.muted }}>
            {lista.length} cidade{lista.length !== 1 ? "s" : ""} em{" "}
            <strong style={{ color: t.accent }}>{uf}</strong>
          </p>
          <div
            style={{
              background: t.surface,
              border: `0.5px solid ${t.border}`,
              borderRadius: 12,
              overflow: "hidden",
              maxHeight: 340,
              overflowY: "auto",
            }}
          >
            {lista.map((c, i) => {
              const nome =
                typeof c === "string" ? c : c.nome ?? c.cidade ?? String(c);
              const id = typeof c === "object" ? c.id : null;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 14px",
                    borderBottom:
                      i < lista.length - 1 ? `0.5px solid ${t.border}` : "none",
                    fontSize: 13,
                    color: t.text,
                  }}
                >
                  <span>{nome}</span>
                  {id && (
                    <span style={{ fontSize: 11, color: t.dim }}>#{id}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!result && !error && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 1rem",
            color: t.dim,
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>🗺️</div>
          Selecione um estado para listar as cidades disponíveis.
        </div>
      )}
    </div>
  );
}

// ─── Tab: Health ──────────────────────────────────────────────────────
function TabHealth() {
  const [loading, setLoad] = useState(false);
  const [result, setResult] = useState(null);

  const check = useCallback(async () => {
    setLoad(true);
    setResult(null);
    const res = await apiHealth();
    setLoad(false);
    setResult(res);
  }, []);

  const ok = result && !result.erro;
  const campos = result ? Object.entries(result) : [];

  return (
    <div>
      <button
        onClick={check}
        disabled={loading}
        style={{
          width: "100%",
          background: loading ? t.surfaceAlt : t.green,
          color: loading ? t.muted : "#080d18",
          border: "none",
          borderRadius: 11,
          padding: "11px",
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: "1.25rem",
          transition: "background 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <>
            <Spinner /> Verificando…
          </>
        ) : (
          "Verificar servidor"
        )}
      </button>

      {result && (
        <div
          style={{
            background: ok ? t.greenBg : t.dangerBg,
            border: `0.5px solid ${ok ? t.green : t.danger}44`,
            borderRadius: 12,
            padding: "14px 16px",
            animation: "fadeUp 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: ok ? 12 : 0,
            }}
          >
            <span style={{ fontSize: 20 }}>{ok ? "✅" : "❌"}</span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: ok ? t.green : t.danger,
              }}
            >
              {ok ? "Servidor online" : "Servidor offline"}
            </span>
          </div>
          {ok && (
            <div
              style={{
                background: t.surfaceAlt,
                borderRadius: 8,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {campos.map(([chave, valor]) => (
                <div
                  key={chave}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: t.dim,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {chave}
                  </span>
                  <span
                    style={{ fontSize: 12, color: t.muted, fontWeight: 500 }}
                  >
                    {String(valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {!ok && (
            <p style={{ margin: "6px 0 0", fontSize: 12, color: t.danger }}>
              Certifique-se de que o uvicorn está rodando:
              <br />
              <code style={{ opacity: 0.8 }}>
                python -m uvicorn src.main:app --port 3000 --reload
              </code>
            </p>
          )}
        </div>
      )}

      {!result && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem 1rem",
            color: t.dim,
            fontSize: 13,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔌</div>
          Clique para checar se a API está respondendo.
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "clima", label: "☁️  Clima", Component: TabClima },
  { id: "cidades", label: "🗺️  Cidades", Component: TabCidades },
  { id: "health", label: "🔌  Health", Component: TabHealth },
];

export default function ClimaApp() {
  const [tab, setTab] = useState("clima");
  const Active = TABS.find((x) => x.id === tab).Component;

  return (
    <div>
      <style>{`
        @keyframes dot {
          0%,80%,100% { transform: translateY(0); opacity: .5; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: ${t.bg}; }
        input::placeholder { color: ${t.dim}; }
        select option { background: ${t.surface}; color: ${t.text}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.dim}; border-radius: 4px; }
      `}</style>
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex",
        alignItems: "flex-start", justifyContent: "center",
        padding: "2.5rem 1rem", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 430 }}>
          <div style={{ marginBottom: "1.75rem" }}>
            <h1 style={{ margin: "0 0 3px", fontSize: 26,
              fontFamily: "'DM Serif Display', serif",
              fontWeight: 400, color: t.text, letterSpacing: "-0.02em" }}>
              Relatório Climático
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: t.muted }}>
              <span style={{ color: t.accent, fontWeight: 500 }}>localhost:3000</span>
              {" "}· BrasilAPI / CPTEC
            </p>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem",
            background: t.surface, border: `0.5px solid ${t.border}`,
            borderRadius: 11, padding: 4 }}>
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, background: tab === id ? t.accent : "transparent",
                color: tab === id ? "#080d18" : t.muted,
                border: "none", borderRadius: 8, padding: "7px 4px",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s", whiteSpace: "nowrap" }}>
                {label}
              </button>
            ))}
          </div>
          <Active />
        </div>
      </div>
    </div>
  );
}

