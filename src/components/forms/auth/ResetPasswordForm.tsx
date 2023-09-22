import React, { useState } from 'react';
import { z } from 'zod';
import DynamicForm from '../Form';
import { SubmitHandler } from 'react-hook-form';
import { httpsCallable } from 'firebase/functions';
import { useFunctions } from 'reactfire';
import cloudFunctionNames from '../../../functionNames';
import { toast } from 'react-hot-toast';

const resetPasswordSchema = z.object({
  yourEmail: z.string().email(),
});

const ResetPasswordForm = () => {
  const remoteResetPassword = httpsCallable(
    useFunctions(),
    cloudFunctionNames.resetPassword
  );

  const handleResetPassword: SubmitHandler<
    z.infer<typeof resetPasswordSchema>
  > = async (data) => {
    data.yourEmail;
    try {
      await remoteResetPassword({ email: data.yourEmail });
      toast.success('Check your email for reset link. Or try again!', {
        duration: 1000 * 60,
      });
    } catch (error: any) {
      toast.error(error.message);
      return Promise.reject();
    }
  };

  return (
    <DynamicForm
      onSubmit={handleResetPassword}
      action={'Send Reset Email'}
      schema={resetPasswordSchema}
    />
  );
};

export default ResetPasswordForm;
