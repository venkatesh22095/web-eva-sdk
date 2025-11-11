import * as echarts from 'echarts';

export function buildEChartOptions(spec = {}) {
  const type = spec.type || 'line';
  const title = spec.title;
  const data = Array.isArray(spec.data) ? spec.data : [];
  const xKey = spec.xKey;
  const yKey = spec.yKey;
  const series = Array.isArray(spec.series) ? spec.series : [];
  const seriesKey = spec.seriesKey;

  const xData = xKey ? [...new Set(data.map(item => item?.[xKey]))] : [];

  let seriesData = [];

  if (Array.isArray(series) && series.length > 0) {
    seriesData = series.map(s => ({
      name: s.name,
      type: type === 'area' ? 'line' : type,
      data: xData.map(x => {
        const point = data.find(d => d?.[xKey] === x);
        return point && s.key in point ? point[s.key] : 0;
      }),
      areaStyle: type === 'area' ? {} : undefined,
      smooth: true,
    }));
  } else if (seriesKey) {
    const groupedData = data.reduce((acc, item) => {
      const key = item?.[seriesKey];
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    seriesData = Object.entries(groupedData).map(([name, group]) => ({
      name,
      type: type === 'area' ? 'line' : type,
      data: xData.map(x => {
        const found = group.find(i => i?.[xKey] === x);
        return found && yKey in found ? found[yKey] : 0;
      }),
      areaStyle: type === 'area' ? {} : undefined,
      smooth: true,
    }));
  }

  const hasTitle = !!title;
  const legendShow = type === 'pie' ? true : (Array.isArray(seriesData) && seriesData.length > 1);
  const legend = legendShow ? { top: hasTitle ? 40 : 10, left: 'center', data: seriesData.map(s => s.name) } : undefined;
  const gridTop = type === 'pie' ? undefined : (hasTitle && legendShow ? 80 : (hasTitle || legendShow ? 60 : 40));

  return {
    title: title ? { text: title, top: 10, left: 'left' } : undefined,
    tooltip: { trigger: type === 'pie' ? 'item' : 'axis' },
    legend,
    xAxis:
      type === 'pie'
        ? undefined
        : {
            type: 'category',
            data: xData,
            boundaryGap: type === 'bar',
          },
    yAxis:
      type === 'pie'
        ? undefined
        : {
            type: 'value',
          },
    grid: type === 'pie' ? undefined : { top: gridTop, left: 0, right: 0, bottom: 40, containLabel: true },
    series:
      type === 'pie'
        ? [
            {
              type: 'pie',
              radius: '50%',
              data: data.map(item => ({
                name: xKey ? item?.[xKey] : '',
                value: yKey ? item?.[yKey] : 0,
              })),
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
              },
            },
          ]
        : seriesData,
  };
}

export function renderEChart(container, option, theme = 'light') {
  if (!container) return null;
  try {
    if (container.__echartsInstance) {
      container.__echartsInstance.dispose();
      container.__echartsInstance = null;
    }
  } catch (_) {}

  const instance = echarts.init(container, theme);
  instance.setOption(option || {});
  container.__echartsInstance = instance;
  return instance;
}

export default { buildEChartOptions, renderEChart };
