import { useRef, useState } from "react";
import { ChevronLeft, RadioMark, StateIcon } from "./Icons";
import { money } from "../format";

const cents = (n) => Math.round(n * 100);

function Chip({ s }) {
  return (
    <span className="chip">
      <StateIcon state={s.state} />
      {s.text}
    </span>
  );
}

// Rows from `from` on arrived after a press in this view, so they fade in; earlier rows sit still.
function Activity({ log, from = Infinity }) {
  return (
    <ol className="log">
      {log.map((e, i) => (
        <li key={i} className={i >= from ? "log-item arrive" : "log-item"}>
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
  );
}

export default function DetailOld({ c, enter, phase = "idle", onCheck, onResolve, onBack }) {
  const a = c.approval;
  const f = c.failed;
  const chk = f?.check;
  const options = c.input
    ? c.input.options.map((o) => (typeof o === "string" ? { label: o } : o))
    : [];

  const [amount, setAmount] = useState(a ? a.amount.toFixed(2) : "");
  const [message, setMessage] = useState(a ? a.message : "");
  const [choice, setChoice] = useState(null);
  const [note, setNote] = useState("");
  // The amount text currently written into the drafted message.
  const embedded = useRef(a ? money(a.amount) : "");
  // The check phase this view opened with. Only changes after that animate.
  const openedAt = useRef(phase);
  const moved = phase !== openedAt.current;

  const amt = Number(amount);
  const typed = amount.trim() !== "" && Number.isFinite(amt) && amt > 0;
  const overTotal = typed && c.total != null && cents(amt) > cents(c.total);
  const amountOk = typed && !overTotal && Math.abs(amt * 100 - cents(amt)) < 1e-6;
  const edited = !!a && amountOk && (cents(amt) !== cents(a.amount) || message !== a.message);
  const approveReady = amountOk && message.trim() !== "";

  const checking = phase === "checking";
  const confirmed = phase === "confirmed";
  const log = c.log
    ? [
        ...c.log,
        ...(chk && phase !== "idle" ? [chk.started] : []),
        ...(chk && confirmed ? chk.result : []),
      ]
    : null;

  // Where the rows added by this view's check begin.
  const logFrom = c.log
    ? c.log.length + (chk && openedAt.current !== "idle" ? 1 : 0) +
      (chk && openedAt.current === "confirmed" ? chk.result.length : 0)
    : Infinity;

  function changeAmount(value) {
    setAmount(value);
    const n = Number(value);
    if (value.trim() === "" || !Number.isFinite(n) || n <= 0) return;
    const next = money(n);
    if (next !== embedded.current && message.includes(embedded.current)) {
      setMessage(message.split(embedded.current).join(next));
      embedded.current = next;
    }
  }

  function approve() {
    onResolve(c.id, `${money(amt)} refund approved${edited ? " with edits" : ""}`, {
      kind: "approval",
      approved: true,
      amount: amt,
      proposed: a.amount,
      to: a.to,
      audience: a.audience,
      message,
      edited,
    });
  }

  function send() {
    const opt = options.find((o) => o.label === choice);
    onResolve(c.id, opt?.next ? `${choice} sent to the agent` : "Answer sent to the agent", {
      kind: "input",
      choice,
      note: note.trim(),
      next: opt?.next,
    });
  }

  const approveLabel = amountOk ? `Approve ${money(amt)}` : "Approve";

  return (
    <article className={enter ? `detail enter-${enter}` : "detail"}>
      <div className="detail-scroll">
        <div className="detail-inner">
          <button type="button" className="back" onClick={onBack} aria-label="Back to the queue">
            <ChevronLeft />
          </button>

          <h2 className="decision">{c.decision}</h2>
          <p className="meta">
            <span className="meta-strong">{c.who}</span>
            <span className="num">#{c.order}</span>
            {c.total != null && <span className="num">{money(c.total)} total</span>}
            </p>

          <section className="q">
            <h3 className="sr-only">What happened</h3>
            <p className="body">{c.summary}</p>
          </section>

          <section className="q">
            <h3 className="sr-only">Why you</h3>
            <p className="why">
              <StateIcon state={c.state} />
              <span>{c.why}</span>
            </p>
          </section>

          <section className="q q-act">
            <h3 className="sr-only">What you can do</h3>
            <div className="act">
              <div className="act-main">
                {a && (
                  <>
                    <p className="proposal">{a.summary}</p>
                    <div className="field-row">
                      <div className="field">
                        <label className="label" htmlFor={`amount-${c.id}`}>
                          Amount
                        </label>
                        <span className="control money">
                          <span aria-hidden="true">$</span>
                          <input
                            id={`amount-${c.id}`}
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => changeAmount(e.target.value)}
                            aria-invalid={!amountOk}
                          />
                        </span>
                        {overTotal && (
                          <span className="hint error">Over the {money(c.total)} order</span>
                        )}
                        {amountOk && cents(amt) !== cents(a.amount) && (
                          <span className="hint">Proposed {money(a.amount)}</span>
                        )}
                      </div>
                      <div className="field">
                        <span className="label">To</span>
                        <span className="control static">{a.to}</span>
                      </div>
                    </div>
                    <label className="field">
                      <span className="label">Message</span>
                      <textarea
                        className="control area"
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </label>
                    <div className="buttons joined">
                      <button
                        type="button"
                        className="btn primary"
                        disabled={!approveReady}
                        onClick={approve}
                      >
                        {approveLabel}
                      </button>
                      <button
                        type="button"
                        className="btn quiet"
                        onClick={() =>
                          onResolve(c.id, "Rejected, the agent will close the case", {
                            kind: "approval",
                            approved: false,
                          })
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </>
                )}

                {c.input && (
                  <>
                    <div className="options" role="radiogroup" aria-label={c.decision}>
                      {options.map((o) => (
                        <button
                          key={o.label}
                          type="button"
                          role="radio"
                          aria-checked={choice === o.label}
                          className="option"
                          onClick={() => setChoice(o.label)}
                        >
                          <RadioMark on={choice === o.label} />
                          <span className="option-body">
                            <span className="option-label">{o.label}</span>
                            {o.next && (
                              <ul className="next">
                                {o.next.map((step) => (
                                  <li key={step}>{step}</li>
                                ))}
                              </ul>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                    <label className="field">
                      <span className="label">Note</span>
                      <textarea
                        className="control area"
                        rows={3}
                        placeholder={c.input.placeholder}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </label>
                    <div className="buttons joined">
                      <button
                        type="button"
                        className="btn primary"
                        disabled={!choice && !note.trim()}
                        onClick={send}
                      >
                        Send
                      </button>
                    </div>
                  </>
                )}

                {f && (
                  <>
                    <p className="body">
                      <span className="strong">{f.step}.</span>{" "}
                      <span key={confirmed ? "done" : "error"} className={moved ? "arrive-text" : undefined}>
                        {confirmed ? chk.done : f.error}
                      </span>
                    </p>
                    {chk && (
                      <p className="pay">
                        <span className="label">Payment status</span>
                        <span className="pay-status">
                          <StateIcon
                            key={confirmed ? "approval" : "input"}
                            state={confirmed ? "approval" : "input"}
                            swap={moved && confirmed}
                          />
                          {confirmed ? "Refunded" : "Unknown"}
                        </span>
                      </p>
                    )}
                    <div className="buttons joined">
                      {chk && confirmed ? (
                        <button
                          type="button"
                          className="btn primary"
                          onClick={() =>
                            onResolve(c.id, chk.outcome, {
                              kind: "failed",
                              action: `${chk.label}, then closed`,
                              status: "Refunded",
                              log,
                            })
                          }
                        >
                          {chk.closeLabel}
                        </button>
                      ) : (
                        <>
                          {chk && (
                            <button
                              type="button"
                              className="btn primary"
                              disabled={checking}
                              onClick={() => onCheck(c.id)}
                            >
                              {checking ? "Checking" : chk.label}
                            </button>
                          )}
                          {f.fixes.map((x) => (
                            <button
                              key={x.label}
                              type="button"
                              className={x.primary ? "btn primary" : "btn quiet"}
                              disabled={checking}
                              onClick={() =>
                                onResolve(c.id, `${x.label}, the agent is on it`, {
                                  kind: "failed",
                                  action: x.label,
                                })
                              }
                            >
                              {x.label}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              <aside className="evidence" aria-label="Evidence">
                {c.compare && (
                  <>
                    <h4 className="sr-only">Addresses</h4>
                    <div className="compare">
                      {[c.compare.left, c.compare.right].map((s) => (
                        <div key={s.label} className="compare-side">
                          <span className="compare-label">{s.label}</span>
                          <span className="compare-value">{s.value}</span>
                          <span className="compare-note">{s.note}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {c.receipt && (
                  <>
                    <h4 className="sr-only">Receipt</h4>
                    <ul className="receipt">
                      {c.receipt.map((l) => (
                        <li key={l.name} className={l.missing ? "line missing" : "line"}>
                          <span className="line-name">
                            {l.name}
                            {l.missing && <span className="line-flag">Missing</span>}
                          </span>
                          <span className="num">{money(l.price)}</span>
                        </li>
                      ))}
                      <li className="line total">
                        <span>Total</span>
                        <span className="num">{money(c.total)}</span>
                      </li>
                    </ul>
                  </>
                )}
                <h4 className="sr-only">Evidence</h4>
                <dl className="facts">
                  {c.facts.map(([k, v]) => (
                    <div key={k} className="fact">
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
                {log && (
                  <>
                    <h4 className="sr-only">Activity</h4>
                    <Activity log={log} from={moved ? logFrom : Infinity} />
                  </>
                )}
              </aside>
            </div>
          </section>
        </div>
      </div>
    </article>
  );
}
