// Shared tooltip. Owner: C. (A wrote this working first version so the views can be
// integrated early; C restyles or rewrites it, keeping the show/move/hide API.)

let el;

function tip() {
  if (!el) el = d3.select('body').append('div').attr('class', 'tooltip').attr('role', 'status');
  return el;
}

// rows: [[label, value], ...] in the order from PROJECT.md (count, share, change, arrest rate)
export function show(event, { title, rows }) {
  tip()
    .style('display', 'block')
    .html(
      `<div class="tooltip-title">${title}</div>` +
      rows.map(([label, value]) => `<div class="tooltip-row"><span>${label}</span><b>${value}</b></div>`).join('')
    );
  move(event);
}

export function move(event) {
  const node = tip().node();
  const pad = 14;
  const { width, height } = node.getBoundingClientRect();
  let left = event.clientX + pad;
  let top = event.clientY + pad;
  if (left + width > window.innerWidth - 8) left = event.clientX - width - pad;
  if (top + height > window.innerHeight - 8) top = event.clientY - height - pad;
  tip().style('left', `${left}px`).style('top', `${top}px`);
}

export function hide() {
  tip().style('display', 'none');
}
