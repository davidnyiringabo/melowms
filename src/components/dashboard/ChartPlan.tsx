// const Chart = await import('react-apexcharts');
import Chart from 'react-apexcharts'

export default function ChartPlan() {   
  const options: any = {
    options: {
      chart: {
        id: 'mychart',
        type: 'area',
        toolbar: {
          show: false,
        },
      },
      xaxis: {
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
      },
      stroke: {
        curve: 'smooth',
      },
      tooltip: {
        theme: 'dark',
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
      },
      dataLabels: {
        enabled: false,
      },
    },
    series: [
      {
        name: 'Sales',
        data: [30, 40, 25, 50, 49, 21, 70, 51, 49, 38, 60, 55],
      },
      {
        name: 'Profit',
        data: [10, 20, 12, 35, 41, 15, 40, 21, 19, 28, 30, 25],
      },
    ],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 90, 100],
      },
    },
  };
  return <Chart {...options} height={350} />;
}
