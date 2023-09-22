import React from 'react';
import { z } from 'zod';
import DynamicForm from './Form';
import { useTableContext } from '../../context/TableContext';
import moment from 'moment';

const rangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

const CustomRangeForm = ({ onCustom }: { onCustom: () => void }) => {
  const { startDate, endDate, handleUpdateRange } = useTableContext();
  return (
    <DynamicForm
      schema={rangeSchema.extend({
        startDate: z.date().default(startDate),
        endDate: z.date().default(endDate),
      })}
      onSubmit={(data) => {
        handleUpdateRange(
          moment(data.startDate).startOf('D').toDate(),
          moment(data.endDate).endOf('D').toDate()
        );
        onCustom();
      }}
    />
  );
};

export default CustomRangeForm;
