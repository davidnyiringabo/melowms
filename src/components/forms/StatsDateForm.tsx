import { z } from 'zod';
import DynamicForm from './Form';
import { SubmitHandler } from 'react-hook-form';
import { useDashboard } from '../../context/DashboardContext';
import { StatsLevel } from '../../helpers/statsTree';
import { useModalContext } from '../../context/ModalContext';

const statsDateSchema = z.object({
  date: z.date().default(new Date()),
});

const StatsDateForm = () => {
  const { changeViewDate, viewDate } = useDashboard();
  const { handleClose } = useModalContext();
  const handleStatsDate: SubmitHandler<z.infer<typeof statsDateSchema>> = (
    data
  ) => {
    changeViewDate(data.date);
    handleClose();
  };

  return (
    <DynamicForm
      action={'View'}
      schema={statsDateSchema.extend({
        date: z.date().default(viewDate ?? new Date()),
      })}
      onSubmit={handleStatsDate}
    />
  );
};

export default StatsDateForm;
