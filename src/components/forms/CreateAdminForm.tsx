import cloudFunctionNames from '../../functionNames';
import { User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { useFunctions } from 'reactfire';
import { PropsWithPartialInstace, UserClaims } from '../../types';
import { z } from 'zod';
import { Companies } from '../../database';
import DynamicForm from './Form';
import { useCustomAuth } from '../../context/Auth';
import withAuthorization from '../hocs/withAuthorization';

const adminFormSchema = z.object({
  displayName: z.string().min(3),
  password: z
    .string()
    .min(6)
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/,
      'Password needs at least (1 letter, 1 digit and 1 special character)'
    )
    .default('123@Pass'),
  email: z.string().email(),
  tinnumber: z.string().length(9).regex(/\d{9}/).describe('query'),
  phoneNumber: z
    .string()
    .regex(
      /[^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$]?/,
      'Incorrect phone number format'
    )
    .optional()
    .or(z.literal('')),
  superAdmin: z.boolean().default(false),
});

type AdminFormSchemaType = z.infer<typeof adminFormSchema>;
type FirebaseError = { code: string; message: string; details: unknown | [] };

function CreateAdminForm({ instance }: PropsWithPartialInstace) {
  const { isSuperAdmin } = useCustomAuth();
  const [createAdminReponse, setCreateAdminResult] = useState<{
    data?: User | FirebaseError | undefined;
    loading: boolean;
    error?: FirebaseError;
  }>({ loading: false });

  const functions = useFunctions();

  const remoteCreateAdmin = httpsCallable<
    AdminFormSchemaType & { claims: UserClaims },
    User | FirebaseError
  >(functions, cloudFunctionNames.createAdmin);

  const handleCreateAdmin: SubmitHandler<AdminFormSchemaType> = async (
    data
  ) => {
    if (data.phoneNumber === '') {
      delete data.phoneNumber;
    } else {
      if (!data.phoneNumber?.startsWith('+')) {
        data.phoneNumber = '+25' + data.phoneNumber;
      }
    }

    setCreateAdminResult({
      loading: true,
      data: undefined,
    });
    try {
      const tinnumber = data.tinnumber;
      const superAdmin = data.superAdmin;
      let userClaims: UserClaims = { admin: true, tinnumber };
      if (superAdmin) {
        userClaims = { superAdmin: true };
      }
      const requestData: Partial<AdminFormSchemaType> = data;
      delete requestData.tinnumber;
      delete requestData.superAdmin;
      if (requestData.phoneNumber === '') {
        delete requestData.phoneNumber;
      }
      const result = await remoteCreateAdmin({
        ...(requestData as Required<AdminFormSchemaType>),
        claims: userClaims,
      });
      setCreateAdminResult({
        loading: false,
        data: result.data,
      });
      return null;
    } catch (error: any) {
      setCreateAdminResult({
        loading: false,
        error,
      });
      return Promise.reject('Failed');
    }
  };
  const companiesQuery = Companies.ref;

  return (
    <div className="w-full">
      {createAdminReponse.error ? (
        <>
          <div className="text-red-500 border-b bg-white p-2 rounded mx-auto w-full max-w-[300px] m-2">
            <div>{createAdminReponse.error.message}</div>
          </div>
        </>
      ) : (
        ''
      )}

      <DynamicForm
        schema={adminFormSchema}
        instance={instance}
        onSubmit={handleCreateAdmin}
        metadata={{
          displayName: { label: 'Full Name', placeholder: 'Your full name' },
          password: { password: true },
          superAdmin: { hidden: !isSuperAdmin },
          tinnumber: { query: companiesQuery, display: 'name' },
        }}
      />
    </div>
  );
}

export default withAuthorization({
  requiredClaims: { superAdmin: true },
  all: true,
})(CreateAdminForm);
