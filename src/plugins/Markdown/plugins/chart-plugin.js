import { textPlugin } from './text-plugin';
import { renderEChart, buildEChartOptions } from '../DynamicEChart';

const CHART_REGEX = /```\s*chart\s*([\s\S]*?)\s*```/g;

function safeJsonParseChart(input) {
  if (!input || typeof input !== 'string') return null;
  try {
    return JSON.parse(input);
  } catch (_) {}

  try {
    // Try to normalize common non-JSON patterns (single quotes, trailing commas, comments)
    let normalized = input
      .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
      .replace(/([^:])\/\/.*$/gm, '$1') // line comments
      .replace(/'/g, '"') // single to double quotes
      .replace(/,\s*([}\]])/g, '$1'); // trailing commas
    return JSON.parse(normalized);
  } catch (err) {
    console.error('chart-plugin: failed to parse chart JSON', err);
    return null;
  }
}

function splitChartContent(content) {
  const matches = content.match(CHART_REGEX);
  if (!matches) return [{ type: 'text', content }];

  const sections = [];
  let lastIndex = 0;

  matches.forEach(match => {
    const index = content.indexOf(match, lastIndex);
    if (index > lastIndex) {
      sections.push({
        type: 'text',
        content: content.slice(lastIndex, index),
      });
    }

    const [, chartJson] = match.match(/```\s*chart\s*([\s\S]*?)\s*```/) || [];
    sections.push({ type: 'chart', content: (chartJson || '').trim() });

    lastIndex = index + match.length;
  });

  if (lastIndex < content.length) {
    sections.push({ type: 'text', content: content.slice(lastIndex) });
  }

  return sections;
}

function encodeSpec(spec) {
  try {
    return encodeURIComponent(JSON.stringify(spec));
  } catch {
    return '';
  }
}

function decodeSpec(encoded) {
  try {
    return JSON.parse(decodeURIComponent(encoded));
  } catch {
    return null;
  }
}

function initializeCharts(container) {
  const nodes = (container || document).querySelectorAll('[data-chart-plugin="true"][data-chart-spec]:not([data-chart-initialized="true"])');
  nodes.forEach(node => {
    const encoded = node.getAttribute('data-chart-spec');
    const spec = decodeSpec(encoded);
    if (!spec) return;
    try {
      const option = buildEChartOptions(spec);
      renderEChart(node, option, spec.theme || 'light');
      node.setAttribute('data-chart-initialized', 'true');
    } catch (err) {
      console.error('chart-plugin: failed to render chart', err);
    }
  });
}

export const chartPlugin = {
  name: 'chart',
  priority: 4,
  canHandle: content => {
    CHART_REGEX.lastIndex = 0;
    return CHART_REGEX.test(content);
  },
  render: content => {
    const sections = splitChartContent(content);

    const wrapper = document.createElement('div');
    wrapper.className = 'chart-content';

    sections.forEach((sec, i) => {
      if (sec.type === 'text') {
        if (sec.content) {
          const textDiv = document.createElement('div');
          textDiv.className = 'text-section';
          textDiv.innerHTML = textPlugin.render(sec.content);
          wrapper.appendChild(textDiv);
        }
      } else if (sec.type === 'chart') {
        const chartSpec = safeJsonParseChart(sec.content) || {};
        const chartDiv = document.createElement('div');
        chartDiv.className = 'chart-section';

        const canvasDiv = document.createElement('div');
        canvasDiv.className = 'echart-canvas';
        canvasDiv.style.width = '100%';
        canvasDiv.style.height = '400px';
        canvasDiv.style.margin = '0';
        canvasDiv.style.padding = '0 25px';
        canvasDiv.style.boxSizing = 'border-box';
        canvasDiv.setAttribute('data-chart-plugin', 'true');
        canvasDiv.setAttribute('data-chart-spec', encodeSpec(chartSpec));

        chartDiv.appendChild(canvasDiv);
        wrapper.appendChild(chartDiv);
      }
    });

    const html = wrapper.innerHTML;

    // Defer chart initialization to ensure nodes are in the DOM
    setTimeout(() => {
      // Try to scope initialization to the most recent render if possible
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const firstCandidate = temp.querySelector('[data-chart-plugin="true"]');
      if (firstCandidate) {
        // Fallback: scan the document
        initializeCharts(document);
      }
    }, 0);

    return html;
  },
};
