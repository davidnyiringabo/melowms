import ChartCards from './chart';
import Report from './report';
import DashboardProvider from '../../context/DashboardContext';
import StatsConfig from './StatsConfig';
import VATInfo from './VATInfo';

const Index = () => {
  return (
    <DashboardProvider>
      <div className="flex flex-col gap-2 p-4">
        <StatsConfig />
        <VATInfo />
        <Report />
        <ChartCards />
      </div>
    </DashboardProvider>
  );
};

export default Index;
