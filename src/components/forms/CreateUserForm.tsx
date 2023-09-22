import cloudFunctionNames from '../../functionNames';
import { User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { SubmitHandler } from 'react-hook-form';
import { useFunctions } from 'reactfire';
import { PropsWithPartialInstace, UserClaims } from '../../types';
import { z } from 'zod';
import { useCustomAuth } from '../../context/Auth';
import { toast } from 'react-hot-toast';
import { Branches, Companies } from '../../database';
import DynamicForm from './Form';

const passwordConfig = z
  .string()
  .min(6)
  .regex(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/,
    'Password needs at least (1 letter, 1 digit and 1 special character)'
  );

export const userFormSchema = z.object({
  displayName: z.string().min(3),
  password: passwordConfig,
  email: z.string().email(),
  phoneNumber: z
    .string()
    .regex(
      /[^(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$]?/,
      'Incorrect phone number format'
    )
    .optional()
    .or(z.literal('')),
  emailVerified: z.boolean().default(false),
  manager: z.boolean().default(false),
  branch: z.string().min(1).describe('query'),
});

type UserFormSchemaType = z.infer<typeof userFormSchema>;

type Mutable<Type> = {
  readonly [Key in keyof Type]: Type[Key];
};

export type UserFields = Pick<
  Mutable<User>,
  'displayName' | 'email' | 'emailVerified'
> & { password: string; phoneNumber: undefined | string };

type FirebaseError = { code: string; message: string; details: unknown | [] };

const CreateUserForm = ({ instance }: PropsWithPartialInstace) => {
  const { tinnumber, isAdmin, branch } = useCustomAuth();
  const functions = useFunctions();

  const remoteCreateUser = httpsCallable<
    UserFormSchemaType & { claims: UserClaims },
    User | FirebaseError
  >(
    functions,
    instance ? cloudFunctionNames.updateUser : cloudFunctionNames.createUser
  );

  const handleCreateUser: SubmitHandler<UserFormSchemaType> = async (data) => {
    const selectedBranch = data.branch;
    const isManager = data.manager;
    ['phoneNumber', 'password'].forEach((k) => {
      if ((data as any)[k] === '') {
        delete (data as any)[k];
      }
    });
    if (data.phoneNumber && !data.phoneNumber?.startsWith('+')) {
      data.phoneNumber = '+25' + data.phoneNumber;
    }

    delete (data as Partial<UserFormSchemaType>).branch;
    delete (data as Partial<UserFormSchemaType>).manager;
    return await remoteCreateUser({
      ...(!instance
        ? (data as Required<UserFormSchemaType>)
        : { ...data, uid: instance.id }),
      claims: {
        tinnumber: tinnumber as string,
        manager: !!isManager,
        branch: selectedBranch as string,
      },
    })
      .then(() => {
        toast.success(
          `User was ${instance ? 'updated' : 'created'} successfully!`
        );
        return;
      })
      .catch((error) => {
        toast.error(error.message);

        return Promise.reject();
      });
  };

  const brachQuery = Companies.doc(tinnumber as string).sub(Branches).ref;

  return (
    <DynamicForm
      instance={instance}
      schema={userFormSchema.extend({
        password: instance
          ? passwordConfig.optional().or(z.literal(''))
          : passwordConfig,
        branch: branch
          ? z.literal(branch)
          : z.string().min(1).describe('query'),
        ...(instance
          ? {
              disabled: z.boolean().default(false),
            }
          : {}),
        manager: isAdmin ? z.boolean().default(true) : z.literal(false),
      })}
      onSubmit={handleCreateUser as any}
      metadata={{
        displayName: { label: 'Full Name', placeholder: 'full name' },
        manager: { warningText: 'This will make the user a branch manager.' },
        disabled: {
          label: 'Disable Account',
          warningText: 'This will prevent the user from using their account.',
        },
        password: { password: true, hidden: !!instance },
        branch: { query: brachQuery, display: 'name' },
        emailVerified: { hidden: true },
      }}
    />
  );
};

export default CreateUserForm;
