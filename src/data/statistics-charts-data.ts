import chartsConfig from '../configs/charts-config';

export const makeChart = ({
  categories,
  data,
  color,
  title = 'Chart',
  description = '',
  footer = '',
  type = 'bar',
  name
}: {
  categories: string[];
  data: number[];
  color?: string;
  title: string;
  description?: string;
  footer?: string;
  name: string;
  type?: 'bar' | 'line'
}) => {
  return {
    title,
    description,
    footer,
    chart: {
      type,
      height: 220,
      series: [
        {
          name,
          data: data,
        },
      ],
      options: {
        ...chartsConfig,
        colors: ['#fff'],
        stroke: {
          lineCap: 'round',
        },
        markers: {
          size: 4,
        },
        xaxis: {
          ...chartsConfig.xaxis,
          categories: categories,
        },
      },
    },
  };
};

export type statisticsChart = {
  color?: string;
  chart: object;
  title: string;
  description: string;
  footer?: any;
};
