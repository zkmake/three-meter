/**
 * The Lucide marks the HUD chrome uses, inlined so the package carries no
 * icon dependency. The markup is static, so nothing user-supplied reaches it.
 */
type IconName = "blend" | "contrast" | "grip" | "monitor" | "moon" | "sliders" | "sun";

const ICON_MARKUP: Record<IconName, string> = {
  blend: '<circle cx="9" cy="9" r="7"/><circle cx="15" cy="15" r="7"/>',
  contrast: '<circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/>',
  grip:
    '<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/>' +
    '<circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',
  monitor:
    '<rect width="20" height="14" x="2" y="3" rx="2"/>' +
    '<line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun:
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/>' +
    '<path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>' +
    '<path d="M2 12h2"/><path d="M20 12h2"/>' +
    '<path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  sliders:
    '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/>' +
    '<line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/>' +
    '<line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/>' +
    '<line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/>' +
    '<line x1="16" x2="16" y1="18" y2="22"/>',
};

const createIcon = (name: IconName, className: string) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", className);
  svg.innerHTML = ICON_MARKUP[name];

  return svg;
};

export { createIcon };
export type { IconName };
