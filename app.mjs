import {
  $,
  $$,
  action,
  copy,
  status,
  escapeHtml,
  debounce,
} from "./common.mjs";
import { jsonPath, toXml, toTypescript } from "./utils.mjs";
import { load as yamlLoad } from "./yaml.mjs";
let value = null,
  tree = true,
  output = "";
function xmlValue(el) {
  const children = [...el.children];
  if (!children.length) return el.textContent;
  const result = {};
  for (const child of children) {
    const v = xmlValue(child);
    if (Object.hasOwn(result, child.tagName))
      result[child.tagName] = Array.isArray(result[child.tagName])
        ? [...result[child.tagName], v]
        : [result[child.tagName], v];
    else result[child.tagName] = v;
  }
  for (const a of el.attributes) result["@" + a.name] = a.value;
  return result;
}
function parse(text) {
  if (text.length > 1000000) throw Error("输入超过 1 MB，请缩小内容后重试");
  const trimmed = text.trim();
  if (!trimmed) throw Error("请输入内容");
  try {
    return JSON.parse(trimmed);
  } catch {}
  if (trimmed.startsWith("<")) {
    const xml = new DOMParser().parseFromString(trimmed, "application/xml");
    if (xml.querySelector("parsererror")) throw Error("XML 格式错误");
    return { [xml.documentElement.tagName]: xmlValue(xml.documentElement) };
  }
  if (/^[^\s=&]+=[\s\S]+/.test(trimmed) && !trimmed.includes("\n"))
    return Object.fromEntries(new URLSearchParams(trimmed.replace(/^\?/, "")));
  const result = yamlLoad(trimmed);
  if (!result || typeof result !== "object")
    throw Error("不是有效的 JSON / YAML 对象");
  return result;
}
function node(v, key, depth = 0) {
  if (depth > 40) return "<span>…</span>";
  if (v && typeof v === "object") {
    const entries = Object.entries(v);
    return (
      '<details open><summary><span class="key">' +
      escapeHtml(key) +
      "</span> <small>" +
      (Array.isArray(v) ? "Array" : "Object") +
      " · " +
      entries.length +
      '</small></summary><div class="tree-children">' +
      entries.map(([k, x]) => node(x, k, depth + 1)).join("") +
      "</div></details>"
    );
  }
  return (
    '<div><span class="key">' +
    escapeHtml(key) +
    ': </span><span class="' +
    (typeof v === "string" ? "string" : "") +
    '">' +
    escapeHtml(JSON.stringify(v)) +
    "</span></div>"
  );
}
function show() {
  output = JSON.stringify(value, null, 2);
  $("#output").innerHTML = tree
    ? node(value, "root")
    : "<pre>" + escapeHtml(output) + "</pre>";
  status("解析成功 · " + output.length + " 字符");
}
function update() {
  value = parse($("#source").value);
  show();
}
$("#format").onclick = action(() => {
  update();
  $("#source").value = JSON.stringify(value, null, 2);
});
$("#minify").onclick = action(() => {
  update();
  return copy(JSON.stringify(value));
});
$("#escape").onclick = action(() => {
  update();
  return copy(JSON.stringify(JSON.stringify(value)));
});
$("#xml").onclick = action(() => {
  update();
  return copy(toXml(value));
});
$("#types").onclick = action(() => {
  update();
  return copy(toTypescript(value));
});
$("#copy").onclick = action(() => copy(output));
$("#tree").onclick = () => {
  tree = true;
  show();
};
$("#text").onclick = () => {
  tree = false;
  show();
};
$("#collapse").onclick = () =>
  $$("#output details").forEach((d) => (d.open = false));
$("#expand").onclick = () =>
  $$("#output details").forEach((d) => (d.open = true));
$("#apply").onclick = action(() => {
  value = jsonPath(parse($("#source").value), $("#filter").value);
  show();
});
$("#filter").onkeydown = (e) => {
  if (e.key === "Enter") $("#apply").click();
};
$("#source").oninput = debounce(action(update), 250);
$("#sample").onclick = () => {
  $("#source").value = JSON.stringify(
    { users: [{ id: 1, name: "MyTools", active: true }], version: "1.1.0" },
    null,
    2,
  );
  update();
};
$("#clear").onclick = () => {
  $("#source").value = "";
  $("#output").replaceChildren();
  output = "";
  status("");
};
$("#source").onkeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    $("#format").click();
  }
};
