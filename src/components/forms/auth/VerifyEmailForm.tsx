import React, { useState } from 'react';
import { z } from 'zod';
import DynamicForm from '../Form';
import { SubmitHandler } from 'react-hook-form';
import { httpsCallable } from 'firebase/functions';
import { useFunctions } from 'reactfire';
import cloudFunctionNames from '../../../functionNames';
import { toast } from 'react-hot-toast';

const verifyEmailSchema = z.object({
  yourEmail: z.string().email(),
});

const VerifyEmailForm = () => {
  const remoteVerifyEmail = httpsCallable(
    useFunctions(),
    cloudFunctionNames.verifyEmail
  );

  const handleVerifyEmail: SubmitHandler<
    z.infer<typeof verifyEmailSchema>
  > = async (data) => {
    data.yourEmail;
    try {
      await remoteVerifyEmail({ email: data.yourEmail });
      toast.success('Check your email for verification link. Or try again!', {
        duration: 1000 * 60,
      });
    } catch (error: any) {
      toast.error(error.message);
      return Promise.reject();
    }
  };

  return (
    <DynamicForm
      onSubmit={handleVerifyEmail}
      action={'Send verification email'}
      schema={verifyEmailSchema}
    />
  );
};

export default VerifyEmailForm;
