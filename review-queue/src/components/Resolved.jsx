import { CaseHead } from "./Detail";
import { StateIcon } from "./Icons";
import { clock, money } from "../format";

function Chip({ s }) {
  return (
    <span className="chip">
      <StateIcon state={s.state} />
      {s.text}
    </span>
  );
}

function rowsFor(d) {
  const told = d.notes?.length
    ? [
        [
          "Told the agent",
          <ul key="told" className="next">
            {d.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>,
        ],
      ]
    : [];
  return [...decisionRows(d), ...told];
}

function decisionRows(d) {
  if (d.kind === "approval" && d.approved) {
    return [
      ["Decision", d.edited ? "Approved with edits" : "Approved"],
      ["Refund", money(d.amount)],
      ...(d.edited && d.proposed !== d.amount ? [["Agent proposed", money(d.proposed)]] : []),
      ["To", d.to],
    ];
  }
  if (d.kind === "approval") {
    return [
      ["Decision", "Rejected"],
      ["Agent next", "Closes the case with the standard reply"],
    ];
  }
  if (d.kind === "input") {
    return [
      ["Your choice", d.choice ?? "No option, note only"],
      ...(d.note ? [["Your note", d.note]] : []),
      ...(d.next
        ? [
            [
              "Agent next",
              <ul key="next" className="next">
                {d.next.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>,
            ],
          ]
        : []),
    ];
  }
  if (d.kind === "failed") {
    return [["Action", d.action], ...(d.status ? [["Payment status", d.status]] : [])];
  }
  return [];
}

export default function Resolved({ c, rec, onReopen, onBack }) {
  const d = rec.detail ?? {};
  return (
    <article className="detail case">
      <div className="detail-scroll">
        <div className="detail-inner">
          <CaseHead
            c={c}
            title={rec.outcome}
            time={`Resolved ${clock(rec.at)}`}
            onBack={() => onBack()}
          />

          <div className="case-grid">
            <div className="case-col">
              <section className="rec" aria-label="What you decided">
                <div className="card">
                  <dl className="kv">
                    {rowsFor(d).map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="bar">
                  <button type="button" className="btn quiet" onClick={() => onReopen(c.id)}>
                    Reopen
                  </button>
                </div>
              </section>
            </div>
            <div className="case-col">
              {d.message && (
                <section className="card">
                  <h3 className="card-title">Message</h3>
                  <p className="sent">{d.message}</p>
                </section>
              )}
              {d.log && (
                <section className="card">
                  <h3 className="card-title">Activity</h3>
                  <ol className="log">
                    {d.log.map((e, i) => (
                      <li key={i} className="log-item">
                        <span className="log-time num">{e.time}</span>
                        <span className="log-text">
                          {e.change ? (
                            <>
                              {e.change.label} changed from <Chip s={e.change.from} /> to{" "}
                              <Chip s={e.change.to} />
                            </>
                          ) : (
                            e.text
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
