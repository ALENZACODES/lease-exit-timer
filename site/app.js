const kindEl = document.getElementById("kind");
const resultEl = document.getElementById("result");
const draftEl = document.getElementById("draft");
const copyStatus = document.getElementById("copy-status");
let rules = null;

function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year").value;
  const m = parts.find((p) => p.type === "month").value;
  const d = parts.find((p) => p.type === "day").value;
  return `${y}-${m}-${d}`;
}

function pretty(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

function toggleRows() {
  const k = kindEl.value;
  document.getElementById("monthly-row").hidden = k !== "monthly";
  document.getElementById("fixed-row").hidden = k !== "fixed";
  document.getElementById("weekly-row").hidden = k !== "weekly";
}

function draftText(out) {
  const landlord = document.getElementById("landlord").value.trim() || "[landlord name]";
  const tenant = document.getElementById("tenant").value.trim() || "[tenant name]";
  const unit = document.getElementById("unit").value.trim() || "[rental unit address]";
  if (!out || !out.valid) {
    return "No draft yet. Ordinary notice is not available for the dates entered, or a field is missing.";
  }
  return (
    `To: ${landlord}\n` +
    `From: ${tenant}\n` +
    `Address of the rental unit: ${unit}\n\n` +
    `I am giving notice because I want to move out of the rental unit.\n` +
    `The last day of my tenancy will be ${pretty(out.termination)}. This is the termination date.\n` +
    `I will move out of the rental unit on or before the termination date.\n\n` +
    `I will also complete official Form N9 (Tenant's Notice to End the Tenancy) from Tribunals Ontario and give you that form.\n` +
    `The form is at https://tribunalsontario.ca/documents/ltb/Notices%20of%20Termination%20%26%20Instructions/N9.pdf\n\n` +
    `This note is a courtesy copy. The official Board form is the notice.`
  );
}

function render(out) {
  if (out.error) {
    resultEl.innerHTML = `<p>${out.error}</p>`;
    draftEl.textContent = "";
    return;
  }
  const bits = [];
  if (out.valid) {
    bits.push(`<p>If you give notice on <strong>${pretty(out.notice)}</strong>, the earliest ordinary termination date this page can support is <strong>${pretty(out.termination)}</strong>.</p>`);
    bits.push(`<p>The last day to give ordinary notice for that termination date is <strong>${pretty(out.lastNoticeDay)}</strong>.</p>`);
  } else {
    bits.push(`<p>Ordinary notice does not reach a valid termination date for the expiry you entered.</p>`);
  }
  bits.push(`<p>${out.message}</p>`);
  resultEl.innerHTML = bits.join("");
  draftEl.textContent = draftText(out);
}

function run() {
  const out = window.LeaseDates.compute({
    noticeDate: document.getElementById("notice").value,
    kind: kindEl.value,
    dueDay: document.getElementById("due").value,
    expiryDate: document.getElementById("expiry").value,
    payWeekday: document.getElementById("payday").value
  });
  render(out);
}

async function init() {
  document.getElementById("notice").value = todayISO();
  kindEl.addEventListener("change", toggleRows);
  document.getElementById("run").addEventListener("click", run);
  ["notice", "kind", "due", "expiry", "payday", "landlord", "tenant", "unit"].forEach((id) => {
    document.getElementById(id).addEventListener("change", run);
  });
  document.getElementById("copy-draft").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(draftEl.textContent || "");
      copyStatus.textContent = "Draft copied.";
    } catch (err) {
      copyStatus.textContent = "Copy failed. Select the draft and copy it yourself.";
    }
  });
  const res = await fetch("data/rules.json");
  if (res.ok) {
    rules = await res.json();
    document.getElementById("rules-copy").innerHTML =
      "<ul class='clean'>" +
      rules.ordinary_rules.map((r) => `<li><strong>${r.label}.</strong> ${r.summary}</li>`).join("") +
      `<li><strong>February and March.</strong> ${rules.february_march_rule.summary}</li>` +
      "</ul>";
    document.getElementById("source-list").innerHTML = rules.sources
      .map((s) => `<li><a href="${s.url}">${s.name}</a>. ${s.note}</li>`)
      .join("");
  }
  toggleRows();
  run();
}

init();
