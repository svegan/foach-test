import PieChart from './pie-chart-engine';

const canvasContainer = document.getElementById('pie-chart');

const params = {
  total: 141,
  parts: [
    {
      color: '#5de100',
      size: 50
    },
    {
      color: '#baf300',
      size: 22
    },
    {
      color: '#3d9200',
      size: 69
    }
  ]
};

export default () => {
  return new PieChart(canvasContainer, params);
};
