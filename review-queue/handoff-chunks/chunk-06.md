Handoff chunk 6 of 11: food delivery review queue (Vite, React 19, plain CSS).
Same rules: "Create" writes the file exactly as given, "Append" adds to the end of that file on a new line. Do not run anything yet.

Create src/components/Detail.jsx:

```jsx
import { useRef, useState } from "react";
import { ChevronLeft, Mark, RadioMark, StateIcon } from "./Icons";
import Avatar from "./Avatar";
import { STATES } from "../data";
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

// Rows from `from` on arrived after a press in this view, so they rise in; earlier rows sit still.
function Timeline({ log, from = Infinity }) {
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

// Shared by the open and resolved case: question, state, time, then key facts with the
// reason a person is needed docked under them.
export function CaseHead({ c, title, pill, time, onBack, onStep, step, onFocus }) {
  return (
    <>
      <header className="case-head">
        <button type="button" className="back" onClick={onBack} aria-label="Back to the queue">
          <ChevronLeft />
        </button>
        <h2 className="decision">{title}</h2>
        <div className="case-tools">
          {pill}
          {time && <span className="pill-time num">{time}</span>}
          {onFocus && (
            <button
              type="button"
              className="step focus-open"
              aria-label="Open in focus"
              onClick={(e) => onFocus(e.currentTarget)}
            >
              <Mark glyph="expand" size={24} />
            </button>
          )}
          {onStep && (
            <span className="steps">
              <button
                type="button"
                className="step"
                aria-label="Previous case"
                disabled={!step.prev}
                onClick={() => onStep(-1)}
              >
                <Mark glyph="up" size={24} />
              </button>
              <button
                type="button"
                className="step"
                aria-label="Next case"
                disabled={!step.next}
                onClick={() => onStep(1)}
              >
                <Mark glyph="down" size={24} />
              </button>
            </span>
          )}
        </div>
        <p className="case-sub">{c.summary}</p>
      </header>

      <div className="case-stack">
        <dl className="facts-strip">
          <div className="cell">
            <dt className="cell-label">{c.restaurant ? "Contact" : "Restaurant"}</dt>
            <dd className="cell-value">
              <Avatar name={c.who} />
              <span>{c.who}</span>
            </dd>
          </div>
          {c.restaurant && (
            <div className="cell">
              <dt className="cell-label">Restaurant</dt>
              <dd className="cell-value">
                <span>{c.restaurant}</span>
              </dd>
            </div>
          )}
          <div className="cell">
            <dt className="cell-label">Order</dt>
            <dd className="cell-value num">
              <span>#{c.order}</span>
            </dd>
          </div>
          {c.total != null && (
            <div className="cell">
              <dt className="cell-label">Total</dt>
              <dd className="cell-value num">
                <span>{money(c.total)}</span>
              </dd>
            </div>
          )}
        </dl>
        <p className={`callout tone-${c.state}`}>
          <StateIcon state={c.state} size={20} />
          <span>
            <span className="sr-only">Why you: </span>
            {c.why}
          </span>
        </p>
      </div>
    </>
  );
}

export default function Detail({
  c,
  enter,
  phase = "idle",
  onCheck,
  onResolve,
  onBack,
  onStep,
  step,
  onFocus,
  scope = "",
}) {
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
    ? c.log.length +
      (chk && openedAt.current !== "idle" ? 1 : 0) +
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

  return (
    <article className={enter ? `detail case enter-${enter}` : "detail case"}>
      <div className="detail-scroll">
        <div className="detail-inner">
          <CaseHead
            c={c}
            title={c.decision}
            pill={
              <span className={`pill-state tone-${c.state}`}>{STATES[c.state].label}</span>
            }
            onBack={onBack}
            onStep={onStep}
            step={step}
            onFocus={onFocus}
          />

          <div className="case-grid">
            <div className="case-col">
              <section className="rec" aria-label="What you can do">
                <div className="card">
                  {a && (
                    <>
                      <h3 className="rec-title agent-voice">{a.summary}</h3>
                      <div className="field-row">
                        <div className="field">
                          <label className="label" htmlFor={`amount-${scope}${c.id}`}>
                            Amount
                          </label>
                          <span className="control money">
                            <span aria-hidden="true">$</span>
                            <input
                              id={`amount-${scope}${c.id}`}
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
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                        />
                      </label>
                    </>
                  )}

                  {c.input && (
                    <>
                      <h3 className="rec-title">Your answer</h3>
                      <div
                        className="options field"
                        role="radiogroup"
                        aria-label={c.decision}
                      >
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
                                  {o.next.map((s) => (
                                    <li key={s}>{s}</li>
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
                    </>
                  )}

                  {f && (
                    <>
                      <h3 className="rec-title">{f.step}</h3>
                      <p
                        key={confirmed ? "done" : "error"}
                        className={moved ? "rec-note arrive-text" : "rec-note"}
                      >
                        {confirmed ? chk.done : f.error}
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
                    </>
                  )}
                </div>

                <div className="bar">
                  {a && (
                    <>
                      <button
                        type="button"
                        className="btn primary"
                        disabled={!approveReady}
                        onClick={approve}
                      >
                        {amountOk ? `Approve ${money(amt)}` : "Approve"}
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
                    </>
                  )}
                  {c.input && (
                    <button
                      type="button"
                      className="btn primary"
                      disabled={!choice && !note.trim()}
                      onClick={send}
                    >
                      Send
                    </button>
                  )}
                  {f &&
                    (chk && confirmed ? (
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
                    ))}
                </div>
              </section>
            </div>

            <div className="case-col" aria-label="Evidence">
              {c.compare && (
                <section className="card">
                  <h3 className="card-title">Addresses</h3>
                  <div className="compare">
                    {[c.compare.left, c.compare.right].map((s) => (
                      <div key={s.label} className="compare-side">
                        <span className="compare-label">{s.label}</span>
                        <span className="compare-value">{s.value}</span>
                        <span className="compare-note">{s.note}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {c.receipt && (
                <section className="card">
                  <h3 className="card-title">Receipt</h3>
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
                </section>
              )}
              <section className="card">
                <h3 className="card-title">Details</h3>
                <dl className="kv">
                  {c.facts.map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              {log && (
                <section className="card">
                  <h3 className="card-title">Activity</h3>
                  <Timeline log={log} from={moved ? logFrom : Infinity} />
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
```
