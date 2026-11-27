import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cases, TOTAL_TODAY } from "./data";
import Queue from "./components/Queue";
import Detail from "./components/Detail";
import DetailOld from "./components/DetailOld";
import Resolved from "./components/Resolved";
import QueueClear from "./components/QueueClear";
import FocusSheet from "./components/FocusSheet";
import { ResetIcon } from "./components/Icons";

const KEY = "review-queue-v1";
const OPEN_FIRST = "FD-48236";
// ?pane=old shows the earlier single column pane, to compare.
const OLD_PANE = new URLSearchParams(window.location.search).get("pane") === "old";

const PROMPTS = {
  approval: "Tell the agent how to change this refund",
  input: "Answer the agent",
  failed: "Tell the agent how to fix this",
};

const byId = Object.fromEntries(cases.map((c) => [c.id, c]));

// Least time left first, so the top of the list is always the next thing to do.
// Time left drives the order but is not shown.
const sorted = [...cases].sort((a, b) => a.sla - b.sla || b.age - a.age);

const fresh = () => ({
  resolved: {},
  progress: {},
  notes: {},
  view: "open",
  filter: "all",
  selectedId: OPEN_FIRST,
});

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (!s) return fresh();
    const resolved = Object.fromEntries(
      Object.entries(s.resolved ?? {}).filter(([id]) => byId[id])
    );
    // A check that was mid flight when the page closed starts over.
    const progress = Object.fromEntries(
      Object.entries(s.progress ?? {}).map(([id, p]) => [id, p === "checking" ? "idle" : p])
    );
    return { ...fresh(), ...s, resolved, progress };
  } catch {
    return fresh();
  }
}

export default function App() {
  const [s, setS] = useState(load);
  const [showDetail, setShowDetail] = useState(false);
  // The toast stays mounted after it closes so it can leave the way it came.
  const [toast, setToast] = useState(null);
  // The last resolve or undo. It drives the only list and pane motion, and any other
  // move (a click, j or k, a filter) clears it so selection stays instant.
  const [act, setAct] = useState(null);
  // The focus sheet: open, and the point it grows from. The trigger gets focus back on close.
  const [focus, setFocus] = useState({ open: false, origin: null });
  const trigger = useRef(null);

  const patch = useCallback(
    (p) => setS((prev) => ({ ...prev, ...(typeof p === "function" ? p(prev) : p) })),
    []
  );

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      // Storage can be unavailable. The prototype still works for the session.
    }
  }, [s]);

  const open = useMemo(() => sorted.filter((c) => !s.resolved[c.id]), [s.resolved]);
  const items = useMemo(
    () => open.filter((c) => s.filter === "all" || c.state === s.filter),
    [open, s.filter]
  );
  const done = useMemo(
    () =>
      Object.entries(s.resolved)
        .sort((a, b) => b[1].at - a[1].at)
        .map(([id, rec]) => ({ c: byId[id], rec })),
    [s.resolved]
  );
  const list = useMemo(
    () => (s.view === "open" ? items.map((c) => ({ c })) : done),
    [s.view, items, done]
  );
  const selected = list.find((x) => x.c.id === s.selectedId) ?? null;

  const counts = {
    all: open.length,
    approval: open.filter((c) => c.state === "approval").length,
    input: open.filter((c) => c.state === "input").length,
    failed: open.filter((c) => c.state === "failed").length,
  };

  // Keep something selected whenever the list has something in it.
  useEffect(() => {
    if (!selected && list.length) patch({ selectedId: list[0].c.id });
  }, [selected, list, patch]);

  const select = useCallback(
    (id) => {
      setAct(null);
      patch({ selectedId: id });
      setShowDetail(true);
    },
    [patch]
  );

  const resolve = useCallback(
    (id, outcome, detail) => {
      const i = items.findIndex((c) => c.id === id);
      let next = items[i + 1] ?? items[i - 1] ?? null;
      let filter = s.filter;
      if (!next) {
        // Nothing left in this filter, so move on to whatever else is open.
        next = open.find((c) => c.id !== id) ?? null;
        if (next) filter = "all";
      }
      patch((prev) => ({
        resolved: {
          ...prev.resolved,
          [id]: {
            outcome,
            detail: { ...detail, notes: prev.notes?.[id] },
            kind: byId[id].state,
            at: Date.now(),
          },
        },
        selectedId: next ? next.id : null,
        filter,
      }));
      setAct({ kind: "resolve", id, at: Date.now() });
      setShowDetail(false);
      setToast({ id, text: outcome, open: true });
    },
    [items, open, s.filter, patch]
  );

  const reopen = useCallback(
    (id) => {
      patch((prev) => {
        const { [id]: _gone, ...rest } = prev.resolved;
        return { resolved: rest, view: "open", filter: "all", selectedId: id };
      });
      setAct(null);
      setToast((t) => t && { ...t, open: false });
      setShowDetail(true);
    },
    [patch]
  );

  const undo = useCallback(() => {
    if (!toast?.open) return;
    if (toast.kind === "note") {
      patch((prev) => ({
        notes: { ...prev.notes, [toast.id]: (prev.notes?.[toast.id] ?? []).slice(0, -1) },
      }));
      setToast((t) => t && { ...t, open: false });
      return;
    }
    patch((prev) => {
      const { [toast.id]: _gone, ...rest } = prev.resolved;
      const back = byId[toast.id];
      const filter = prev.filter !== "all" && prev.filter !== back.state ? "all" : prev.filter;
      return { resolved: rest, view: "open", filter, selectedId: toast.id };
    });
    setAct({ kind: "undo", id: toast.id, at: Date.now() });
    setToast((t) => t && { ...t, open: false });
  }, [toast, patch]);

  // The prompt pill. On a case that needs input the text is the answer and resolves it, the
  // same as a note sent from the card. On other cases it is kept as an instruction for the
  // agent and recorded when the case resolves.
  const tellAgent = useCallback(
    (id, text) => {
      if (byId[id].state === "input") {
        resolve(id, "Answer sent to the agent", { kind: "input", choice: null, note: text });
        return;
      }
      patch((prev) => ({
        notes: { ...prev.notes, [id]: [...(prev.notes?.[id] ?? []), text] },
      }));
      setToast({ id, text: "Sent to the agent", open: true, kind: "note" });
    },
    [resolve, patch]
  );

  const runCheck = useCallback(
    (id) => {
      patch((prev) => ({ progress: { ...prev.progress, [id]: "checking" } }));
      setTimeout(
        () => patch((prev) => ({ progress: { ...prev.progress, [id]: "confirmed" } })),
        1400
      );
    },
    [patch]
  );

  const reset = useCallback(() => {
    setS(fresh());
    setAct(null);
    setToast((t) => t && { ...t, open: false });
    setShowDetail(false);
  }, []);

  useEffect(() => {
    if (!toast?.open) return;
    const t = setTimeout(() => setToast((x) => x && { ...x, open: false }), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      const down = e.key === "j" || e.key === "ArrowDown";
      const up = e.key === "k" || e.key === "ArrowUp";
      if (!down && !up) return;
      e.preventDefault();
      const i = list.findIndex((x) => x.c.id === s.selectedId);
      const next = list[down ? Math.min(i + 1, list.length - 1) : Math.max(i - 1, 0)];
      if (next) {
        setAct(null);
        patch({ selectedId: next.c.id });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list, s.selectedId, patch]);

  // Feather a scroll edge only while there is content beyond it. The attribute changes
  // only when the answer changes, so scrolling does not restyle every frame.
  useEffect(() => {
    function fade(el) {
      const top = el.scrollTop > 1;
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 1;
      const v = top && bottom ? "both" : top ? "top" : bottom ? "bottom" : "";
      if ((el.dataset.fade ?? "") !== v) {
        if (v) el.dataset.fade = v;
        else delete el.dataset.fade;
      }
    }
    const all = () => document.querySelectorAll(".rows, .detail-scroll").forEach(fade);
    const onScroll = (e) => {
      if (e.target.matches?.(".rows, .detail-scroll")) fade(e.target);
    };
    all();
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", all);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", all);
    };
  });

  useEffect(() => {
    if (!s.selectedId) return;
    document
      .querySelector(`[data-id="${s.selectedId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [s.selectedId, s.view]);

  const at = selected ? list.findIndex((x) => x.c.id === selected.c.id) : -1;
  const step = { prev: at > 0, next: at > -1 && at < list.length - 1 };
  const onStep = useCallback(
    (dir) => {
      const next = list[at + dir];
      if (!next) return;
      setAct(null);
      patch({ selectedId: next.c.id });
    },
    [list, at, patch]
  );

  const openFocus = useCallback((el) => {
    const r = el.getBoundingClientRect();
    trigger.current = el;
    setFocus({ open: true, origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
  }, []);
  const closeFocus = useCallback(() => {
    setFocus((f) => ({ ...f, open: false }));
    requestAnimationFrame(() =>
      (trigger.current?.isConnected ? trigger.current : document.querySelector(".focus-open"))?.focus()
    );
  }, []);

  // Nothing left to focus on: close the sheet.
  useEffect(() => {
    if (focus.open && !selected) closeFocus();
  }, [focus.open, selected, closeFocus]);

  useEffect(() => {
    document.body.style.overflow = focus.open ? "hidden" : "";
  }, [focus.open]);

  // The pane slides forward to the next case after a resolve, and back after an undo.
  const enter =
    act && selected
      ? act.kind === "undo" && act.id === selected.c.id
        ? "back"
        : act.kind === "resolve"
          ? "forward"
          : null
      : null;

  let pane;
  if (!selected) {
    pane =
      s.view === "open" && !open.length ? (
        <QueueClear play={act?.kind === "resolve"} />
      ) : (
        <div className="detail empty">
          <p>{s.view === "resolved" ? "Nothing resolved yet" : "Nothing here"}</p>
        </div>
      );
  } else if (s.view === "open") {
    const Pane = OLD_PANE ? DetailOld : Detail;
    pane = (
      <Pane
        key={selected.c.id}
        onStep={onStep}
        step={step}
        onFocus={OLD_PANE ? undefined : openFocus}
        c={selected.c}
        enter={enter}
        phase={s.progress[selected.c.id]}
        onCheck={runCheck}
        onResolve={resolve}
        onBack={() => setShowDetail(false)}
      />
    );
  } else {
    pane = (
      <Resolved
        key={selected.c.id}
        c={selected.c}
        rec={selected.rec}
        onReopen={reopen}
        onBack={() => setShowDetail(false)}
      />
    );
  }

  let sheet = null;
  if (selected && !OLD_PANE) {
    sheet =
      s.view === "open" ? (
        <Detail
          key={selected.c.id}
          scope="focus-"
          c={selected.c}
          phase={s.progress[selected.c.id]}
          onCheck={runCheck}
          onResolve={resolve}
          onBack={closeFocus}
          onStep={onStep}
          step={step}
        />
      ) : (
        <Resolved key={selected.c.id} c={selected.c} rec={selected.rec} onReopen={reopen} onBack={closeFocus} />
      );
  }

  const cls = ["app", showDetail && "show-detail", !selected && "is-empty"]
    .filter(Boolean)
    .join(" ");

  return (
    <>
    <div className={cls} inert={focus.open}>
      <header className="top">
        <h1 className="brand">Review queue</h1>
        <p className="stats">
          <span className="stat">
            <span className="stat-n num">{open.length}</span> of{" "}
            <span className="num">{TOTAL_TODAY.toLocaleString("en-US")}</span> need you
          </span>
          <button type="button" className="reset" onClick={reset} aria-label="Reset demo">
            <ResetIcon />
          </button>
        </p>
      </header>

      <Queue
        list={list}
        act={act}
        view={s.view}
        onView={(view) => {
          setAct(null);
          patch({ view });
        }}
        counts={counts}
        doneCount={done.length}
        filter={s.filter}
        onFilter={(filter) => {
          setAct(null);
          patch({ filter });
        }}
        selectedId={s.selectedId}
        onSelect={select}
      />

      {pane}

    </div>

    <FocusSheet
      open={focus.open}
      origin={focus.origin}
      onClose={closeFocus}
      prompt={
        selected && s.view === "open"
          ? {
              key: selected.c.id,
              placeholder: PROMPTS[selected.c.state],
              onSend: (text) => tellAgent(selected.c.id, text),
            }
          : null
      }
    >
      {sheet}
    </FocusSheet>

    {toast && (
      <div className="toast" role="status" data-open={toast.open}>
        <span className="toast-text">{toast.text}</span>
        <button type="button" onClick={undo} tabIndex={toast.open ? 0 : -1}>
          Undo
        </button>
      </div>
    )}
    </>
  );
}
